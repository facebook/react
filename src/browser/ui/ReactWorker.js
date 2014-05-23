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
 * @providesModule ReactWorker
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactComponentBrowserEnvironment =
  require('ReactComponentBrowserEnvironment');
var ReactDOMIDOperations = require('ReactDOMIDOperations');
var ReactDOMNodeMapping = require('ReactDOMNodeMapping');
var ReactEventListener = require('ReactEventListener');
var RemoteModule = require('RemoteModule');
var RemoteModuleServer = require('RemoteModuleServer');

var keyOf = require('keyOf');

// The UI thread uses this to kick off the worker.
class ReactWorker {
  constructor(scriptURI) {
    this.worker = new Worker(scriptURI);
    this.server = new RemoteModuleServer(this.worker, {
      ReactComponentBrowserEnvironment: ReactComponentBrowserEnvironment,
      ReactDOMIDOperations: ReactDOMIDOperations,
      ReactDOMNodeMapping: ReactDOMNodeMapping,
      ReactEventListener: ReactEventListener
    });

    var ReactEventEmitterRemote = new RemoteModule(
      this.worker,
      keyOf({ReactEventEmitter: null}),
      {handleTopLevel: null}
    );

    ReactEventListener.setHandleTopLevel(
      function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
        ReactEventEmitterRemote.handleTopLevel(
          topLevelType,
          {},
          topLevelTargetID,
          {target: {}}
        );
      }
    );
  }

  terminate() {
    this.server.destroy();
    this.worker.terminate();
  }
}

ReactWorker.run = function(script, dependencies, main) {
  if (ExecutionEnvironment.canUseDOM) {
    return new ReactWorker(script);
  } else {
    if (dependencies.length > 0) {
      importScripts.apply(null, dependencies);
    }
    main();
    return self;
  }
};

module.exports = ReactWorker;
