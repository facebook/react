#!/usr/bin/env node

const archiver = require('archiver');
const { execSync } = require('child_process');
const { readFileSync, writeFileSync, createWriteStream } = require('fs');
const { copy, ensureDir, move, remove } = require('fs-extra');
const { join } = require('path');
const { getGitCommit } = require('../../utils');

// These files are copied along with Webpack-bundled files
// to produce the final web extension
const STATIC_FILES = ['icons', 'popups', 'main.html', 'panel.html'];

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
      env: process.env,
      stdio: 'inherit',
    }
  );
  execSync(
    `${webpackPath} --config webpack.backend.js --output-path ${binPath}`,
    {
      cwd: __dirname,
      env: process.env,
      stdio: 'inherit',
    }
  );

  // Make temp dir
  await ensureDir(zipPath);

  const copiedManifestPath = join(zipPath, 'manifest.json');

  // Copy unbuilt source files to zip dir to be packaged:
  await copy(binPath, join(zipPath, 'build'));
  await copy(manifestPath, copiedManifestPath);
  await Promise.all(
    STATIC_FILES.map(file => copy(join(__dirname, file), join(zipPath, file)))
  );

  const commit = getGitCommit();

  const manifest = JSON.parse(readFileSync(copiedManifestPath).toString());
  manifest.description += `\n\nCreated from revision ${commit} (${new Date().toLocaleDateString()})`;
  if (tempPath.includes('chrome')) {
    manifest.version_name = `${commit} (${new Date().toLocaleDateString()})`;
  }
  writeFileSync(copiedManifestPath, JSON.stringify(manifest, null, 2));

  // Pack the extension
  const archive = archiver('zip', { zlib: { level: 9 } });
  const zipStream = createWriteStream(join(tempPath, 'ReactDevTools.zip'));
  await new Promise((resolve, reject) => {
    archive
      .directory(zipPath, false)
      .on('error', err => reject(err))
      .pipe(zipStream);
    archive.finalize();
    zipStream.on('close', () => resolve());
  });
};

const postProcess = async (tempPath, destinationPath) => {
  const unpackedSourcePath = join(tempPath, 'zip');
  const packedSourcePath = join(tempPath, 'ReactDevTools.zip');
  const packedDestPath = join(destinationPath, 'ReactDevTools.zip');
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
