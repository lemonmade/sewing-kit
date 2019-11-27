import exec from 'execa';

import {Step, StepRunner as NestedStepRunner} from '@sewing-kit/types';
import {Ui, Loggable} from './ui';
import {DiagnosticError} from './errors';

enum StepState {
  InProgress,
  Failure,
  Success,
  Pending,
  Skipped,
}

type Update = () => void;

const symbols = '⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆';

class StepRunner {
  private state = StepState.Pending;
  private readonly stepRunners: StepRunner[] = [];

  constructor(private readonly step: Step, private readonly update: Update) {
    for (const subStep of step.steps || []) {
      const stepRunner = new StepRunner(subStep, this.update);
      this.stepRunners.push(stepRunner);
    }
  }

  async run(ui: Ui, skip: string[]) {
    if (this.step.skip(skip)) {
      this.setState(StepState.Skipped);
      return;
    }

    this.setState(StepState.InProgress);

    try {
      const runner: NestedStepRunner = {
        exec,
        log(loggable, _logLevel) {
          ui.log(loggable);
        },
      };

      if (this.step.run) {
        await this.step.run(runner);
      }

      for (const stepRunner of this.stepRunners) {
        await stepRunner.run(ui, skip);
      }

      this.setState(StepState.Success);
    } catch (error) {
      this.setState(StepState.Failure);
      throw error;
    }
  }

  toString(tick: number): Loggable {
    if (this.step.label == null || this.step.indefinite) {
      return '';
    }

    return (fmt) => {
      let prefix = '';

      switch (this.state) {
        case StepState.InProgress:
          prefix = fmt`{info ${symbols[tick % symbols.length]}}`;
          break;
        case StepState.Success:
          prefix = fmt`{success ✓}`;
          break;
        case StepState.Failure:
          prefix = fmt`{error ✕}`;
          break;
        case StepState.Pending:
          prefix = fmt`{subdued o}`;
          break;
        case StepState.Skipped:
          prefix = fmt`{subdued ⇥}`;
          break;
      }

      const ownLine = fmt`${prefix} ${fmt`${this.step.label || ''}`}`;

      if (this.state !== StepState.InProgress) {
        return ownLine;
      }

      const childLines = this.stepRunners
        .map((step) => fmt`${step.toString(tick)}`)
        .filter(Boolean);
      return `${ownLine}${childLines.length > 0 ? '\n  ' : ''}${childLines.join(
        '\n  ',
      )}`;
    };
  }

  private setState(state: StepState) {
    this.state = state;
    this.update();
  }
}

interface StepGroup {
  steps: Step[];
  skip: string[];
}

class StepGroupRunner {
  readonly stepRunners: StepRunner[] = [];

  constructor(
    private readonly group: StepGroup,
    private readonly update: Update,
  ) {}

  async run(ui: Ui) {
    for (const step of this.group.steps) {
      this.stepRunners.push(new StepRunner(step, this.update));
    }

    for (const step of this.stepRunners) {
      await step.run(ui, this.group.skip);
    }
  }

  toString(tick: number): Loggable {
    return (fmt) =>
      this.stepRunners
        .map((step) => fmt`${step.toString(tick)}`)
        .filter(Boolean)
        .join('\n');
  }
}

class RunnerUi {
  private tick = 0;
  private groupRunners: StepGroupRunner[] = [];
  private lastContentHeight = 0;

  constructor(private readonly groups: StepGroup[], private readonly ui: Ui) {}

  async run() {
    for (const group of this.groups) {
      this.groupRunners.push(new StepGroupRunner(group, this.update));
    }

    const frame = () => {
      this.update();
      this.tick += 1;
    };

    const interval: any = setInterval(frame, 60);
    const immediate = setImmediate(frame);

    try {
      for (const groupRunner of this.groupRunners) {
        await groupRunner.run(this.ui);
      }
    } finally {
      clearInterval(interval);
      clearImmediate(immediate);
      this.update();

      if (this.lastContentHeight > 0) {
        this.ui.stdout.write('\n');
      }
    }
  }

  private update = () => {
    const content = this.ui.stdout.stringify((fmt) =>
      this.groupRunners
        .map((group) => fmt`${group.toString(this.tick)}`)
        .filter(Boolean)
        .join('\n\n'),
    );

    this.ui.stdout.moveCursor(0, -1 * Math.max(0, this.lastContentHeight - 1));
    this.ui.stdout.clearDown();
    this.ui.stdout.write(content);

    this.lastContentHeight = content.split('\n').length;
  };
}

interface RunOptions {
  ui: Ui;
  pre?: Step[];
  post?: Step[];
  skip?: string[];
  skipPre?: string[];
  skipPost?: string[];
  title?: string;
}

export async function run(
  steps: Step[],
  {
    ui,
    pre = [],
    post = [],
    skip = [],
    skipPre = [],
    skipPost = [],
    title,
  }: RunOptions,
) {
  if (pre.length + steps.length + post.length === 0) {
    return;
  }

  const runnerUi = new RunnerUi(
    [{steps: pre, skip: skipPre}, {steps, skip}, {steps: post, skip: skipPost}],
    ui,
  );

  try {
    if (title) {
      ui.log((fmt) => fmt`🧵 {emphasis ${title}}\n`);
    }

    await runnerUi.run();
  } catch (error) {
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
        ui.error((fmt) => fmt`{subdued ${error.stack}}`);
      }
    } else {
      ui.error(
        (fmt) =>
          fmt`🧵 The following unexpected error occurred. We want to provide more useful suggestions when errors occur, so please open an issue on {link the sewing-kit repo https://github.com/Shopify/sewing-kit} so that we can improve this message.`,
      );
      // ui.log(error.message);

      if (error.all == null) {
        ui.error(error.stack);
      } else {
        ui.error(error.all);
        ui.error(error.stack);
      }
    }

    process.exitCode = 1;
  }
}
