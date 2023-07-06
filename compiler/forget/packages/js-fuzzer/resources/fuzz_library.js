// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Slightly modified variants from http://code.fitness/post/2016/01/javascript-enumerate-methods.html.
function __isPropertyOfType(obj, name, type) {
  let desc;
  try {
    desc = Object.getOwnPropertyDescriptor(obj, name);
  } catch(e) {
    return false;
  }

  if (!desc)
    return false;

  return typeof type === 'undefined' || typeof desc.value === type;
}

function __getProperties(obj, type) {
  if (typeof obj === "undefined" || obj === null)
    return [];

  let properties = [];
  for (let name of Object.getOwnPropertyNames(obj)) {
    if (__isPropertyOfType(obj, name, type))
      properties.push(name);
  }

  let proto = Object.getPrototypeOf(obj);
  while (proto && proto != Object.prototype) {
    Object.getOwnPropertyNames(proto)
      .forEach (name => {
        if (name !== 'constructor') {
          if (__isPropertyOfType(proto, name, type))
            properties.push(name);
        }
      });
    proto = Object.getPrototypeOf(proto);
  }
  return properties;
}

function* __getObjects(root = this, level = 0) {
    if (level > 4)
      return;

    let obj_names = __getProperties(root, 'object');
    for (let obj_name of obj_names) {
      let obj = root[obj_name];
      if (obj === root)
        continue;

      yield obj;
      yield* __getObjects(obj, level + 1);
    }
}

function __getRandomObject(seed) {
  let objects = [];
  for (let obj of __getObjects()) {
    objects.push(obj);
  }

  return objects[seed % objects.length];
}

function __getRandomProperty(obj, seed) {
  let properties = __getProperties(obj);
  if (!properties.length)
    return undefined;

  return properties[seed % properties.length];
}

function __callRandomFunction(obj, seed, ...args)
{
  let functions = __getProperties(obj, 'function');
  if (!functions.length)
    return;

  let random_function = functions[seed % functions.length];
  try {
    obj[random_function](...args);
  } catch(e) { }
}

function runNearStackLimit(f) {
  function t() {
    try {
      return t();
    } catch (e) {
      return f();
    }
  };
  try {
    return t();
  } catch (e) {}
}

// Limit number of times we cause major GCs in tests to reduce hangs
// when called within larger loops.
let __callGC;
(function() {
  let countGC = 0;
  __callGC = function() {
    if (countGC++ < 50) {
      gc();
    }
  };
})();

// Neuter common test functions.
try { this.failWithMessage = nop; } catch(e) { }
try { this.triggerAssertFalse = nop; } catch(e) { }
try { this.quit = nop; } catch(e) { }
