'use strict';

var util    = require('util');
var _       = require('lodash');


// Constants
var $$ = require('../const');

var HelpFormatter = require('./formatter.js');

/**
 * new RawDescriptionHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
 *
 * Help message formatter which adds default values to argument help.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

var ArgumentDefaultsHelpFormatter = function ArgumentDefaultsHelpFormatter(options) {
  HelpFormatter.call(this, options);
};

util.inherits(ArgumentDefaultsHelpFormatter, HelpFormatter);

ArgumentDefaultsHelpFormatter.prototype._getHelpString = function (action) {
  var help = action.help;
  if (action.help.indexOf('%(defaultValue)s') === -1) {
    if (action.defaultValue !== $$.SUPPRESS) {
      var defaulting_nargs = [$$.OPTIONAL, $$.ZERO_OR_MORE];
      if (action.isOptional() || (defaulting_nargs.indexOf(action.nargs) >= 0)) {
        help += ' (default: %(defaultValue)s)';
      }
    }
  }
  return help;
};

module.exports.ArgumentDefaultsHelpFormatter = ArgumentDefaultsHelpFormatter;

/**
 * new RawDescriptionHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
 *
 * Help message formatter which retains any formatting in descriptions.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

var RawDescriptionHelpFormatter = function RawDescriptionHelpFormatter(options) {
  HelpFormatter.call(this, options);
};

util.inherits(RawDescriptionHelpFormatter, HelpFormatter);

RawDescriptionHelpFormatter.prototype._fillText = function (text, width, indent) {
  var lines = text.split('\n');
  lines = lines.map(function (line) {
      return _.trimRight(indent + line);
    });
  return lines.join('\n');
};
module.exports.RawDescriptionHelpFormatter = RawDescriptionHelpFormatter;

/**
 * new RawTextHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawTextHelpFormatter, ...})
 *
 * Help message formatter which retains formatting of all help text.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

var RawTextHelpFormatter = function RawTextHelpFormatter(options) {
  RawDescriptionHelpFormatter.call(this, options);
};

util.inherits(RawTextHelpFormatter, RawDescriptionHelpFormatter);

RawTextHelpFormatter.prototype._splitLines = function (text) {
  return text.split('\n');
};

module.exports.RawTextHelpFormatter = RawTextHelpFormatter;
