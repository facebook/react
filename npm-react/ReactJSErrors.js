'use strict';

var copyProperties = require('./lib/copyProperties');

var WARNING_MESSAGE = (
  'It looks like you\'re trying to use jeffbski\'s React.js project.\n' +
  'The `react` npm package now points to the React JavaScript library for ' +
  'building user interfaces, not the React.js project for managing asynchronous ' +
  'control flow. If you\'re looking for that library, please npm install autoflow.'
);

function error() {
  throw new Error(WARNING_MESSAGE);
}

// Model the React.js project's public interface exactly.

function ReactJSShim() {
  error();
}

ReactJSShim.logEvents = error;
ReactJSShim.resolvePromises = error;
ReactJSShim.trackTasks = error;
ReactJSShim.createEventCollector = error;

// These could throw using defineProperty() but supporting older browsers will
// be painful. Additionally any error messages around this will contain the string
// so I think this is sufficient.
ReactJSShim.options = WARNING_MESSAGE;
ReactJSShim.events = WARNING_MESSAGE;

var ReactJSErrors = {
  wrap: function(module) {
    copyProperties(ReactJSShim, module);
    return ReactJSShim;
  }
};

module.exports = ReactJSErrors;
