'use strict';

// Script that combines bundle size information for each build into a single
// JSON file for easier storage and processing.

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../../build');

const filenames = fs.readdirSync(path.join(BUILD_DIR, 'sizes'));

let bundleSizes = [];
for (let i = 0; i < filenames.length; i++) {
  const filename = filenames[i];
  if (filename.endsWith('.size.json')) {
    const json = fs.readFileSync(path.join(BUILD_DIR, 'sizes', filename));
    bundleSizes.push(JSON.parse(json));
  }
}

const outputFilename = path.join(BUILD_DIR, 'bundle-sizes.json');
const outputContents = JSON.stringify({bundleSizes}, null, 2);

fs.writeFileSync(outputFilename, outputContents);
