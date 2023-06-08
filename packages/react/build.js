const babel = require('@babel/core');
const Terser = require('terser');
const fs = require('fs');

// Read your original code from a file
const code = fs.readFileSync('index.js', 'utf-8');

// Transpile the code to ES5
const transpiled = babel.transformSync(code, {
  presets: ['@babel/preset-env'],
}).code;

// Minify the transpiled code
const minified = Terser.minify(transpiled).code;

// Write the minified code to a file
fs.writeFileSync('index.js', minified);
