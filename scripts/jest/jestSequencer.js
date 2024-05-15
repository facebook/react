'use strict';

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    if (process.env.CIRCLE_NODE_TOTAL) {
      // In CI, parallelize tests across multiple tasks.
      const nodeTotal = parseInt(process.env.CIRCLE_NODE_TOTAL, 10);
      const nodeIndex = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
      tests = tests
        .sort((a, b) => (a.path < b.path ? -1 : 1))
        .filter((_, i) => i % nodeTotal === nodeIndex);
    }
    return tests;
  }
}

module.exports = CustomSequencer;
