export type ExportStyle = 'simple' | 'document';

export interface SimpleDocument {
  id: string;
  source: string;
  name?: string;
}
