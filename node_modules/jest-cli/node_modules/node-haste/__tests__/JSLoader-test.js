/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JSLoader', function() {
  var path = require('path');
  var JS = require('../lib/resource/JS');
  var JSLoader = require('../lib/loader/JSLoader');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var ResourceMap = require('../lib/ResourceMap');
  var loadResouce = require('../lib/test_helpers/loadResource');
  var MessageList = require('../lib/MessageList');
  var waitsForCallback = require('../lib/test_helpers/waitsForCallback');

  var testData = path.join(__dirname, '..', '__test_data__', 'JS');


  it('should match package.json paths', function() {
    var loader =new JSLoader();
    expect(loader.matchPath('x.js')).toBe(true);
    expect(loader.matchPath('a/x.js')).toBe(true);
    expect(loader.matchPath('a/1.css')).toBe(false);
  });

  it('should parse old school components', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'oldSchoolComponent.js'),
      null,
      function(errors, js) {
        expect(js.isModule).toBe(false);
        expect(js.id).toBe('oldSchoolComponent-tag');
        expect(js.requiredLegacyComponents).toEqual(['foo', 'bar']);
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });


  it('should parse modules with requires', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'module.js'),
      null,
      function(errors, js) {
        expect(js.isModule).toBe(true);
        expect(js.id).toBe('module-tag');
        expect(js.requiredModules).toEqual(['foo', 'bar']);
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });


  it('should parse javelin', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'javelin.js'),
      null,
      function(errors, js) {
        expect(js.isModule).toBe(true);
        expect(js.isJavelin).toBe(true);
        expect(js.isRunWhenReady).toBe(true);
        expect(js.id).toBe('JX.MSteps');
        expect(js.requiredLegacyComponents)
          .toEqual(['javelin-dom', 'javelin-install', 'javelin-stratcom']);
      });
  });

  it('should exptract network size', function() {
    loadResouce(
      new JSLoader({ networkSize: true }),
      path.join(testData, 'javelin.js'),
      null,
      function(errors, js) {
        expect(js.networkSize > 0).toBe(true);
      });
  });

  it('should exptract javelin symbols', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'javelin.js'),
      null,
      function(errors, js) {
        expect(js.definedJavelinSymbols).toEqual(['JX.MSteps']);
        expect(js.requiredJavelinSymbols.sort())
          .toEqual(['JX.URL', 'JX.install']);
      });
  });

  it('should exptract javelin symbols and networkSize', function() {
    loadResouce(
      new JSLoader({
        networkSize: true
      }),
      path.join(testData, 'javelin.js'),
      null,
      function(errors, js) {
        expect(js.definedJavelinSymbols).toEqual(['JX.MSteps']);
        expect(js.requiredJavelinSymbols.sort())
          .toEqual(['JX.URL', 'JX.install']);
        expect(js.networkSize > 0).toBe(true);
      });
  });

  it('should resolve paths using configuration', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'configured', 'a.js'),
      new ProjectConfiguration(
        path.join(testData, 'configured', 'package.json'),
        {}),
      function(errors, js) {
        expect(js.id).toBe(path.join('configured','a.js'));
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });


  it('should resolve commonJS "main" modules post process', function() {
    var map;

    waitsForCallback(
      // test
      function(callback) {
        var loader = new JSLoader();
        map = new ResourceMap([
          // hasCustomMain dependency project
          JS.fromObject({
            id: 'hasCustomMain/folderWithMain/customMainModule.js',
            path: path.join(
              testData,
              'hasCustomMain',
              'folderWithMain',
              'customMainModule.js'
            ),
            requiredModules: []
          }),
          new ProjectConfiguration(
            path.join(testData, 'hasCustomMain', 'package.json'), {
              name: 'hasCustomMain',
              main: 'folderWithMain/customMainModule.js'
            }
          ),

          // hasStandardIndex dependency project
          JS.fromObject({
            id: 'hasStandardIndex/index.js',
            path: path.join(testData, 'hasStandardIndex', 'index.js'),
            requiredModules: []
          }),
          new ProjectConfiguration(
            path.join(testData, 'hasStandardIndex', 'package.json'),
            {name: 'hasStandardIndex'}  // Defaults main to index.js
          ),


          JS.fromObject({
            id: 'commonJSProject/dependsOnCustomMain.js',
            path: path.join(
              testData,
              'commonJSProject',
              'dependsOnCustomMain.js'
            ),
            requiredModules: ['hasCustomMain']
          }),
          JS.fromObject({
            id: 'commonJSProject/dependsOnStandardIndex.js',
            path: path.join(
              testData,
              'commonJSProject',
              'dependsOnStandardIndex.js'
            ),
            requiredModules: ['hasStandardIndex']
          }),
          new ProjectConfiguration(
            path.join(testData, 'commonJSProject', 'package.json'),
            {name: 'commonJSProject'}  // Must mirror what node will *actually* find
          )
        ]);

        loader.postProcess(map, map.getAllResourcesByType('JS'), callback);
      },

      // expectation
      function(messages) {
        expect(messages).toEqual(jasmine.any(MessageList));
        expect(
          map.getResource('JS', 'commonJSProject/dependsOnCustomMain.js')
            .requiredModules
        ).toEqual(['hasCustomMain/folderWithMain/customMainModule.js']);

        expect(
          map.getResource('JS', 'commonJSProject/dependsOnCustomMain.js')
            ._requiredTextToResolvedID
        ).toEqual({
          'hasCustomMain': 'hasCustomMain/folderWithMain/customMainModule.js'
        });

        expect(
          map.getResource('JS', 'commonJSProject/dependsOnStandardIndex.js')
            .requiredModules
        ).toEqual(['hasStandardIndex/index.js']);
        expect(
          map.getResource('JS', 'commonJSProject/dependsOnStandardIndex.js')
            ._requiredTextToResolvedID
        ).toEqual({'hasStandardIndex': 'hasStandardIndex/index.js'});
      }
    );
  });

  it('should resolve intern rel paths *with* package process', function() {
    var map;

    waitsForCallback(
      // test
      function(callback) {
        var loader = new JSLoader();
        map = new ResourceMap([
          JS.fromObject({
            id: 'configured/a.js',
            path: path.join(testData, 'configured', 'a.js'),
            requiredModules: ['./b']   // TODO: add more interesting things here
          }),
          JS.fromObject({
            id: 'configured/b.js',
            path: path.join(testData, 'configured', 'b.js')
          }),
          new ProjectConfiguration(
            path.join(testData, 'configured', 'package.json'),
            {name: 'configured'}  // Must mirror what node will *actually* find
          )
        ]);

        loader.postProcess(map, map.getAllResourcesByType('JS'), callback);
      },

      // expectation
      function(messages) {
        expect(messages).toEqual(jasmine.any(MessageList));
        expect(
          map.getResource('JS', 'configured/a.js').requiredModules)
          .toEqual(['configured/b.js']
        );
        expect(
          map.getResource('JS', 'configured/a.js')._requiredTextToResolvedID
        ).toEqual({'./b': 'configured/b.js'});
      }
    );
  });

  it('should resolve local paths without package.json', function() {
    var map;

    waitsForCallback(
      // test
      function(callback) {
        var jsLoader = new JSLoader();
        map = new ResourceMap([
          JS.fromObject({
            id: 'configured/a.js',
            path: path.join(testData, 'configured', 'a.js'),
            requiredModules: ['./b']
          }),
          JS.fromObject({
            id: 'configured/b.js',
            path: path.join(testData, 'configured', 'b.js'),
            requiredModules: []
          })
        ]);
        jsLoader.postProcess(map, map.getAllResources(), callback);
      },

      // expectation
      function(messages) {
        expect(messages).toEqual(jasmine.any(MessageList));
        expect(
          map.getResource('JS', 'configured/a.js').requiredModules
        ).toEqual(['configured/b.js']);
      }
    );
  });
});
