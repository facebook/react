function file2moduleName(filePath) {
  return filePath.replace(/\\/g, '/')
    // module name should be relative to `modules` and `tools` folder
    .replace(/.*\/modules\//, '')
    //  and 'dist' folder
    .replace(/.*\/dist\/js\/dev\/es5\//, '')
    // module name should not include `lib`, `web` folders
    // as they are wrapper packages for dart
    .replace(/\/web\//, '/')
    .replace(/\/lib\//, '/')
    // module name should not have a suffix
    .replace(/\.\w*$/, '');
}
if (typeof module !== 'undefined') {
  module.exports = file2moduleName;
}
