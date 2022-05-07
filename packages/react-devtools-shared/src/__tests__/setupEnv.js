'use strict';

const {
  DARK_MODE_DIMMED_WARNING_COLOR,
  DARK_MODE_DIMMED_ERROR_COLOR,
  DARK_MODE_DIMMED_LOG_COLOR,
  LIGHT_MODE_DIMMED_WARNING_COLOR,
  LIGHT_MODE_DIMMED_ERROR_COLOR,
  LIGHT_MODE_DIMMED_LOG_COLOR,
} = require('react-devtools-extensions/utils');

// DevTools stores preferences between sessions in localStorage
if (!global.hasOwnProperty('localStorage')) {
  global.localStorage = require('local-storage-fallback').default;
}

// Mimic the global we set with Webpack's DefinePlugin
global.__DEV__ = process.env.NODE_ENV !== 'production';
global.__TEST__ = true;

global.process.env.DARK_MODE_DIMMED_WARNING_COLOR = DARK_MODE_DIMMED_WARNING_COLOR;
global.process.env.DARK_MODE_DIMMED_ERROR_COLOR = DARK_MODE_DIMMED_ERROR_COLOR;
global.process.env.DARK_MODE_DIMMED_LOG_COLOR = DARK_MODE_DIMMED_LOG_COLOR;
global.process.env.LIGHT_MODE_DIMMED_WARNING_COLOR = LIGHT_MODE_DIMMED_WARNING_COLOR;
global.process.env.LIGHT_MODE_DIMMED_ERROR_COLOR = LIGHT_MODE_DIMMED_ERROR_COLOR;
global.process.env.LIGHT_MODE_DIMMED_LOG_COLOR = LIGHT_MODE_DIMMED_LOG_COLOR;
