#!/usr/bin/env node

const AdmZip = require('adm-zip');
const { execSync } = require('child_process');
const { copy, ensureDir, move, remove } = require('fs-extra');
const { join } = require('path');

// These files are copied along with Webpack-bundled files
// to produce the final web extension
const STATIC_FILES = [
  'icons',
  'popups',
  'elements.html',
  'main.html',
  'profiler.html',
  'settings.html',
];

const preProcess = async (destinationPath, tempPath) => {
  await remove(destinationPath); // Clean up from previously completed builds
  await remove(tempPath); // Clean up from any previously failed builds
  await ensureDir(tempPath); // Create temp dir for this new build
};

const build = async (tempPath, manifestPath) => {
  const binPath = join(tempPath, 'bin');
  const zipPath = join(tempPath, 'zip');

  const webpackPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'node_modules',
    '.bin',
    'webpack'
  );
  execSync(
    `${webpackPath} --config webpack.config.js --output-path ${binPath}`,
    {
      cwd: __dirname,
      env: Object.assign({}, process.env, { NODE_ENV: 'production' }),
      stdio: 'inherit',
    }
  );
  execSync(
    `${webpackPath} --config webpack.backend.js --output-path ${binPath}`,
    {
      cwd: __dirname,
      env: Object.assign({}, process.env, { NODE_ENV: 'production' }),
      stdio: 'inherit',
    }
  );

  // Make temp dir
  await ensureDir(zipPath);

  // Copy unbuilt source files to zip dir to be packaged:
  await copy(binPath, join(zipPath, 'build'));
  await copy(manifestPath, join(zipPath, 'manifest.json'));
  await Promise.all(
    STATIC_FILES.map(file => copy(join(__dirname, file), join(zipPath, file)))
  );

  // Pack the extension
  const zip = new AdmZip();
  zip.addLocalFolder(zipPath);
  zip.writeZip(join(tempPath, 'packed.zip'));
};

const postProcess = async (tempPath, destinationPath) => {
  const unpackedSourcePath = join(tempPath, 'zip');
  const packedSourcePath = join(tempPath, 'packed.zip');
  const packedDestPath = join(destinationPath, 'packed.zip');
  const unpackedDestPath = join(destinationPath, 'unpacked');

  await move(unpackedSourcePath, unpackedDestPath); // Copy built files to destination
  await move(packedSourcePath, packedDestPath); // Copy built files to destination
  await remove(tempPath); // Clean up temp directory and files
};

const main = async buildId => {
  const root = join(__dirname, '..', buildId);
  const manifestPath = join(root, 'manifest.json');
  const destinationPath = join(root, 'build');

  try {
    const tempPath = join(__dirname, 'build', buildId);
    await preProcess(destinationPath, tempPath);
    await build(tempPath, manifestPath);

    const builtUnpackedPath = join(destinationPath, 'unpacked');
    await postProcess(tempPath, destinationPath);

    return builtUnpackedPath;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return null;
};

module.exports = main;
