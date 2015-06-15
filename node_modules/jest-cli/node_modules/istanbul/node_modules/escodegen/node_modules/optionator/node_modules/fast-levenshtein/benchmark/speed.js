var fastLevenshtein = require('../levenshtein.min').get,
  levenshtein = require('levenshtein'),
  levenshteinEditDistance = require('levenshtein-edit-distance'),
  levenshteinComponent = require('levenshtein-component'),
  levenshteinDeltas = require('levenshtein-deltas'),
  natural = require('natural').LevenshteinDistance;



/* The first 100 words from Letterpress: https://github.com/atebits/Words */
source = Array(11).join([
    'aa',
    'aah',
    'aahed',
    'aahing',
    'aahs',
    'aal',
    'aalii',
    'aaliis',
    'aals',
    'aardvark',
    'aardvarks',
    'aardwolf',
    'aardwolves',
    'aargh',
    'aarrgh',
    'aarrghh',
    'aarti',
    'aartis',
    'aas',
    'aasvogel',
    'aasvogels',
    'ab',
    'aba',
    'abac',
    'abaca',
    'abacas',
    'abaci',
    'aback',
    'abacs',
    'abacterial',
    'abactinal',
    'abactinally',
    'abactor',
    'abactors',
    'abacus',
    'abacuses',
    'abaft',
    'abaka',
    'abakas',
    'abalone',
    'abalones',
    'abamp',
    'abampere',
    'abamperes',
    'abamps',
    'aband',
    'abanded',
    'abanding',
    'abandon',
    'abandoned',
    'abandonedly',
    'abandonee',
    'abandonees',
    'abandoner',
    'abandoners',
    'abandoning',
    'abandonment',
    'abandonments',
    'abandons',
    'abandonware',
    'abandonwares',
    'abands',
    'abapical',
    'abas',
    'abase',
    'abased',
    'abasedly',
    'abasement',
    'abasements',
    'abaser',
    'abasers',
    'abases',
    'abash',
    'abashed',
    'abashedly',
    'abashes',
    'abashing',
    'abashless',
    'abashment',
    'abashments',
    'abasia',
    'abasias',
    'abasing',
    'abask',
    'abatable',
    'abate',
    'abated',
    'abatement',
    'abatements',
    'abater',
    'abaters',
    'abates',
    'abating',
    'abatis',
    'abatises',
    'abator',
    'abators',
    'abattis',
    'abattises',
    'abattoir',
    'abattoirs'
].join('|')).split('|');



/**
 * The actual test loop.
 * @param  {Function} fn Levenshtein distance function.
 */
var loop = function(fn) {
  var iterator = -1,
    previousValue = '',
    value,
    dist;

  while (value = source[++iterator]) {
    dist = fn(previousValue, value);
    previousValue = value;
  }
};


/** @type {Object} Test config */
module.exports = {
  name: 'Implementation comparison',
  onComplete: function() {
    console.log('Benchmark done.');
  },
  tests: [
    {
      name: 'levenshtein-edit-distance',
      fn: function() {
        loop(levenshteinEditDistance);
      }
    },
    {
      name: 'levenshtein-component',
      fn: function() {
        loop(levenshteinComponent);
      }
    },
    {
      name: 'levenshtein-deltas',
      fn: function() {
        loop(function(v1,v2) {
            return new levenshteinDeltas.Lev(v1,v2).distance();
        });
      }
    },
    {
      name: 'natural',
      fn: function() {
        loop(natural);
      }
    },
    {
      name: 'levenshtein',
      fn: function() {
        loop(levenshtein);
      }
    },
    {
      name: 'fast-levenshtein',
      fn: function() {
        loop(fastLevenshtein);
      }
    },
  ]
};


