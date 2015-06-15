#!/usr/bin/env node
'use strict';

var ArgumentParser = require('../lib/argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Argparse examples: prefix_chars',
  prefixChars: '-+'
});
parser.addArgument(['+f', '++foo']);
parser.addArgument(['++bar'], {action: 'storeTrue'});

parser.printHelp();
console.log('-----------');

var args;
args = parser.parseArgs(['+f', '1']);
console.dir(args);
args = parser.parseArgs(['++bar']);
console.dir(args);
args = parser.parseArgs(['++foo', '2', '++bar']);
console.dir(args);
