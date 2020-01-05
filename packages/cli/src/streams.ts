import {Writable, Readable} from 'stream';

const BUFFER_LINES = 100;

export class StreamController {
  readonly stdout: Writable;
  readonly stderr: Writable;
  readonly stdin: Readable = {} as any;

  private foregrounded = false;
  private bufferLineCount = 0;
  private buffer = '';

  constructor(
    private readonly realStdout: NodeJS.WritableStream,
    realStderr: NodeJS.WritableStream,
  ) {
    this.stdout = this.createWritable(realStdout);
    this.stderr = this.createWritable(realStderr);
  }

  foreground() {
    this.foregrounded = true;
    this.realStdout.write(this.buffer);
    this.buffer = '';
  }

  background() {
    this.foregrounded = false;
  }

  private createWritable(stream: NodeJS.WritableStream) {
    return new Writable({
      write: (content, encoding, callback) => {
        const {foregrounded} = this;

        if (foregrounded) {
          stream.write(content, encoding, callback);
        } else {
          const stringContent: string = content.toString();
          const lines = stringContent.split('\n');

          if (this.bufferLineCount + lines.length < BUFFER_LINES) {
            this.buffer += stringContent;
            this.bufferLineCount += lines.length;
          } else {
            const currentLines = this.buffer.split('\n');
            const currentLinesToKeep = currentLines.slice(
              this.bufferLineCount - (BUFFER_LINES - lines.length),
            );
            const newLinesToKeep =
              lines.length <= BUFFER_LINES
                ? lines
                : lines.slice(0, BUFFER_LINES);

            this.buffer = [...currentLinesToKeep, ...newLinesToKeep].join('\n');
            this.bufferLineCount =
              currentLinesToKeep.length + newLinesToKeep.length;
          }

          callback();
        }
      },
    });
  }
}
