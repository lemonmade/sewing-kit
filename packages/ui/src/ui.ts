import {clearScreenDown, clearLine, moveCursor, cursorTo} from 'readline';
import {link} from 'ansi-escapes';
import chalk from 'chalk';
import {supportsHyperlink} from 'supports-hyperlinks';

interface Options {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
}

const CHALK_MAPPINGS = new Map([
  ['success', 'green'],
  ['error', 'red'],
  ['info', 'blue'],
  ['subdued', 'dim'],
  ['emphasis', 'bold'],
  ['code', 'inverse'],
  ['command', 'bold'],
]);

function createFormatter(stream: NodeJS.WriteStream) {
  const supportsLinks = supportsHyperlink(stream);

  const formatString = (str: string) => {
    const formattingRegex = /\{(success|error|info|subdued|emphasis|code|command)/g;
    const linkRegex = /\{link\s+(.*?)(?=http)([^}])*\}/;

    return str
      .replace(formattingRegex, (_, format) => {
        return `{${CHALK_MAPPINGS.get(format)}`;
      })
      .replace(linkRegex, (_, text: string, url: string) => {
        return supportsLinks
          ? link(text.trim(), url)
          : `${text.trim()} (${url})`;
      });
  };

  const processInterpolation = (interpolated: Loggable) => {
    return typeof interpolated === 'function'
      ? interpolated(formatter)
      : interpolated || '';
  };

  const formatter = (
    strings: TemplateStringsArray,
    ...interpolated: Loggable[]
  ): string => {
    const newStrings = strings.map(formatString);
    (newStrings as any).raw = newStrings;

    return chalk(newStrings as any, ...interpolated.map(processInterpolation));
  };

  return formatter;
}

type Formatter = ReturnType<typeof createFormatter>;
export type Loggable = ((format: Formatter) => string) | string;

class FormattedStream {
  private readonly formatter: Formatter;

  constructor(private readonly stream: NodeJS.WriteStream) {
    this.formatter = createFormatter(stream);
  }

  stringify(value: Loggable) {
    return typeof value === 'function' ? value(this.formatter) : String(value);
  }

  write(value: Loggable) {
    const stringified = this.stringify(value);
    this.stream.write(stringified);
    return stringified;
  }

  moveCursor(x = 0, y = 0) {
    moveCursor(this.stream, x, y);
    cursorTo(this.stream, x);
  }

  clearDown() {
    clearScreenDown(this.stream);
    clearLine(this.stream, 0);
  }
}

export class Ui {
  readonly stdout: FormattedStream;
  readonly stderr: FormattedStream;

  constructor({
    stdout = process.stdout,
    stderr = process.stderr,
  }: Partial<Options> = {}) {
    this.stdout = new FormattedStream(stdout);
    this.stderr = new FormattedStream(stderr);
  }

  async spin(_label: Loggable, wait: () => void) {
    await wait();
  }

  log(value: Loggable) {
    this.stdout.write(value);
    this.stdout.write('\n');
  }

  error(value: Loggable) {
    this.stderr.write(value);
    this.stderr.write('\n');
  }
}
