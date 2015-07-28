/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */
'use strict';

require('mock-modules').autoMockOff();

var transformAll = require('../../syntax.js').transformAll;

var transform = function(code, options, excludes) {
  if (!options) {
    options = {};
  }
  options.sourceType = 'module';
  return transformAll(
    code,
    options,
    (excludes || []).concat(['sourcemeta', 'allocate'])
  );
};


describe('react jsx module', function() {

  it('should transpile to createClass and export module as default',
    function() {
    var code = [
      '<!doctype jsx>',
      '<ReactClass name="Whateva" export="default">',
      '  <div>X</div>',
      '</ReactClass>'
    ].join('\n');

    var expected = [
      '"use strict";',
      'var Whateva = React.createClass({',
      '  displayName: "Whateva",',
      '  render: function render() {',
      '    return React.createElement("div", null, "X");',
      '  }',
      '});',
      'export default Whateva;'
    ].join('\n');

    expect(transform(code).code).toEqual(expected);
  });

  it('should transpile to createClass and export modules', function() {
    var code = [
      '<!doctype jsx>',
      '<ReactClass name="Whateva">',
      '  <div>X</div>',
      '</ReactClass>',
      '<ReactClass name="Whateva2">',
      '  <div>Y</div>',
      '</ReactClass>'
    ].join('\n');

    var expected = [
      '"use strict";',
      'var Whateva = React.createClass({',
      '  displayName: "Whateva",',
      '  render: function render() {',
      '    return React.createElement("div", null, "X");',
      '  }',
      '});',
      'export Whateva;',
      'var Whateva2 = React.createClass({',
      '  displayName: "Whateva2",',
      '  render: function render() {',
      '    return React.createElement("div", null, "Y");',
      '  }',
      '});',
      'export Whateva2;'
    ].join('\n');

    expect(transform(code).code).toEqual(expected);
  });

  it('should transpile react methods', function() {
    var code = [
      '<!doctype jsx>',
      '<ReactClass name="Whateva" export="default">',
      '  <div>X</div>',
      '  <script>',
      '    function getInitialState(){',
      '      return {y: 1};',
      '    }',
      '    function getDefaultProps(){',
      '      return {p: false};',
      '    }',
      '    function propTypes(){',
      '      return {p: React.PropTypes.bool};',
      '    }',
      '    function componentWillMount(){',
      '      this.mounting = true;',
      '    }',
      '    function componentDidMount(){',
      '      this.mounting = false;',
      '    }',
      '    function componentWillUnmount(){',
      '      delete this.unmounting;',
      '    }',
      '    function shouldComponentUpdate(nextProps, nextState){',
      '      return this.mounting === false;',
      '    }',
      '    function componentWillUpdate(nextProps, nextState){',
      '      return this.mounting === false;',
      '    }',
      '    function componentDidUpdate(prevProps, prevState){',
      '      return this.mounting === false;',
      '    }',
      '  </script>',
      '</ReactClass>'
    ].join('\n');

    var expected = [
      '"use strict";',
      'var Whateva = React.createClass({',
      '  displayName: "Whateva",',
      '  getInitialState: function getInitialState(){',
      '      return {y: 1};',
      '    }',
      '  getDefaultProps: function getDefaultProps(){',
      '      return {p: false};',
      '    }',
      '  propTypes: function propTypes(){',
      '      return {p: React.PropTypes.bool};',
      '    }',
      '  componentWillMount: function componentWillMount(){',
      '      this.mounting = true;',
      '    }',
      '  componentDidMount: function componentDidMount(){',
      '      this.mounting = false;',
      '    }',
      '  componentWillUnmount: function componentWillUnmount(){',
      '      delete this.unmounting;',
      '    }',
      '  shouldComponentUpdate: function ' +
        'shouldComponentUpdate(nextProps, nextState){',
      '      return this.mounting === false;',
      '    }',
      '  componentWillUpdate: function ' +
        'componentWillUpdate(nextProps, nextState){',
      '      return this.mounting === false;',
      '    }',
      '  componentDidUpdate: function ' +
        'componentDidUpdate(prevProps, prevState){',
      '      return this.mounting === false;',
      '    }',
      '  render: function render() {',
      '    return React.createElement("div", null, "X");',
      '  }',
      '});',
      'export default Whateva;'
    ].join('\n');

    expect(transform(code).code).toEqual(expected);
  });

//  it('should transpile scripts', function() {
//    var code = [
//      '<!doctype jsx>',
//      '<ReactClass name="Whateva" export="default">',
//      '  <div onClick={this.clickHandler} onMouseOver={mouseOverHandler}>
//      '     X',
//      '  </div>',
//      '  <script>',
//      '    var x=1;',
//      '    function getInitialState(){',
//      '      return {y: 1};',
//      '    }',
//      '    function clickHandler(){',
//      '      x++',
//      '      this.setState({y: x});',
//      '    }',
//      '    function mouseOverHandler(){',
//      '      x--',
//      '      this.setState({y: x});',
//      '    }',
//      '  </script>',
//      '</ReactClass>'
//    ].join('\n');
//
//    var expected = [
//      '"use strict";',
//      'var x=1;',
//      'function mouseOverHandler(){',
//      '  x--',
//      '  this.setState({y: x});',
//      '}',
//      'var Whateva = React.createClass({',
//      '  displayName: "Whateva",',
//      '  getInitialState: function(){',
//      '    return {y: 1};',
//      '  }',
//      '  render: function() {',
//      '    return React.createElement("div", null, "X");',
//      '  }',
//      '});',
//      'export default Whateva;'
//    ].join('\n');
//
//    expect(transform(code).code).toEqual(expected);
//  });
//
  // TODO mix-ins, static methods
});
