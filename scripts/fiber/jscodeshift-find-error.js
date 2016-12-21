'use strict';
const printLevel = process.env.JSCODESHIFT_PRINT_LEVEL;

module.exports = (fileInfo, api) => {
  const jscodeshift = api.jscodeshift;
  if (
    /__tests__|vendor/.test(fileInfo.path)
  ) {
    return;
  }
  // slice off process.cwd() and leading /
  const normalizedPath = fileInfo.path.replace(process.cwd(), '').slice(1);
  let detected = 0;

  jscodeshift(fileInfo.source)
    .find(jscodeshift.ThrowStatement)
    .forEach(path => {
      api.stats('error');
      detected++;
      if (printLevel !== 'files') {
        console.log(
          '%s#%s:',
          normalizedPath,
          path.value.loc.start.line
        );
        if (printLevel !== 'quiet') {
          console.log(
            jscodeshift(path).toSource().split('\n').map(line => '  ' + line).join('\n')
          );
          console.log();
        }
      }
    });

  if (printLevel === 'files' && detected) {
    console.log('%s has %s statement(s)', normalizedPath, detected);
  }
};

