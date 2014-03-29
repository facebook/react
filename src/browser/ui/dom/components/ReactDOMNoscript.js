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
 * @providesModule ReactDOMNoscript
 */

"use strict";

var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactChildren = require('ReactChildren');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');
var ReactServerRendering = require('ReactServerRendering');

var invariant = require ('invariant');
var merge = require('merge');

// Store a reference to the <noscript> `ReactDOMComponent`.
var noscript = ReactDOM.noscript;

/**
 * Implements a <noscript> native component that renders its children as a
 * (static markup) string. This allows you to nest your components in a
 * <noscript> for server-side rendering without causing reconciliation problems
 * for the browser (where they would be seen as a string anyway).
 */
var ReactDOMNoscript = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMNoscript',
  tagName: 'NOSCRIPT',

  mixins: [ReactBrowserComponentMixin],

  render: function() {
    var props = this.props;

    // Note the use of `==` which checks for null or undefined.
    invariant(
      props.children == null || props.dangerouslySetInnerHTML == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'
    );

    if (props.children != null) {
      // Clone `this.props` so we don't mutate the input.
      props = merge(props);

      var serializedChildren = [];
      ReactChildren.forEach(this.props.children, function(child) {
        serializedChildren.push(
          ReactServerRendering.renderComponentToStaticMarkup(child)
        );
      });
      props.children = null;
      props.dangerouslySetInnerHTML = {__html: serializedChildren.join('')};
    }

    return noscript(props);
  }
});

module.exports = ReactDOMNoscript;
