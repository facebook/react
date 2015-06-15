var _ = require('lodash'),
    chai = require('chai'),
    fs = require('fs'),
    levenshtein = require('../levenshtein.min');

var expect = chai.expect,
    assert = chai.assert;


/**
 * Create test functions.
 * @return Object
 */
var createTests = function(str1, str2, expectedLength, options) {
  options = _.extend({}, {
    description: null
  }, options);

  if (!options.description) {
    options.description = (0 === str1.length ? '(empty)' : str1) + ' <-> ' + (0 === str2.length ? '(empty)' : str2);
  }

  var ret = {};

  ret["SYNC:\t" + options.description] = function() {
    expect(levenshtein.get(str1, str2)).to.eql(expectedLength);
  };

  ret["ASYNC:\t" + options.description] = function(done) {
    levenshtein.getAsync(str1, str2, function(err, distance) {
      expect(err).to.be.null;
      expect(distance).to.eql(expectedLength);

      done();
    });
  };

  return ret;
};


// ----- Basic tests ----- //

(function() {

  var tests = {},
      str = 'hello',
      str1 = str,
      str2 = str,
      i;

  // equal strings
  _.extend(tests, createTests('hello', 'hello', 0));

  // inserts
  for (i=0; i<=str.length; ++i) {
    str1 = str.substr(0,i);
    str2 = str;

    _.extend(tests, createTests(str1, str2, str.length - i));
  }

  // deletes
  for (i=str.length-1; i>=0; --i) {
    str1 = str;
    str2 = str.substr(0,i);

    _.extend(tests, createTests(str1, str2, str.length - i));
  }

  // substitutions
  _.extend(tests, createTests("a",   "b", 1 ));
  _.extend(tests, createTests("ab",  "ac", 1 ));
  _.extend(tests, createTests("ac",  "bc",  1 ));
  _.extend(tests, createTests("abc", "axc", 1 ));
  _.extend(tests, createTests("xabxcdxxefxgx", "1ab2cd34ef5g6", 6 ));

  // many ops
  _.extend(tests, createTests('xabxcdxxefxgx', 'abcdefg', 6));
  _.extend(tests, createTests('javawasneat', 'scalaisgreat', 7));
  _.extend(tests, createTests("example", "samples", 3));
  _.extend(tests, createTests("sturgeon", "urgently", 6 ));
  _.extend(tests, createTests("levenshtein", "frankenstein", 6 ));
  _.extend(tests, createTests("distance", "difference", 5 ));

  // non-latin
  _.extend(tests, createTests('因為我是中國人所以我會說中文', '因為我是英國人所以我會說英文', 2, {
    description: 'non-latin'
  }));

  // long text
  _.extend(tests, createTests(
      'Morbi interdum ultricies neque varius condimentum. Donec volutpat turpis interdum metus ultricies vulputate. Duis ultricies rhoncus sapien, sit amet fermentum risus imperdiet vitae. Ut et lectus',
      'Duis erat dolor, cursus in tincidunt a, lobortis in odio. Cras magna sem, pharetra et iaculis quis, faucibus quis tellus. Suspendisse dapibus sapien in justo cursus',
      143,
      {
        description: 'long text'
      }
  ));

  exports['Basic'] = tests;
})();

// ------ Asynchronous tests ----- //

var text1 = fs.readFileSync(__dirname + '/text1.txt', 'utf-8'),
    text2 = fs.readFileSync(__dirname + '/text2.txt', 'utf-8');

exports['Async'] = {
  'no progress callback': function(done) {
    this.timeout(20000);

    var startTime = new Date().valueOf();

    levenshtein.getAsync(text1, text2, function(err, distance) {
      var timeElapsed = new Date().valueOf() - startTime;

      expect(err).to.be.null;
      expect(distance).to.eql(194);

      console.log(timeElapsed + ' ms');

      done();
    });
  },
  'with progress callback': function(done) {
    this.timeout(20000);

    var percents = [];
    var progress = function(percent) {
      percents.push(percent);
    };

    var startTime = new Date().valueOf();

    levenshtein.getAsync(text1, text2, function(err, distance) {
      var timeElapsed = new Date().valueOf() - startTime;

      expect(err).to.be.null;
      expect(distance).to.eql(194);

      console.log(timeElapsed + ' ms, ' + percents.length + ' progress updates');

      expect(0 < percents.length).to.be.true;

      // check percentages
      var lastPercent = 0;
      _.each(percents, function(percent) {
        expect(100 >= percent);
        expect(percent > lastPercent);
        lastPercent = percent;
      });

      done();
    }, {
      progress: progress
    });
  },
  'progress callback error': function(done) {
    levenshtein.getAsync(text1 + text2, text2 + text1, function(err) {
      expect(err.toString()).to.be.eql('Progress callback: Error: Bla bla');

      done();
    }, {
      progress: function() {
        throw new Error('Bla bla');
      }
    });
  }
};

