import { Options as AcornOptions } from 'acorn';

const ECMA_VERSIONS = [
  3,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  2015,
  2016,
  2017,
  2018,
  2019,
  2020,
  2021,
  2022,
  2023,
  2024,
  2025,
  2026,
  'latest',
] as const;

type What = IsSameType<AcornOptions['ecmaVersion'], (typeof ECMA_VERSIONS)[number]>;

function validEcmaVersion(ecmaVersion: unknown): boolean {
  const what: What = true;
  return ECMA_VERSIONS.includes(ecmaVersion as (typeof ECMA_VERSIONS)[number]);
}

function normalize(options: Partial<__OPTS__>): __OPTS__ | string {
  const o = Object(options);
  const variables = Object(options.variables);
  const ecmaVersion = options.ecmaVersion === 'latest' ? 'latest' : Number(options.ecmaVersion);

  if (!validEcmaVersion(ecmaVersion)) {
    return `Invalid ecmaVersion: ${options.ecmaVersion}`;
  }

  return {
    variables,
    ecmaVersion,
    sourceType,
  };
}
