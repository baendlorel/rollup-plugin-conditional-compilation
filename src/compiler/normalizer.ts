import { Options as AcornOptions } from 'acorn';

type EcmaVersion = AcornOptions['ecmaVersion'];
type SourceType = AcornOptions['sourceType'];

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

const what1: IsSameType<EcmaVersion, (typeof ECMA_VERSIONS)[number]> = true;

function validEcmaVersion(ecmaVersion: unknown): ecmaVersion is EcmaVersion {
  return ECMA_VERSIONS.includes(ecmaVersion as EcmaVersion);
}

const SOURCE_TYPES = ['script', 'module', undefined] as const;
const what2: IsSameType<SourceType, (typeof SOURCE_TYPES)[number]> = true;

function validSourceType(sourceType: unknown): sourceType is SourceType {
  return SOURCE_TYPES.includes(sourceType as SourceType);
}

export function normalize(options?: __OPTS__): __STRICT_OPTS__ | string {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    return `Invalid options: '${options}', must be an object`;
  }

  const o = Object(options) as Required<__OPTS__>;
  const { variables = {}, ecmaVersion = 'latest', sourceType = 'module' } = o;

  if (typeof variables !== 'object' || variables === null) {
    return `Invalid variables: '${variables}', must be an object`;
  }

  if (!validEcmaVersion(ecmaVersion)) {
    return `Invalid ecmaVersion: '${ecmaVersion}', must be one of [${ECMA_VERSIONS.join(', ')}]`;
  }

  if (!validSourceType(sourceType)) {
    return `Invalid sourceType: '${sourceType}', must be 'script', 'module' or undefined`;
  }

  return {
    variables: { keys: Object.keys(variables), values: Object.values(variables) },
    ecmaVersion,
    sourceType,
  };
}
