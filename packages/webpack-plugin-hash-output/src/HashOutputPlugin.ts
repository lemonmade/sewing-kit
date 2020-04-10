import * as fs from 'fs';
import * as crypto from 'crypto';
import type {Plugin, Compiler, compilation} from 'webpack';

interface WebpackAsset {
  _name?: string;
  _source?: string;
  _cachedSource?: string;
  _value?: string;
  children?: WebpackAsset[];
  source(): string;
}

type HashFunction = (input: string) => {fullHash: string; shortHash: string};

interface HashReplacement {
  chunk: any;
  oldHash: string;
  newHash: string;
}

export class HashOutputPlugin implements Plugin {
  private readonly validateOutput: boolean;
  private readonly validateOutputRegex: RegExp;

  constructor({validateOutput = false, validateOutputRegex = /^.*$/} = {}) {
    this.validateOutput = validateOutput;
    this.validateOutputRegex = validateOutputRegex;
  }

  apply(compiler: Compiler) {
    let hashFn!: HashFunction;

    compiler.hooks.compilation.tap('OutputHash', (compilation) => {
      const {outputOptions} = compilation;
      const {
        hashFunction,
        hashDigest,
        hashDigestLength,
        hashSalt,
      } = outputOptions;

      // Reuses webpack options
      hashFn = (input) => {
        const hashObj = crypto.createHash(hashFunction).update(input);
        if (hashSalt) hashObj.update(hashSalt);
        const fullHash = hashObj.digest(hashDigest);
        return {fullHash, shortHash: fullHash.substr(0, hashDigestLength)};
      };

      // TODO this code was in the original version, but I removed it and all the tests passed /shrug
      //
      // Webpack does not pass chunks and assets to any compilation step, but we need both.
      // To get them, we hook into 'optimize-chunk-assets' and save the chunks for processing
      // them later.
      // compilation.hooks.afterOptimizeChunks.tap(
      //   'Capture chunks',
      //   (chunks, chunkGroups) => {
      //     this.chunks = chunks;
      //     this.chunkGroups = chunkGroups;
      //   },
      // );

      compilation.hooks.afterOptimizeAssets.tap(
        'Update chunks',
        (compilationAssets) => {
          const assets: {
            [key: string]: WebpackAsset;
          } = compilationAssets as any;
          const hashReplacements: HashReplacement[] = [];

          const sortedChunks = [...compilation.chunks].sort(
            (aChunk, bChunk) => {
              const aEntry = aChunk.hasRuntime();
              const bEntry = bChunk.hasRuntime();
              if (aEntry && !bEntry) return 1;
              if (!aEntry && bEntry) return -1;
              return sortChunksById(aChunk, bChunk);
            },
          );

          sortedChunks.forEach((chunk) => {
            replaceOldHashForNewInChunkFiles(chunk, assets, hashReplacements);

            const result = reHashCssAsset(chunk, assets, hashFn);
            if (result) {
              const {newHash, oldHash} = result;
              hashReplacements.push({chunk, oldHash, newHash});
            }
          });

          sortedChunks.forEach((chunk) => {
            replaceOldHashForNewInChunkFiles(chunk, assets, hashReplacements);
            const {newHash, oldHash} = reHashChunk(chunk, assets, hashFn);
            hashReplacements.push({
              chunk,
              oldHash: oldHash!,
              newHash: newHash!,
            });
          });
        },
      );
    });

    if (this.validateOutput) {
      compiler.hooks.afterEmit.tapAsync(
        'Validate output',
        (compilation, callback) => {
          let err: Error | undefined;

          Object.keys(compilation.assets)
            .filter((assetName) => assetName.match(this.validateOutputRegex))
            .forEach((assetName) => {
              const asset = compilation.assets[assetName];
              const path = asset.existsAt;
              const assetContent = fs.readFileSync(path, 'utf8');
              const {shortHash} = hashFn(assetContent);
              if (!assetName.includes(shortHash)) {
                err = new Error(
                  `The hash in ${assetName} does not match the hash of the content (${shortHash})`,
                );
              }
            });
          return callback(err);
        },
      );
    }
  }
}

/**
 * Replaces a string in an asset
 */
function replaceStringInAsset(
  asset: string | WebpackAsset,
  sourceRE: RegExp,
  target: string,
) {
  if (typeof asset === 'string') {
    return asset.replace(sourceRE, target);
  }

  // ReplaceSource
  if ('_source' in asset) {
    asset._source = replaceStringInAsset(
      asset._source!,
      sourceRE,
      target,
    ) as string;
    return asset;
  }

  // CachedSource
  if ('_cachedSource' in asset) {
    asset._cachedSource = asset.source().replace(sourceRE, target);
    return asset;
  }

  // RawSource / SourceMapSource
  if ('_value' in asset) {
    asset._value = asset.source().replace(sourceRE, target);
    return asset;
  }

  // ConcatSource
  if ('children' in asset) {
    asset.children = asset.children!.map(
      (child) => replaceStringInAsset(child, sourceRE, target) as WebpackAsset,
    );
    return asset;
  }

  throw new Error(
    `Unknown asset type (${asset.constructor.name})!. ` +
      'Unfortunately this type of asset is not supported yet. ' +
      'Please raise an issue and we will look into it asap',
  );
}

/**
 * Computes the new hash of a chunk.
 *
 * This function updates the *name* of the main file (i.e. source code), and the *content* of the
 * secondary files (i.e source maps)
 */
function reHashChunk(
  chunk: compilation.Chunk,
  assets: {[key: string]: WebpackAsset},
  hashFn: HashFunction,
): Partial<Pick<HashReplacement, 'newHash' | 'oldHash'>> {
  const oldHash = chunk.renderedHash!;
  const fileIndex = chunk.files.findIndex((file) => file.endsWith('.js'));
  if (fileIndex === -1) {
    return {};
  }

  const oldChunkName = chunk.files[fileIndex];
  const asset = assets[oldChunkName];
  const {fullHash, shortHash} = hashFn(asset.source());
  const newChunkName = oldChunkName.replace(oldHash, shortHash);

  // Update the main file of the chunk with the new name
  chunk.hash = fullHash;
  chunk.renderedHash = shortHash;
  chunk.files[fileIndex] = newChunkName;

  // Update the asset associated with that file
  asset._name = newChunkName;
  delete assets[oldChunkName];
  assets[newChunkName] = asset;

  // Update the content of the rest of the files in the chunk
  chunk.files
    .filter((file) => file !== newChunkName)
    .forEach((file) => {
      const secondaryAsset = assets[file];
      replaceStringInAsset(secondaryAsset, new RegExp(oldHash, 'g'), shortHash);
    });

  return {
    oldHash,
    newHash: shortHash,
  };
}

function getMiniCssContentHashKey(chunk: compilation.Chunk) {
  return Object.keys(chunk.contentHash).find(
    (hashType) =>
      hashType.includes('css/mini-extract') ||
      hashType.includes('/mini-css-extract-plugin/'),
  );
}

/**
 * Computes the new hash of a CssModule.
 *
 * This function updates the *name* of the main file (i.e. source code), and the *content* of the
 * secondary files (i.e source maps)
 */
function reHashCssAsset(
  chunk: compilation.Chunk,
  assets: {[key: string]: WebpackAsset},
  hashFn: HashFunction,
) {
  const cssModule = Array.from(chunk.modulesIterable).find(
    (module) => module.constructor.name === 'CssModule',
  );
  if (!cssModule) {
    return false;
  }

  const miniCssKey = getMiniCssContentHashKey(chunk)!;
  const oldHash = (chunk.contentHash as {[key: string]: string})[miniCssKey];
  const fileIndex = chunk.files.findIndex((asset) => asset.match(oldHash));
  if (fileIndex === -1) {
    throw new Error(
      'Asset file not found for CssModule hash. Please use [contenthash] in MiniCssExtractPlugin placeholders.',
    );
  }

  const oldName = chunk.files[fileIndex];
  const asset = assets[oldName];
  const {fullHash, shortHash} = hashFn(asset.source());
  const newName = oldName.replace(oldHash, shortHash);

  // Update the CssModule's associated file name / hash
  cssModule.hash = fullHash;
  cssModule.renderedHash = shortHash;
  (chunk.contentHash as any)[miniCssKey] = shortHash;
  chunk.files[fileIndex] = newName;

  // Update the asset associated with that file
  delete assets[oldName];
  assets[newName] = asset;

  // Update the content of the rest of the files in the chunk
  chunk.files
    .filter((file) => file !== newName)
    .forEach((file) => {
      const secondaryAsset = assets[file];
      replaceStringInAsset(secondaryAsset, new RegExp(oldHash, 'g'), shortHash);
    });

  return {
    oldHash,
    newHash: shortHash,
  };
}

/**
 * Replaces old hashes for new hashes in chunk files.
 *
 * This function iterates through file contents and replaces all the ocurrences of old hashes
 * for new ones. We assume hashes are unique enough, so that we don't accidentally hit a
 * collision and replace existing data.
 */
function replaceOldHashForNewInChunkFiles(
  chunk: compilation.Chunk,
  assets: {[key: string]: WebpackAsset},
  hashReplacements: HashReplacement[],
) {
  chunk.files.forEach((file) => {
    hashReplacements.forEach(({chunk: aChunk, oldHash, newHash}) => {
      if (chunk.hasRuntime()) {
        replaceStringInAsset(
          assets[file],
          new RegExp(
            `(?:\\b|'|")${aChunk.id}['"]?:\\s*['"]${oldHash}['"]`,
            'g',
          ),
          `"${aChunk.id}":"${newHash}"`,
        );
      } else {
        replaceStringInAsset(assets[file], new RegExp(oldHash, 'g'), newHash);
      }
    });
  });
}

function sortChunksById(
  chunkOne: compilation.Chunk,
  chunkTwo: compilation.Chunk,
) {
  if (chunkOne.id! < chunkTwo.id!) return -1;
  if (chunkOne.id! > chunkTwo.id!) return 1;
  return 0;
}
