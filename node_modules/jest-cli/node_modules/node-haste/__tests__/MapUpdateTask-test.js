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

describe("MapUpdateTask", function() {
  var MapUpdateTask = require('../lib/MapUpdateTask');
  var Resource = require('../lib/resource/Resource');
  var ResourceLoader = require('../lib/loader/ResourceLoader');
  var ResourceMap = require('../lib/ResourceMap');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var ProjectConfigurationLoader =
    require('../lib/loader/ProjectConfigurationLoader');
  var MessageList = require('../lib/MessageList');

  var waitsForCallback = require('../lib/test_helpers/waitsForCallback');
  var node_path = require('path');

  function expectChanges(changed, expected) {
    expect(changed.length).toBe(expected.length);
    var pathMap = {};
    changed.map(function(record) {
      pathMap[record.path] = record;
    });
    expected.forEach(function(pair) {
      expect(pathMap[pair[1]]).toBeDefined('Change exists ' + pair[1]);
      if (pair[0] === 'added') {
        expect(pathMap[pair[1]].oldResource).toBe(null);
        expect(pathMap[pair[1]].newPath).toBe(pair[1]);
      } else if (pair[0] === 'changed') {
        expect(pathMap[pair[1]].oldResource.path).toBe(pair[1]);
        expect(pathMap[pair[1]].newPath).toBe(pair[1]);
      } else if (pair[0] === 'removed') {
        expect(pathMap[pair[1]].oldResource.path).toBe(pair[1]);
        expect(pathMap[pair[1]].newPath).toBe(null);
      }
    });
  }

  function addMtime(mtime, resource) {
    resource.mtime = mtime;
    return resource;
  }

  it("should find changed files", function() {
    var files = [
      ['sub/added.js', 1300000000000],
      ['changed.js', 1300000000000],
      ['unmodified.js', 1300000000000]
    ];
    var map = new ResourceMap([
      addMtime(1200000000000, new Resource('sub/removed.js')),
      addMtime(1200000000000, new Resource('changed.js')),
      addMtime(1300000000000, new Resource('unmodified.js'))
    ]);
    var task = new MapUpdateTask(
      files,
      [],
      map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['added', node_path.join('sub','added.js')],
        ['removed', node_path.join('sub','removed.js')],
        ['changed', node_path.join('changed.js')]
      ]);
    });
  });

  it('should find changes on package.json deletion', function() {
    var files = [
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000]
    ];
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1300000000000, new ProjectConfiguration('p1/package.json', {}))
    ]);
    var task = new MapUpdateTask(
      files,
      [],
      map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', node_path.join('p1','a','1.js')],
        ['changed', node_path.join('p1','b','2.js')],
        ['removed', node_path.join('p1','package.json')]
      ]);
    });
  });

  it('should find changes on package.json deletion + haste dirs', function() {
    var files = [
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000]
    ];
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1300000000000, new ProjectConfiguration('p1/package.json', {
        haste: { roots: ['a'] }
      }))
    ]);
    var task = new MapUpdateTask(files, [], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', node_path.join('p1','a','1.js')],
        ['removed', node_path.join('p1','package.json')]
      ]);
    });
  });

  it('should find changes on package.json addition', function() {
    var files = [
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000],
      ['p1/package.json', 1300000000000]
    ];
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js'))
    ]);
    var configurationLoader = new ProjectConfigurationLoader();
    spyOn(configurationLoader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        callback(
          new MessageList(),
          new ProjectConfiguration('p1/package.json', {}));
      });

    var task = new MapUpdateTask(files, [configurationLoader], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', node_path.join('p1','a','1.js')],
        ['changed', node_path.join('p1','b','2.js')],
        ['added', node_path.join('p1','package.json')]
      ]);
    });
  });

  it('should find changes on package.json change', function() {
    var files = [
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000],
      ['p1/package.json', 1300000000000]
    ];
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1200000000000, new ProjectConfiguration('p1/package.json', {
        haste: { roots: ['a'] }
      }))
    ]);
    var configurationLoader = new ProjectConfigurationLoader();
    spyOn(configurationLoader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        expect(path).toBe(node_path.join('p1','package.json'));
        callback(
          new MessageList(),
          new ProjectConfiguration('p1/package.json', {}));
      });

    var task = new MapUpdateTask(files, [configurationLoader], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', node_path.join('p1','a','1.js')],
        ['changed', node_path.join('p1','b','2.js')],
        ['changed', node_path.join('p1','package.json')]
      ]);
    });
  });

  it('should find changes on package.json change + haste dirs', function() {
    var files = [
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000],
      ['p1/package.json', 1300000000000]
    ];
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1200000000000, new ProjectConfiguration('p1/package.json', {
        haste: { roots: ['a'] }
      }))
    ]);
    var configurationLoader = new ProjectConfigurationLoader();
    spyOn(configurationLoader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        callback(
          new MessageList(),
          new ProjectConfiguration('p1/package.json', {
            haste: { roots: ['a'] }
          }));
      });

    var task = new MapUpdateTask(files, [configurationLoader], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', node_path.join('p1','a','1.js')],
        ['changed', node_path.join('p1','package.json')]
      ]);
    });
  });

  it('should load resource when changed', function() {
    var finder = [
      ['sub/added.js', 1300000000000]
    ];
    var map = new ResourceMap([]);
    var loader = new ResourceLoader();
    var task = new MapUpdateTask(finder, [loader], map);
    spyOn(loader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        expect(path).toBe(node_path.join('sub','added.js'));
        callback(new MessageList(), new Resource('sub/added.js'));
      });

    waitsForCallback(
      function(callback) {
        task.on('complete', callback);
        task.run();
      },
      function() {}
    );
  });

  it('should not load deleted resource', function() {
    var files = [];
    var old = addMtime(1200000000000, new Resource('sub/deleted.js'));
    var map = new ResourceMap([old]);
    var loader = new ResourceLoader();
    var task = new MapUpdateTask(files, [loader], map);
    spyOn(loader, 'loadFromPath');

    waitsForCallback(
      function(callback) {
        task.on('complete', callback).run();
      },
      function() {
        expect(loader.loadFromPath).not.toHaveBeenCalled();
      }
    );
  });

  it('should aggregate messages from loaders', function() {
    var files = [
      ['sub/new1.js', 1300000000000],
      ['sub/new2.js', 1300000000000]
    ];
    var map = new ResourceMap([]);
    var loader = new ResourceLoader();
    var task = new MapUpdateTask(files, [loader], map);
    spyOn(loader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        var messages = new MessageList();
        messages.addError(path, 'foo', 'bar');
        callback(messages, new Resource(path));
      });

    waitsForCallback(
      function(callback) {
        task.on('complete', callback).run();
      },
      function() {
        expect(task.messages.length).toBe(2);
      }
    );
  });

  it('should aggregate messages from postProcess', function() {
    var files = [
      ['sub/new1.js', 1300000000000],
      ['sub/new2.js', 1300000000000]
    ];
    var map = new ResourceMap([]);
    var loader = new ResourceLoader();
    var task = new MapUpdateTask(files, [loader], map);
    spyOn(loader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        var messages = new MessageList();
        process.nextTick(function() {
          callback(messages, new Resource(path));
        });
      });

    spyOn(loader, 'postProcess')
      .andCallFake(function(map, resources, callback) {
        expect(resources.length).toBe(2);
        expect(resources[0]).toEqual(jasmine.any(Resource));
        var messages = new MessageList();
        resources.forEach(function(resource) {
          messages.addError(resource.path, 'foo', 'bar');
        });
        callback(messages);
      });

    waitsForCallback(
      function(callback) {
        task.on('complete', callback).run();
      },
      function() {
        expect(task.messages.length).toBe(2);
      }
    );
  });

});
