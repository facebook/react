'use strict';

module.exports = {
  rules: {
    'no-primitive-constructors': require('./no-primitive-constructors'),
    'no-to-warn-dev-within-to-throw': require('./no-to-warn-dev-within-to-throw'),
    'warning-args': require('./warning-args'),
    'prod-error-codes': require('./prod-error-codes'),
    'no-production-logging': require('./no-production-logging'),
    'no-cross-fork-imports': require('./no-cross-fork-imports'),
    'no-cross-fork-types': require('./no-cross-fork-types'),
    'safe-string-coercion': require('./safe-string-coercion'),
  },
};
