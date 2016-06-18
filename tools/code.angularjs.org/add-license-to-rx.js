#! /usr/bin/env node

/**
 * TODO: remove this file when license is included in RxJS bundles.
 * https://github.com/ReactiveX/RxJS/issues/1067
 *
 * This script runs after bundles have already been copied to the build-path,
 * to prepend the license to each bundle.
 **/
var fs = require('fs');
var args = require('minimist')(process.argv);

var license = fs.readFileSync(args['license-path']);
// Make the license block into a JS comment
license = `/**
${license}
**/
`;

var bundles = fs.readdirSync(args['build-path'])
  // Match files that begin with Rx and end with js
  .filter(bundle => /^Rx\.?.*\.js$/.test(bundle))
  // Load file contents
  .map(bundle => {
    return {
      path: bundle,
      contents: fs.readFileSync(`${args['build-path']}/${bundle}`).toString()
    };
  })
  // Concatenate license to bundle
  .map(bundle => {
    return {
      path: bundle.path,
      contents: `${license}${bundle.contents}`
    };
  })
  // Write file to disk
  .forEach(bundle => fs.writeFileSync(`${args['build-path']}/${bundle.path}`, bundle.contents));
