/*global process:false*/
/*global module:true*/
/*global exports:true*/
"use strict";

var transform = require('jstransform').transform;
var visitors = require('./visitors');

/**
 * @typechecks
 * @param {string} source
 * @param {object?} options
 * @param {array?} excludes
 * @return {string}
 */
function transformAll(source, options, excludes) {
  excludes = excludes || [];

  // The typechecker transform must run in a second pass in order to operate on
  // the entire source code -- so exclude it from the first pass
  var visitorsList = visitors.getVisitorsList(excludes.concat('typechecker'));
  source = transform(visitorsList, source, options);
  if (excludes.indexOf('typechecks') == -1 && /@typechecks/.test(source.code)) {
    source = transform(
      visitors.transformVisitors.typechecker,
      source.code,
      options
    );
  }
  return source;
}

function runCli(argv) {
  var options = {};
  for (var optName in argv) {
    if (optName === '_' || optName === '$0') {
      continue;
    }
    options[optName] = optimist.argv[optName];
  }

  if (options.help) {
    optimist.showHelp();
    process.exit(0);
  }

  var excludes = options.excludes;
  delete options.excludes;

  var source = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (chunk) {
    source += chunk;
  });
  process.stdin.on('end', function () {
    try {
      source = transformAll(source, options, excludes);
    } catch (e) {
      console.error(e.stack);
      process.exit(1);
    }
    process.stdout.write(source.code);
  });
}

if (require.main === module) {
  var optimist = require('optimist');

  optimist = optimist
    .usage('Usage: $0 [options]')
    .default('exclude', [])
    .boolean('help').alias('h', 'help')
    .boolean('minify')
    .describe(
      'minify',
      'Best-effort minification of the output source (when possible)'
    )
    .describe(
      'exclude',
      'A list of transformNames to exclude'
    );

  runCli(optimist.argv);
} else {
  exports.transformAll = transformAll;
}
