#!/usr/bin/env node
'use strict';

var ArgumentParser = require('../lib/argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Argparse examples: sub-commands'
});

var subparsers = parser.addSubparsers({
  title: 'subcommands',
  dest: "subcommand_name"
});

var bar = subparsers.addParser('c1', {addHelp: true, help: 'c1 help'});
bar.addArgument(
  [ '-f', '--foo' ],
  {
    action: 'store',
    help: 'foo3 bar3'
  }
);
var bar = subparsers.addParser(
  'c2',
  {aliases: ['co'], addHelp: true, help: 'c2 help'}
);
bar.addArgument(
  [ '-b', '--bar' ],
  {
    action: 'store',
    type: 'int',
    help: 'foo3 bar3'
  }
);
parser.printHelp();
console.log('-----------');

var args;
args = parser.parseArgs('c1 -f 2'.split(' '));
console.dir(args);
console.log('-----------');
args = parser.parseArgs('c2 -b 1'.split(' '));
console.dir(args);
console.log('-----------');
args = parser.parseArgs('co -b 1'.split(' '));
console.dir(args);
console.log('-----------');
parser.parseArgs(['c1', '-h']);
