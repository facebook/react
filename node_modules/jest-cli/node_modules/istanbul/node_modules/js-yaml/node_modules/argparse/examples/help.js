#!/usr/bin/env node
'use strict';

var ArgumentParser = require('../lib/argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Argparse examples: help',
  epilog: 'help epilog',
  prog: 'help_example_prog',
  usage: 'Usage %(prog)s <agrs>'
});
parser.printHelp();
