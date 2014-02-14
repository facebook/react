/**
 * Copyright 2014 Facebook, Inc.
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
 * @providesModule ReactEmptyComponent
 */

"use strict";

var invariant = require('invariant');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');

// Stopgap solution until a component can truly return `null`.
var ReactEmptyComponent = ReactCompositeComponent.createClass({
  displayName: 'ReactEmptyComponent',

  render: function() {
    invariant(
      this.props.children == null,
      'ReactEmptyComponent: passing children into this component doesn\'t ' +
      'make sense.'
    );
    return ReactDOM.noscript();
  },
});

module.exports = ReactEmptyComponent;
