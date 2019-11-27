export type OptionBuilder<T> = {
  -readonly [P in keyof T]?: NonNullable<T[P]> extends ReadonlyArray<infer U>
    ? U[]
    : T[P];
};
