import {Ui} from './ui';

type FirstArgument<T> = T extends (arg: infer U, ...rest: any[]) => any
  ? U
  : never;

interface DiagnosticErrorOptions {
  title?: string;
  content?: FirstArgument<Ui['log']>;
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

export function logError(error: any, ui: Ui) {
  if (error instanceof DiagnosticError) {
    ui.error('\n');
    ui.error(
      (fmt) =>
        fmt`{error Error} ${error.title || 'An unexpected error occurred'}`,
    );

    if (error.content) {
      ui.error('\n');
      ui.error(error.content);
    }

    if (error.suggestion) {
      ui.error('\n');
      ui.error((fmt) => fmt`{emphasis What do I do next?}`);
      ui.error(error.suggestion);
    }

    if (error.stack) {
      ui.error('\n');
      ui.error((fmt) => fmt`{subdued ${error.stack!}}`);
    }
  } else {
    ui.error(
      (fmt) =>
        fmt`🧵 The following unexpected error occurred. We want to provide more useful suggestions when errors occur, so please open an issue on {link the sewing-kit repo https://github.com/Shopify/sewing-kit} so that we can improve this message.`,
    );
    // ui.log(error.message);

    if (error.all != null) {
      ui.error(error.all);
      ui.error(error.stack);
    } else if (error.stderr != null) {
      ui.error(error.stderr);
      ui.error(error.stack);
    } else if (error.stdout == null) {
      ui.error(error.stack);
    } else {
      ui.error(error.stdout);
      ui.error(error.stack);
    }
  }
}
