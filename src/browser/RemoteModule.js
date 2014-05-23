/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule RemoteModule
 * @typechecks static-only
 */

// TODO: use a better bridging system that doesn't marshal strings all
// the time.
class RemoteModule {
  constructor(target, name, methods) {
    this.target = target;
    this.name = name;
    for (var method in methods) {
      this[method] = this.invoke.bind(this, method);
    }
  }

  invoke(name) {
    // No return values allowed!
    var args = Array.prototype.slice.call(arguments, 1);
    this.target.postMessage([this.name, name, args]);
  }
}

module.exports = RemoteModule;
