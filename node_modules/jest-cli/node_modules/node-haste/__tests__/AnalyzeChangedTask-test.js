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

describe('AnalyzeChangedTask', function() {

  var AnalyzeChangedTask = require('../lib/AnalyzeChangedTask');
  var ConfigurationTrie = require('../lib/ConfigurationTrie');
  var loaders = require('../lib/loaders');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  describe('serialize', function() {

    it('should serialize loaders', function() {
      var task = new AnalyzeChangedTask(
        [
          new loaders.JSLoader({
            extractSpecialRequires: true,
            networkSize: true
          }),
          new loaders.CSSLoader({
            networkSize: true
          }),
          new loaders.ImageLoader(),
          new loaders.ProjectConfigurationLoader(),
          new loaders.ResourceLoader()
        ],
        new ConfigurationTrie([]));

      var task2 = AnalyzeChangedTask.fromObject(task.toObject());

      expect(task2.loaders.length).toBe(5);
      expect(task2.loaders[0].options).toEqual({
        extractSpecialRequires: true,
        networkSize: true
      });
    });

    it('should serialize ConfigurationTrie', function() {
      var task = new AnalyzeChangedTask(
        [],
        new ConfigurationTrie([
          new ProjectConfiguration('a/package.json', { foo: 'bar' }),
          new ProjectConfiguration('b/c/package.json', {})
        ]));

      var task2 = AnalyzeChangedTask.fromObject(task.toObject());
      expect(task2.configurationTrie.configurations.length).toBe(2);

    });
  });

  describe('Loading', function() {
    var path = require('path');
    var waitsForCallback = require('../lib/test_helpers/waitsForCallback');
    var MessageList = require('../lib/MessageList');
    var Resource = require('../lib/resource/Resource');
    var testData = path.join(__dirname, '..', '__test_data__', 'JS');

    it('should aggregate messages from loaders', function() {
      var loader = new loaders.ResourceLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));
      spyOn(loader, 'loadFromPath')
        .andCallFake(function(path, configuration, callback) {
          var messages = new MessageList();
          messages.addError(path, 'foo', 'bar');
          callback(messages, new Resource(path));
        });

      waitsForCallback(
        function(callback) {
          task.run(['a/b.js', 'a/c.js'], callback);
        },
        function(messages) {
          expect(messages.length).toBe(2);
        }
      );
    });

    it('should load resource when changed', function() {
      var loader = new loaders.ResourceLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));
      spyOn(loader, 'loadFromPath')
        .andCallFake(function(path, configuration, callback) {
          expect(path).toBe('sub/added.js');
          expect(configuration).toBe(undefined);
          callback(new MessageList(), new Resource('sub/added.js'));
        });

      waitsForCallback(
        function(callback) {
          task.run(['sub/added.js'], callback);
        },
        function() {}
      );
    });

    it('should load resource with matching configuration', function() {
      var loader = new loaders.ResourceLoader();
      var config = new ProjectConfiguration('sub/project.json', {});
      var task = new AnalyzeChangedTask(
        [loader],
        new ConfigurationTrie([config]));
      spyOn(loader, 'loadFromPath')
        .andCallFake(function(path, configuration, callback) {
          expect(path).toBe('sub/added.js');
          expect(configuration).toBe(config);
          callback(new MessageList(), new Resource('sub/added.js'));
        });

      waitsForCallback(
        function(callback) {
          task.run(['sub/added.js'], callback);
        },
        function() {}
      );
    });

    it('should load resource in a subprocess', function() {
      var loader = new loaders.JSLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));

      waitsForCallback(
        function(callback) {
          task.runInForks(1, [path.join(testData, 'module.js')], callback);
        },
        function(messages, resources, skipped) {
          expect(resources.length).toBe(1);
          expect(resources[0])
            .toEqual(jasmine.any(require('../lib/resource/JS')));
        }
      );
    });

    it('should load resource in a subprocess with messages', function() {
      var loader = new loaders.JSLoader();
      var task = new AnalyzeChangedTask([loader], new ConfigurationTrie([]));

      waitsForCallback(
        function(callback) {
          task.runInForks(
            1,
            [path.join(testData, 'deprecated.js')],
            callback);
        },
        function(messages, resources, skipped) {
          expect(messages.length).toBe(1);
          expect(messages.render()).toContain('@suggests is deprecated');
        }
      );
    });
  });
});
