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
 * @providesModule ReactDOMNodeMappingRemote
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var RemoteModule = require('RemoteModule');

var keyOf = require('keyOf');

var ReactDOMNodeMappingRemote = new RemoteModule(
  ExecutionEnvironment.global,
  keyOf({ReactDOMNodeMapping: null}),
  // TODO: we should codegen this when we move to a better bridge
  // so we can get type checking.
  // TODO: should we move this out of ReactDOMNodeMapping?
  {
    registerContainerHandle: null,
    unmountComponentAtHandle: null,
    registerComponentInContainer: null
  }
);

module.exports = ReactDOMNodeMappingRemote;
