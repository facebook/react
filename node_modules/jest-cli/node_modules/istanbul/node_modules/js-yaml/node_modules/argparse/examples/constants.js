#!/usr/bin/env node
'use strict';

var ArgumentParser = require('../lib/argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Argparse examples: constant'
});

parser.addArgument(
  [ '-a'],
  {
    action: 'storeConst',
    dest:   'answer',
    help:   'store constant',
    constant: 42
  }
);
parser.addArgument(
  [ '--str' ],
  {
    action: 'appendConst',
    dest:   'types',
    help:   'append constant "str" to types',
    constant: 'str'
  }
);
parser.addArgument(
  [ '--int' ],
  {
    action: 'appendConst',
    dest:   'types',
    help:   'append constant "int" to types',
    constant: 'int'
  }
);

parser.addArgument(
  [ '--true' ],
  {
    action: 'storeTrue',
    help: 'store true constant'
  }
);
parser.addArgument(
  [ '--false' ],
  {
    action: 'storeFalse',
    help: 'store false constant'
  }
);

parser.printHelp();
console.log('-----------');

var args;
args = parser.parseArgs('-a --str --int --true'.split(' '));
console.dir(args);
