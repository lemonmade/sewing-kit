declare module 'supports-hyperlinks' {
  export function supportsHyperlink(
    stream: NodeJS.ReadStream | NodeJS.WriteStream,
  ): boolean;
}
