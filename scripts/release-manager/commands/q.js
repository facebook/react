/**
 * Stupid command to run exit. 'q' is way shorter, like less.
 */

'use strict';

module.exports = function(vorpal, config) {
  vorpal
    .command('q')
    .hidden()
    .action((args, cb) => {
      vorpal.exec('exit').then(cb);
    });
}
