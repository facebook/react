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
 * @providesModule ReactDOMIDOperationsRemote
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var RemoteModule = require('RemoteModule');

var keyOf = require('keyOf');

var ReactDOMIDOperationsRemote = new RemoteModule(
  ExecutionEnvironment.global,
  keyOf({ReactDOMIDOperations: null}),
  {
    updatePropertyByID: null,
    deletePropertyByID: null,
    updateStylesByID: null,
    updateImageByID: null,
    updateTextContentByID: null,
    dangerouslyReplaceNodeWithMarkupByID: null,
    dangerouslyProcessChildrenUpdates: null
  }
);

module.exports = ReactDOMIDOperationsRemote;
