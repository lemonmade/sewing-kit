import {
  DiagnosticError,
  isDiagnosticError,
  Loggable,
  Log,
  LogOptions,
  LogLevel,
} from '..';

const content: Loggable = ['This is what happened', 'and this'];

describe('DiagnosticError', () => {
  const title = 'An error happened';
  const suggestion: Loggable = 'This is what you can do about it';
  it('defines a DiagnosticError', () => {
    const err = new DiagnosticError({title, content, suggestion});
    expect(isDiagnosticError(err)).toBe(true);
    expect(err.title).toMatch(title);
    expect(err.content).toMatchObject(content);
    expect(err.suggestion).toMatch(suggestion);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toMatch(Error.name);
    expect(err.message).toMatch(title);
    expect(err.stack).toBeDefined();
  });
});
describe('Loggable', () => {
  const print = jest.fn();
  const log: Log = (loggable: Loggable, options?: LogOptions) => {
    if (options?.level === LogLevel.Debug) print(loggable);
  };
  it('logs a Loggable', () => {
    log(content, {level: LogLevel.Debug});
    expect(print).toHaveBeenCalled();
  });
});
