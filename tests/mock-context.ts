import { normalize } from '@/compiler/normalizer.js';
import { TransformPluginContext } from 'rollup';

export const mockContext = (options?: __OPTS__): Context => {
  const opts = normalize(options);
  if (typeof opts === 'string') {
    throw new Error(opts);
  }
  return {
    this: {
      warn: console.warn,
      error: (o) => {
        throw new Error(typeof o === 'string' ? o : o.message);
      },
    } as TransformPluginContext,
    options: opts,
  };
};
