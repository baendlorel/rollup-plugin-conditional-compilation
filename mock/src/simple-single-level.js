// Simple single-level if structure with elif and else
const simpleConfig = {
  mode: 'test',
};

console.log('Starting simple conditional compilation test');

/* #if ENVIRONMENT === 'development' */
console.log('Development environment detected');
const devSettings = {
  debug: true,
  verbose: true,
  hotReload: true,
};
console.log('Dev settings loaded:', devSettings);

/* #elif ENVIRONMENT === 'staging' */
console.log('Staging environment detected');
const stagingSettings = {
  debug: true,
  verbose: false,
  hotReload: false,
  analytics: true,
};
console.log('Staging settings loaded:', stagingSettings);

/* #elif ENVIRONMENT === 'production' */
console.log('Production environment detected');
const productionSettings = {
  debug: false,
  verbose: false,
  hotReload: false,
  analytics: true,
  minified: true,
  optimization: true,
};
console.log('Production settings loaded:', productionSettings);

/* #else */
console.log('Unknown or default environment');
const defaultSettings = {
  debug: false,
  verbose: false,
  basic: true,
};
console.log('Default settings loaded:', defaultSettings);

/* #endif */

function getEnvironmentInfo() {
  /* #if ENVIRONMENT === 'development' */
  return {
    env: 'dev',
    level: 'development',
  };
  /* #elif ENVIRONMENT === 'staging' */
  return {
    env: 'stage',
    level: 'staging',
  };
  /* #elif ENVIRONMENT === 'production' */
  return {
    env: 'prod',
    level: 'production',
  };
  /* #else */
  return {
    env: 'unknown',
    level: 'default',
  };
  /* #endif */
}

console.log('Environment info:', getEnvironmentInfo());

export { getEnvironmentInfo };
