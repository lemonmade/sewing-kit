import {FirstArgument} from '@shopify/useful-types';
import {Ui} from './ui';

interface DiagnosticErrorOptions {
  title?: string;
  content?: string;
  suggestion?: FirstArgument<Ui['log']>;
}

export class DiagnosticError extends Error {
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
