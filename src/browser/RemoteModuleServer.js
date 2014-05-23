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
 * @providesModule RemoteModuleServer
 * @typechecks static-only
 */

var invariant = require('invariant');

class RemoteModuleServer {
  /**
   * @param {object} target web worker receiving messages for this server.
   * @param {object} modules mapping of module name to module instance
   */
  constructor(target, modules) {
    invariant(!target.onmessage, 'target already has an onmessage handler');
    this.target = target;
    this.modules = modules;

    this.target.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    var moduleName = event.data[0];
    var methodName = event.data[1];
    var args = event.data[2];

    invariant(
      this.modules[moduleName],
      'Module name %s not found',
      moduleName
    );
    invariant(
      this.modules[moduleName][methodName].apply,
      'Method %s.%s not found',
      moduleName,
      methodName
    );

    try {
      this.modules[moduleName][methodName].apply(
        this.modules[moduleName],
        args
      );
    } catch (e) {
      console.log(e.stack);
    }
  }

  destroy() {
    this.target.onmessage = null;
  }
}

module.exports = RemoteModuleServer;
