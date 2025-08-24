// Complex nested if structure with multiple levels
const config = {
  environment: 'development',
};

/* #if DEBUG */
console.log('Debug mode enabled');

/* #if PLATFORM === 'web' */
console.log('Web platform detected');

/* #if FEATURE_A */
console.log('Feature A enabled');
/* #elif FEATURE_B */
console.log('Feature B enabled instead');
/* #else */
console.log('Default features only');
/* #endif */

/* #elif PLATFORM === 'mobile' */
console.log('Mobile platform detected');

/* #if iOS */
console.log('iOS specific code');
/* #elif ANDROID */
console.log('Android specific code');
/* #endif */

/* #else */
console.log('Unknown platform');
/* #endif */

/* #elif PRODUCTION */
console.log('Production mode');

/* #if ANALYTICS */
console.log('Analytics enabled');
/* #endif */

/* #else */
console.log('Default mode');
/* #endif */

function complexFunction() {
  /* #if ADVANCED_FEATURES */
  return {
    /* #if CACHE_ENABLED */
    cache: true,
    /* #else */
    cache: false,
    /* #endif */

    /* #if LOGGING */
    log: function (msg) {
      /* #if VERBOSE */
      console.log('[VERBOSE]', msg);
      /* #else */
      console.log(msg);
      /* #endif */
    },
    /* #endif */
  };
  /* #else */
  return { basic: true };
  /* #endif */
}

export { complexFunction };
