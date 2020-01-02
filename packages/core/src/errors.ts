import {Loggable} from './types';

interface DiagnosticErrorOptions {
  title?: string;
  content?: Loggable;
  suggestion?: Loggable;
}

const ID = Symbol.for('SewingKit.DiagnosticError');

// We could use instanceof to detect this, but this convenience protects
// against potentially nested versions of @sewing-kit/core
export function isDiagnosticError(value: unknown) {
  return Boolean((value as any)?.[ID]);
}

export class DiagnosticError extends Error {
  readonly [ID] = true;
  readonly suggestion: DiagnosticErrorOptions['suggestion'];
  readonly title: DiagnosticErrorOptions['title'];
  readonly content: DiagnosticErrorOptions['content'];

  constructor({title, content, suggestion}: DiagnosticErrorOptions) {
    super(title);
    this.title = title;
    this.content = content;
    this.suggestion = suggestion;
  }
}
