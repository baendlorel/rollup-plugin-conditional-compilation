import { describe, it, expect } from 'vitest';
import { normalize } from '@/compiler/normalizer.js';

describe('plugin options error', () => {
  it('should throw error for invalid ecmaVersion', () => {
    expect(normalize({ ecmaVersion: 'invalid' })).toBeTypeOf('string');
  });

  it('should throw error for missing required variables', () => {
    expect(normalize({ variables: null })).toBeTypeOf('string');
  });

  it('should throw error for invalid sourceType', () => {
    expect(normalize({ sourceType: 123 })).toBeTypeOf('string');
  });

  it('should throw error for invalid options', () => {
    expect(normalize('452')).toBeTypeOf('string');
  });
});
