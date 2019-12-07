export interface PluginApi {
  read(path: string): Promise<string>;
  write(path: string, contents: string): Promise<void>;
  resolvePath(...parts: string[]): string;
  configPath(...parts: string[]): string;
  cachePath(...parts: string[]): string;
}
