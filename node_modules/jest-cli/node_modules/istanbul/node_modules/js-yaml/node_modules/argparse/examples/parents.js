#!/usr/bin/env node
'use strict';

var ArgumentParser = require('../lib/argparse').ArgumentParser;

var args;
var parent_parser = new ArgumentParser({ addHelp: false });
// note addHelp:false to prevent duplication of the -h option
parent_parser.addArgument(
  ['--parent'],
  { type: 'int', description: 'parent' }
);

var foo_parser = new ArgumentParser({
  parents: [ parent_parser ],
  description: 'child1'
});
foo_parser.addArgument(['foo']);
args = foo_parser.parseArgs(['--parent', '2', 'XXX']);
console.log(args);

var bar_parser = new ArgumentParser({
  parents: [ parent_parser ],
  description: 'child2'
});
bar_parser.addArgument(['--bar']);
args = bar_parser.parseArgs(['--bar', 'YYY']);
console.log(args);
