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
 * @providesModule putDOMComponentListener
 */

"use strict";

var ReactEventEmitter = require('ReactEventEmitter');
var ReactMount = require('ReactMount');

var listenTo = ReactEventEmitter.listenTo;

var ELEMENT_NODE_TYPE = 1;

function putDOMComponentListener(id, registrationName, listener) {
  var container = ReactMount.findReactContainerForID(id);
  if (container) {
    var doc = container.nodeType === ELEMENT_NODE_TYPE ?
      container.ownerDocument :
      container;
    listenTo(registrationName, doc);
  }

  ReactEventEmitter.putListener(id, registrationName, listener);
}

module.exports = putDOMComponentListener;
