import { Options as AcornOptions } from 'acorn';

declare global {
  type UnionToTuple<T, R extends any[] = []> = [T] extends [never]
    ? R
    : UnionToTuple<Exclude<T, T extends any ? T : never>, [...R, T extends any ? T : never]>;

  interface __OPTS__ {
    variables: Record<string, any>;
    ecmaVersion: AcornOptions['ecmaVersion'];
    sourceType: AcornOptions['sourceType'];
  }
}
