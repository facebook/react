/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * This is a web interface for the HTML to JSX converter contained in
 * `html-jsx-lib.js`.
 */
"use strict";

;(function () {

  var HELLO_COMPONENT = "\
<!-- Hello world -->\n\
<div class=\"awesome\" style=\"border: 1px solid red\">\n\
  <label for=\"name\">Enter your name: </label>\n\
  <input type=\"text\" id=\"name\" />\n\
</div>\n\
<p>Enter your HTML here</p>\
";

  var HTMLtoJSXComponent = React.createClass({
    displayName: "HTMLtoJSXComponent",

    getInitialState: function getInitialState() {
      return {
        outputClassName: 'NewComponent',
        createClass: true
      };
    },
    onReactClassNameChange: function onReactClassNameChange(evt) {
      this.setState({ outputClassName: evt.target.value });
    },
    onCreateClassChange: function onCreateClassChange(evt) {
      this.setState({ createClass: evt.target.checked });
    },
    setInput: function setInput(input) {
      this.setState({ input: input });
      this.convertToJsx();
    },
    convertToJSX: function convertToJSX(input) {
      var converter = new HTMLtoJSX({
        outputClassName: this.state.outputClassName,
        createClass: this.state.createClass
      });
      return converter.convert(input);
    },
    render: function render() {
      return React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { id: "options" },
          React.createElement(
            "label",
            null,
            React.createElement("input", {
              type: "checkbox",
              checked: this.state.createClass,
              onChange: this.onCreateClassChange }),
            "Create class"
          ),
          React.createElement(
            "label",
            { style: { display: this.state.createClass ? '' : 'none' } },
            "· Class name:",
            React.createElement("input", {
              type: "text",
              value: this.state.outputClassName,
              onChange: this.onReactClassNameChange })
          )
        ),
        React.createElement(ReactPlayground, {
          codeText: HELLO_COMPONENT,
          renderCode: true,
          transformer: this.convertToJSX,
          showCompiledJSTab: false,
          editorTabTitle: "Live HTML Editor"
        })
      );
    }
  });

  ReactDOM.render(React.createElement(HTMLtoJSXComponent, null), document.getElementById('jsxCompiler'));
})();