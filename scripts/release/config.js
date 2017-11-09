'use strict';

const dependencies = ['fbjs', 'object-assign', 'prop-types'];

const paramDefinitions = [
  {
    name: 'dry',
    type: Boolean,
    description: 'Build artifacts but do not commit or publish',
    defaultValue: false,
  },
  {
    name: 'path',
    type: String,
    alias: 'p',
    description:
      'Location of React repository to release; defaults to [bold]{cwd}',
    defaultValue: '.',
  },
  {
    name: 'version',
    type: String,
    alias: 'v',
    description: 'Semantic version number',
  },
];

module.exports = {
  dependencies,
  paramDefinitions,
};
