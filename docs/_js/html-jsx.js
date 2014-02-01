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
 * @jsx React.DOM
 */

/**
 * This is a web interface for the HTML to JSX converter contained in 
 * `html-jsx-lib.js`.
 */
;(function() {

var HELLO_COMPONENT = "\
<!-- Hello world -->\n\
<div class=\"awesome\" style=\"border: 1px solid red\">\n\
  <label for=\"name\">Enter your name: </label>\n\
  <input type=\"text\" id=\"name\" />\n\
</div>\n\
<p>Enter your HTML here</p>\
";

  var HTMLtoJSXComponent = React.createClass({
    getInitialState: function() {
      return {
        outputClassName: 'NewComponent',
        createClass: true
      };
    },
    onReactClassNameChange: function(evt) {
      this.setState({ outputClassName: evt.target.value });
    },
    onCreateClassChange: function(evt) {
      this.setState({ createClass: evt.target.checked });
    },
    setInput: function(input) {
      this.setState({ input: input });
      this.convertToJsx();
    },
    convertToJSX: function(input) {
      var converter = new HTMLtoJSX({
        outputClassName: this.state.outputClassName,
        createClass: this.state.createClass
      });
      return converter.convert(input);
    },
  	render: function() {
      return (
        <div>
          <div id="options">
            <label>
              <input
                type="checkbox"
                checked={this.state.createClass}
                onChange={this.onCreateClassChange} />
                Create class
            </label>
            <label style={{display: this.state.createClass ? '' : 'none'}}>
              ·
              Class name:
              <input
                type="text"
                value={this.state.outputClassName}
                onChange={this.onReactClassNameChange} />
            </label>
          </div>
          <ReactPlayground
            codeText={HELLO_COMPONENT}
            renderCode={true}
            transformer={this.convertToJSX}
            />
        </div>
      );
    }
  });

  React.renderComponent(<HTMLtoJSXComponent />, document.getElementById('jsxCompiler'));
}());