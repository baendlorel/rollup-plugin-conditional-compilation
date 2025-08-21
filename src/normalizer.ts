import { Options as AcornOptions, ecmaVersion } from 'acorn';

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

function validEcmaVersion(ecmaVersion: unknown): ecmaVersion is (typeof ECMA_VERSIONS)[number] {
  const what: What = true;
  return ECMA_VERSIONS.includes(ecmaVersion as (typeof ECMA_VERSIONS)[number]);
}

const SOURCE_TYPES = ['script', 'module', undefined] as const;
function validSourceType(sourceType: unknown): sourceType is (typeof SOURCE_TYPES)[number] {
  return SOURCE_TYPES.includes(sourceType as (typeof SOURCE_TYPES)[number]);
}

export function normalize(options: Partial<__OPTS__>): __OPTS__ {
  const o = Object(options);
  const variables = options.variables;
  const ecmaVersion = o.ecmaVersion === 'latest' ? 'latest' : Number(o.ecmaVersion);
  const sourceType = o.sourceType;

  if (typeof variables !== 'object' || variables === null) {
    throw new TypeError(`__NAME__: Invalid variables: ${variables}, must be an object`);
  }

  if (!validEcmaVersion(ecmaVersion)) {
    throw new TypeError(
      `__NAME__: Invalid ecmaVersion: ${o.ecmaVersion}, must be verions or 'latest'`
    );
  }

  if (!validSourceType(sourceType)) {
    throw new TypeError(
      `__NAME__: Invalid sourceType: ${sourceType}, must be 'script', 'module' or undefined`
    );
  }

  return {
    variables,
    ecmaVersion,
    sourceType,
  };
}
