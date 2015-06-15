'use strict';

var a, group, parser, helptext;

var assert = require('assert');


var print = function () {
    return console.log.apply(console, arguments);
  };
// print = function () {};

var argparse = require('argparse');

print("TEST argparse.ArgumentDefaultsHelpFormatter");

parser = new argparse.ArgumentParser({
  debug: true,
  formatterClass: argparse.ArgumentDefaultsHelpFormatter,
  description: 'description'
});

parser.addArgument(['--foo'], {
  help: 'foo help - oh and by the way, %(defaultValue)s'
});

parser.addArgument(['--bar'], {
  action: 'storeTrue',
  help: 'bar help'
});

parser.addArgument(['spam'], {
  help: 'spam help'
});

parser.addArgument(['badger'], {
  nargs: '?',
  defaultValue: 'wooden',
  help: 'badger help'
});

group = parser.addArgumentGroup({
  title: 'title',
  description: 'group description'
});

group.addArgument(['--baz'], {
  type: 'int',
  defaultValue: 42,
  help: 'baz help'
});

helptext = parser.formatHelp();
print(helptext);
// test selected clips
assert(helptext.match(/badger help \(default: wooden\)/));
assert(helptext.match(/foo help - oh and by the way, null/));
assert(helptext.match(/bar help \(default: false\)/));
assert(helptext.match(/title:\n {2}group description/)); // test indent
assert(helptext.match(/baz help \(default: 42\)/im));

/*
usage: PROG [-h] [--foo FOO] [--bar] [--baz BAZ] spam [badger]

description

positional arguments:
  spam        spam help
  badger      badger help (default: wooden)

optional arguments:
  -h, --help  show this help message and exit
  --foo FOO   foo help - oh and by the way, null
  --bar       bar help (default: false)

title:
  group description

  --baz BAZ   baz help (default: 42)
*/

print("TEST argparse.RawDescriptionHelpFormatter");

parser = new argparse.ArgumentParser({
  debug: true,
  prog: 'PROG',
  formatterClass: argparse.RawDescriptionHelpFormatter,
  description: 'Keep the formatting\n' +
               '    exactly as it is written\n' +
               '\n' +
               'here\n'
});

a = parser.addArgument(['--foo'], {
  help: '  foo help should not\n' +
        '    retain this odd formatting'
});

parser.addArgument(['spam'], {
  'help': 'spam help'
});

group = parser.addArgumentGroup({
  title: 'title',
  description: '    This text\n' +
               '  should be indented\n' +
               '    exactly like it is here\n'
});

group.addArgument(['--bar'], {
  help: 'bar help'
});

helptext = parser.formatHelp();
print(helptext);
// test selected clips
assert(helptext.match(parser.description));
assert.equal(helptext.match(a.help), null);
assert(helptext.match(/foo help should not retain this odd formatting/));

/*
class TestHelpRawDescription(HelpTestCase):
    """Test the RawTextHelpFormatter"""
....

usage: PROG [-h] [--foo FOO] [--bar BAR] spam

Keep the formatting
    exactly as it is written

here

positional arguments:
  spam        spam help

optional arguments:
  -h, --help  show this help message and exit
  --foo FOO   foo help should not retain this odd formatting

title:
      This text
    should be indented
      exactly like it is here

  --bar BAR   bar help
*/


print("TEST argparse.RawTextHelpFormatter");

parser = new argparse.ArgumentParser({
  debug: true,
  prog: 'PROG',
  formatterClass: argparse.RawTextHelpFormatter,
  description: 'Keep the formatting\n' +
               '    exactly as it is written\n' +
               '\n' +
               'here\n'
});

parser.addArgument(['--baz'], {
  help: '    baz help should also\n' +
        'appear as given here'
});

a = parser.addArgument(['--foo'], {
  help: '  foo help should also\n' +
        'appear as given here'
});

parser.addArgument(['spam'], {
  'help': 'spam help'
});

group = parser.addArgumentGroup({
  title: 'title',
  description: '    This text\n' +
               '  should be indented\n' +
               '    exactly like it is here\n'
});

group.addArgument(['--bar'], {
  help: 'bar help'
});

helptext = parser.formatHelp();
print(helptext);
// test selected clips
assert(helptext.match(parser.description));
assert(helptext.match(/( {14})appear as given here/gm));

/*
class TestHelpRawText(HelpTestCase):
    """Test the RawTextHelpFormatter"""

usage: PROG [-h] [--foo FOO] [--bar BAR] spam

Keep the formatting
    exactly as it is written

here

positional arguments:
  spam        spam help

optional arguments:
  -h, --help  show this help message and exit
  --foo FOO       foo help should also
              appear as given here

title:
      This text
    should be indented
      exactly like it is here

  --bar BAR   bar help
*/


print("TEST metavar as a tuple");

parser = new argparse.ArgumentParser({
  prog: 'PROG'
});

parser.addArgument(['-w'], {
  help: 'w',
  nargs: '+',
  metavar: ['W1', 'W2']
});

parser.addArgument(['-x'], {
  help: 'x',
  nargs: '*',
  metavar: ['X1', 'X2']
});

parser.addArgument(['-y'], {
  help: 'y',
  nargs: 3,
  metavar: ['Y1', 'Y2', 'Y3']
});

parser.addArgument(['-z'], {
  help: 'z',
  nargs: '?',
  metavar: ['Z1']
});

helptext = parser.formatHelp();
print(helptext);
var ustring = 'PROG [-h] [-w W1 [W2 ...]] [-x [X1 [X2 ...]]] [-y Y1 Y2 Y3] [-z [Z1]]';
ustring = ustring.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
// print(ustring)
assert(helptext.match(new RegExp(ustring)));

/*
class TestHelpTupleMetavar(HelpTestCase):
    """Test specifying metavar as a tuple"""

usage: PROG [-h] [-w W1 [W2 ...]] [-x [X1 [X2 ...]]] [-y Y1 Y2 Y3] [-z [Z1]]

optional arguments:
  -h, --help        show this help message and exit
  -w W1 [W2 ...]    w
  -x [X1 [X2 ...]]  x
  -y Y1 Y2 Y3       y
  -z [Z1]           z
*/

