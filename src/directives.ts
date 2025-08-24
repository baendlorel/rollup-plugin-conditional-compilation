export const enum DirvMeta {
  PREFIX = '/**',
  SUFFIX = '*/',

  Regex = '^(#if|#else|#elif|#endif)\\s*',
}

export const enum Dirv {
  // Basic directives, act like they are in C++
  If = '#if',
  Eles = '#else',
  Elif = '#elif',
  Endif = '#endif',
}
