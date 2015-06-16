'use strict';

var argv = require('optimist').argv;
var fs = require('fs');

var CODE_SAMPLE = /```[\S]+\s*[\s\S]*?```/g;
var PARTS = /```[\S]+\s*\/\/\s+(.+?)\n([\s\S]*?)```/;

function truncate(s, n) {
  n = n || 256;
  if (s.length < n) {
    return s;
  }
  return s.substring(0, n) + '...';
}

function main(dest, filenames) {
  if (!dest) {
    throw new Error('no dest provided');
  }
  filenames.map(function(filename) {
    var content = fs.readFileSync(filename).toString('utf8');
    var codeSamples = content.match(CODE_SAMPLE);

    codeSamples.map(function(codeSample) {
      // Do a little jank preprocessing
      codeSample = codeSample.replace('<!--', '//').replace(' -->', '');
      var extracted = codeSample.match(PARTS);
      if (!extracted) {
        throw new Error('Code sample did not match correct format in ' + filename + ': ' + truncate(codeSample));
      }
      var codeSampleFilename = extracted[1];
      var codeSampleContent = extracted[2].replace(/\*\*/g, '');
      fs.writeFileSync(argv.dest + '/' + codeSampleFilename, codeSampleContent);
    });
  });
}

main(argv.dest, argv._);
