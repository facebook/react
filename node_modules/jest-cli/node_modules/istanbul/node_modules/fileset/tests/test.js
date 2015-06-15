
var EventEmitter = require('events').EventEmitter,
  fileset = require('../'),
  assert = require('assert'),
  test = require('./helper');

// Given a **.coffee pattern
test('Given a **.md pattern', function() {

  return {
    'should return the list of matching file in this repo': function(em) {
      fileset('*.md', function(err, results) {
        if(err) return em.emit('error', err);
        assert.ok(Array.isArray(results), 'should be an array');
        assert.ok(results.length, 'should return at least one element');
        assert.equal(results.length, 1, 'actually, should return only one');
        em.emit('end');
      });
    }
  }
});

test('Say we want the **.js files, but not those in node_modules', function() {

  return {
    'Should recursively walk the dir and return the matching list': function(em) {
      fileset('**/*.js', 'node_modules/**', function(err, results) {
        if(err) return em.emit('error', err);
        assert.ok(Array.isArray(results), 'should be an array');
        assert.equal(results.length, 4);
        em.emit('end');
      });
    },

    'Should support multiple paths at once': function(em) {
      fileset('**/*.js *.md', 'node_modules/**', function(err, results) {
        if(err) return em.emit('error', err);
        assert.ok(Array.isArray(results), 'should be an array');
        assert.equal(results.length, 5);

        assert.deepEqual(results, [
          'README.md',
          'lib/fileset.js',
          'tests/fixtures/an (odd) filename.js',
          'tests/helper.js',
          'tests/test.js'
        ]);

        em.emit('end');
      });
    },

    'Should support multiple paths for excludes as well': function(em) {
      fileset('**/*.js *.md', 'node_modules/** **.md tests/*.js', function(err, results) {
        if(err) return em.emit('error', err);
        assert.ok(Array.isArray(results), 'should be an array');
        assert.equal(results.length, 2);

        assert.deepEqual(results, [
          'lib/fileset.js',
          'tests/fixtures/an (odd) filename.js',
        ]);

        em.emit('end');
      });
    }
  }
});


test('Testing out emmited events', function() {

  // todos: the tests for match, include, exclude events, but seems like it's ok
  return {
    'Should recursively walk the dir and return the matching list': function(em) {
      fileset('**/*.js', 'node_modules/**')
        .on('error', em.emit.bind(em, 'error'))
        .on('end', function(results) {
          assert.ok(Array.isArray(results), 'should be an array');
          assert.equal(results.length, 4);
          em.emit('end');
        });
    },

    'Should support multiple paths at once': function(em) {
      fileset('**/*.js *.md', 'node_modules/**')
        .on('error', em.emit.bind(em, 'error'))
        .on('end', function(results) {
          assert.ok(Array.isArray(results), 'should be an array');
          assert.equal(results.length, 5);

          assert.deepEqual(results, [
            'README.md',
            'lib/fileset.js',
            'tests/fixtures/an (odd) filename.js',
            'tests/helper.js',
            'tests/test.js'
          ]);

          em.emit('end');
        });
    }
  }
});


test('Testing patterns passed as arrays', function() {

  return {
    'Should match files passed as an array with odd filenames': function(em) {
      fileset(['lib/*.js', 'tests/fixtures/an (odd) filename.js'], ['node_modules/**'])
        .on('error', em.emit.bind(em, 'error'))
        .on('end', function(results) {
          assert.ok(Array.isArray(results), 'should be an array');
          assert.equal(results.length, 2);

          assert.deepEqual(results, [
            'lib/fileset.js',
            'tests/fixtures/an (odd) filename.js',
          ]);

          em.emit('end');
        });
    }
  }

});



test.run();


