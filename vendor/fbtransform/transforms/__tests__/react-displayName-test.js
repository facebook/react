/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails jeffmo@fb.com
 */
"use strict";

require('mock-modules').autoMockOff();

var transformAll = require('../../syntax.js').transformAll;

function transform(source) {
  return transformAll(source, {}, ['allocate']);
}

describe('react displayName jsx', function() {

  it('should only inject displayName if missing', function() {
    var code = [
      '/** @jsx React.DOM */',
      '"use strict";',
      'var Whateva = React.createClass({',
      '  displayName: \'Whateva\',',
      '  render: function() {',
      '    return <div className=\'whateva\'>...whateva.</div>;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      '/** @jsx React.DOM */',
      '"use strict";',
      'var Whateva = React.createClass({',
      '  displayName: \'Whateva\',',
      '  render: function() {',
      '    return React.DOM.div({className: "whateva"}, "...whateva.");',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in simple assignment', () => {
    var code = [
      '/** @jsx React.DOM */',
      'var Component = React.createClass({',
      '  render: function() {',
      '    return <div/>;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      '/** @jsx React.DOM */',
      'var Component = React.createClass({displayName: \'Component\',',
      '  render: function() {',
      '    return React.DOM.div(null);',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in simple assignment without var', () => {
    var code = [
      '/** @jsx React.DOM */',
      'var Component;',
      'Component = React.createClass({',
      '  render: function() {',
      '    return <div/>;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      '/** @jsx React.DOM */',
      'var Component;',
      'Component = React.createClass({displayName: \'Component\',',
      '  render: function() {',
      '    return React.DOM.div(null);',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in property assignment', () => {
    var code = [
      '/** @jsx React.DOM */',
      'exports.Component = React.createClass({',
      '  render: function() {',
      '    return <div/>;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      '/** @jsx React.DOM */',
      'exports.Component = React.createClass({displayName: \'Component\',',
      '  render: function() {',
      '    return React.DOM.div(null);',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in object declaration', () => {
    var code = [
      '/** @jsx React.DOM */',
      'exports = {',
      '  Component: React.createClass({',
      '    render: function() {',
      '      return <div/>;',
      '    }',
      '  })',
      '};'
    ].join('\n');

    var result = [
      '/** @jsx React.DOM */',
      'exports = {',
      '  Component: React.createClass({displayName: \'Component\',',
      '    render: function() {',
      '      return React.DOM.div(null);',
      '    }',
      '  })',
      '};'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

});
