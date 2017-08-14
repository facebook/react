/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */
'use strict';

var babel = require('babel-core');
var UglifyJs = require('uglify-js');
var testMinificationUsedDCE;

describe('in the production environment', () => {
  let oldProcess;
  beforeEach(() => {
    __DEV__ = false;

    // Mutating process.env.NODE_ENV would cause our babel plugins to do the
    // wrong thing. If you change this, make sure to test with jest --no-cache.
    oldProcess = process;
    global.process = {
      ...process,
      env: {...process.env, NODE_ENV: 'production'},
    };

    jest.resetModules();
    testMinificationUsedDCE = require('testMinificationUsedDCE');
  });

  afterEach(() => {
    __DEV__ = true;
    global.process = oldProcess;
  });

  describe('when not minified', () => {
    it('should not throw', () => {
      expect(() => {
        testMinificationUsedDCE();
        jest.runAllTimers();
      }).not.toThrow();
    });
  });

  describe('with uglifyjs', () => {
    describe('when envified first, then minification with *no* DCE', () => {
      it('should throw', () => {
        // envify: change `process.env.NODE_ENV` to `"production"`
        var rawCode = testMinificationUsedDCE
          .toString()
          .replace(/process\.env\.NODE_ENV/, '"production"');
        var code = {'file.js': rawCode};
        var options = {fromString: true, parse: {dead_code: false}};
        var result = UglifyJs.minify(code, options);
        const minifiedWithNoDCE = () => eval('(' + result.code + ')()');
        expect(() => {
          minifiedWithNoDCE();
          jest.runAllTimers();
        }).toThrow(
          'React is running in production mode, but dead code elimination ' +
            'has not been applied.',
        );
      });
    });

    describe('when envified first, then minified and *yes* successful DCE', () => {
      it('should not throw', () => {
        // envify: change `process.env.NODE_ENV` to `"production"`
        var rawCode = testMinificationUsedDCE
          .toString()
          .replace(/process\.env\.NODE_ENV/g, '"production"');
        var code = {'file.js': rawCode};
        var options = {fromString: true, parse: {dead_code: true}};
        var result = UglifyJs.minify(code, options);
        const minifiedWithNoDCE = () => eval('(' + result.code + ')()');
        expect(() => {
          minifiedWithNoDCE();
          jest.runAllTimers();
        }).not.toThrow();
      });
    });

    describe('when minified first with *unsuccessful* DCE, then envified', () => {
      it('should throw', () => {
        var code = {'file.js': testMinificationUsedDCE.toString()};
        var options = {fromString: true, parse: {dead_code: true}};
        var result = UglifyJs.minify(code, options);
        // late envify: change `process.env.NODE_ENV` to `"production"`
        var resultCode = result.code.replace(
          /process\.env\.NODE_ENV/g,
          '"production"',
        );
        const minifiedWithNoDCE = () => eval('(' + resultCode + ')()');
        expect(() => {
          minifiedWithNoDCE();
          jest.runAllTimers();
        }).toThrow(
          'React is running in production mode, but dead code elimination ' +
            'has not been applied.',
        );
      });
    });
  });

  describe('when minified with babel/minify with *no* DCE', () => {
    xit('should throw', () => {
      const babelOpts = {
        presets: ['babel-preset-minify'],
      };
      // TODO: Why is this not actually minifying the code????
      const minifiedWithNoDCE = () => {
        eval(
          babel.transform(testMinificationUsedDCE.toString(), babelOpts).code,
        );
      };
      expect(() => {
        minifiedWithNoDCE();
        jest.runAllTimers();
      }).toThrow();
    });
  });

  describe('when minified with babel/minify with DCE', () => {
    xit('should not throw', () => {
      const babelOpts = {
        plugins: ['minify-dead-code-elimination'],
        presets: ['babel-preset-minify'],
      };
      // TODO: Why is this not actually minifying the code????
      const minifiedWithDCE = () => {
        eval(
          babel.transform(testMinificationUsedDCE.toString(), babelOpts).code,
        );
      };
      expect(() => {
        testMinificationUsedDCE();
        jest.runAllTimers();
      }).not.toThrow();
    });
  });
});
