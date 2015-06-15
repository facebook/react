#!/usr/bin/env node

'use strict';


var ArgumentParser  = require('../lib/argparse').ArgumentParser;
var parser = new ArgumentParser({ description: 'Process some integers.' });


function sum(arr) {
  return arr.reduce(function (a, b) {
    return a + b;
  }, 0);
}
function max(arr) {
  return Math.max.apply(Math, arr);
}


parser.addArgument(['integers'], {
  metavar:      'N',
  type:         'int',
  nargs:        '+',
  help:         'an integer for the accumulator'
});
parser.addArgument(['--sum'], {
  dest:         'accumulate',
  action:       'storeConst',
  constant:     sum,
  defaultValue: max,
  help:         'sum the integers (default: find the max)'
});

var args = parser.parseArgs('--sum 1 2 -1'.split(' '));
console.log(args.accumulate(args.integers));
