var util = require('util'),
  minimatch = require('minimatch'),
  Glob = require('glob').Glob,
  EventEmitter = require('events').EventEmitter;

module.exports = fileset;

function fileset(include, exclude, options, cb) {
  if (typeof exclude === 'function') cb = exclude, exclude = '';
  else if (typeof options === 'function') cb = options, options = {};

  var includes = (typeof include === 'string') ? include.split(' ') : include;
  var excludes = (typeof exclude === 'string') ? exclude.split(' ') : exclude;

  var em = new EventEmitter,
    remaining = includes.length,
    results = [];

  if(!includes.length) return cb(new Error('Must provide an include pattern'));

  em.includes = includes.map(function(pattern) {
    return new fileset.Fileset(pattern, options)
      .on('error', cb ? cb : em.emit.bind(em, 'error'))
      .on('match', em.emit.bind(em, 'match'))
      .on('match', em.emit.bind(em, 'include'))
      .on('end', next.bind({}, pattern))
  });

  function next(pattern, matches) {
    results = results.concat(matches);

    if(!(--remaining)) {
      results = results.filter(function(file) {
        return !excludes.filter(function(glob) {
          var match = minimatch(file, glob, { matchBase: true });
          if(match) em.emit('exclude', file);
          return match;
        }).length;
      });

      if(cb) cb(null, results);
      em.emit('end', results);
    }
  }

  return em;
}

fileset.Fileset = function Fileset(pattern, options, cb) {

  if (typeof options === 'function') cb = options, options = {};
  if (!options) options = {};

  Glob.call(this, pattern, options);

  if(typeof cb === 'function') {
    this.on('error', cb);
    this.on('end', function(matches) { cb(null, matches); });
  }
};

util.inherits(fileset.Fileset, Glob);


