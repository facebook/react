const {transformSync} = require('@babel/core');
const {btoa} = require('base64');
const {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} = require('fs');
const {emptyDirSync} = require('fs-extra');
const {resolve} = require('path');

const sourceDir = resolve(__dirname, '__source__');
const buildRoot = resolve(sourceDir, '__compiled__');
const externalDir = resolve(buildRoot, 'external');
const inlineDir = resolve(buildRoot, 'inline');

// Remove previous builds
emptyDirSync(buildRoot);
mkdirSync(externalDir);
mkdirSync(inlineDir);

function compile(fileName) {
  const code = readFileSync(resolve(sourceDir, fileName), 'utf8');

  const transformed = transformSync(code, {
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    presets: [
      // 'minify',
      [
        '@babel/react',
        // {
        //   runtime: 'automatic',
        //   development: false,
        // },
      ],
    ],
    sourceMap: true,
  });

  const sourceMap = transformed.map;
  sourceMap.sources = [fileName];

  // Generate compiled output with external source maps
  writeFileSync(
    resolve(externalDir, fileName),
    transformed.code +
      `\n//# sourceMappingURL=${fileName}.map` +
      `\n//# sourceURL=${fileName}`,
    'utf8',
  );
  writeFileSync(
    resolve(externalDir, `${fileName}.map`),
    JSON.stringify(sourceMap),
    'utf8',
  );

  // Generate compiled output with external inline base64 source maps
  writeFileSync(
    resolve(inlineDir, fileName),
    transformed.code +
      '\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
      btoa(JSON.stringify(sourceMap)) +
      `\n//# sourceURL=${fileName}`,
    'utf8',
  );
}

// Compile all files in the current directory
const entries = readdirSync(sourceDir);
entries.forEach(entry => {
  const stat = lstatSync(resolve(sourceDir, entry));
  if (!stat.isDirectory() && entry.endsWith('.js')) {
    compile(entry);
  }
});
