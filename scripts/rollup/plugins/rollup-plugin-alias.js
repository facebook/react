// TODO resolve rollup-plugin-alias issue on its repo
// https://github.com/rollup/rollup-plugin-alias/issues/11
const path = require('path');
const {posix} = path;
const {platform} = require('os');
const fs = require('fs');

const slash = require('slash');

const VOLUME = /^([A-Z]:)/;
const IS_WINDOWS = platform() === 'win32';

// Helper functions
const noop = () => null;
const matches = (key, importee) => {
  if (importee.length < key.length) {
    return false;
  }
  if (importee === key) {
    return true;
  }
  const importeeStartsWithKey = importee.indexOf(key) === 0;
  const importeeHasSlashAfterKey = importee.substring(key.length)[0] === '/';
  return importeeStartsWithKey && importeeHasSlashAfterKey;
};
const endsWith = (needle, haystack) =>
  haystack.slice(-needle.length) === needle;
const isFilePath = id => /^\.?\//.test(id);
const exists = uri => {
  try {
    return fs.statSync(uri).isFile();
  } catch (e) {
    return false;
  }
};

const normalizeId = id => {
  if ((IS_WINDOWS && typeof id === 'string') || VOLUME.test(id)) {
    return slash(id.replace(VOLUME, ''));
  }

  return id;
};

module.exports = function alias(options = {}) {
  const hasResolve = Array.isArray(options.resolve);
  const resolve = hasResolve ? options.resolve : ['.js'];
  const aliasKeys = hasResolve
    ? Object.keys(options).filter(k => k !== 'resolve')
    : Object.keys(options);

  // No aliases?
  if (!aliasKeys.length) {
    return {
      resolveId: noop,
    };
  }

  return {
    resolveId(importee, importer) {
      const importeeId = normalizeId(importee);
      const importerId = normalizeId(importer);

      // First match is supposed to be the correct one
      const toReplace = aliasKeys.find(key => matches(key, importeeId));

      if (!toReplace) {
        return null;
      }

      const entry = options[toReplace];

      let updatedId = normalizeId(importeeId.replace(toReplace, entry));

      if (isFilePath(updatedId)) {
        const directory = posix.dirname(importerId);

        // Resolve file names
        const filePath = posix.resolve(directory, updatedId);
        const match = resolve
          .map(
            ext => (endsWith(ext, filePath) ? filePath : `${filePath}${ext}`)
          )
          .find(exists);

        if (match) {
          updatedId = match;
          // To keep the previous behaviour we simply return the file path
          // with extension
        } else if (endsWith('.js', filePath)) {
          updatedId = filePath;
        } else {
          updatedId = filePath + '.js';
        }
      }

      // if alias is windows absoulate path return platform
      // resolved path or rollup on windows will throw:
      //  [TypeError: Cannot read property 'specifier' of undefined]
      if (VOLUME.test(entry)) {
        return path.resolve(updatedId);
      }

      return updatedId;
    },
  };
};
