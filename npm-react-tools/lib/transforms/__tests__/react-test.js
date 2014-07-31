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
 * @emails jeffmo@fb.com
 */
"use strict";

require('mock-modules').autoMockOff();

describe('react jsx', function() {
  var transformAll = require('../../syntax.js').transformAll;
  var xjs = require('../xjs.js');

  // Add <font-face> to list of known tags to ensure that when we test support
  // for hyphentated known tags, it's there.
  // TODO: remove this when/if <font-face> is supported out of the box.
  xjs.knownTags['font-face'] = true;

  var transform = function(code, options, excludes) {
    return transformAll(
      code,
      options,
      (excludes || []).concat(['sourcemeta', 'allocate'])
    );
  };

  // These are placeholder variables in scope that we can use to assert that a
  // specific variable reference was passed, rather than an object clone of it.
  var x = 123456;
  var y = 789012;
  var z = 345678;

  var HEADER =
    '/**\n' +
    ' * @jsx React.DOM\n' +
    ' */\n';

  var expectObjectAssign = function(code) {
    var Component = jest.genMockFunction();
    var Child = jest.genMockFunction();
    var objectAssignMock = jest.genMockFunction();
    Object.assign = objectAssignMock;
    eval(transform(HEADER + code).code);
    return expect(objectAssignMock);
  }

  it('should convert simple tags', function() {
    var code = [
      '/**@jsx React.DOM*/',
      'var x = <div></div>;'
    ].join('\n');
    var result = [
      '/**@jsx React.DOM*/',
      'var x = React.DOM.div(null);'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should convert simple text', function() {
    var code = [
      '/**@jsx React.DOM*/\n' +
      'var x = <div>text</div>;'
    ].join('\n');
    var result = [
      '/**@jsx React.DOM*/',
      'var x = React.DOM.div(null, "text");'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should have correct comma in nested children', function() {
    var code = [
      '/**@jsx React.DOM*/',
      'var x = <div>',
      '  <div><br /></div>',
      '  <Component>{foo}<br />{bar}</Component>',
      '  <br />',
      '</div>;'
    ].join('\n');
    var result = [
      '/**@jsx React.DOM*/',
      'var x = React.DOM.div(null, ',
      '  React.DOM.div(null, React.DOM.br(null)), ',
      '  Component(null, foo, React.DOM.br(null), bar), ',
      '  React.DOM.br(null)',
      ');'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should avoid wrapping in extra parens if not needed', function() {
    // Try with a single composite child, wrapped in a div.
    var code = [
      '/**@jsx React.DOM*/',
      'var x = <div>',
      '  <Component />',
      '</div>;'
    ].join('\n');
    var result = [
      '/**@jsx React.DOM*/',
      'var x = React.DOM.div(null, ',
      '  Component(null)',
      ');'
    ].join('\n');

    expect(transform(code).code).toEqual(result);

    // Try with a single interpolated child, wrapped in a div.
    code = [
      '/**@jsx React.DOM*/',
      'var x = <div>',
      '  {this.props.children}',
      '</div>;'
    ].join('\n');
    result = [
      '/**@jsx React.DOM*/',
      'var x = React.DOM.div(null, ',
      '  this.props.children',
      ');'
    ].join('\n');
    expect(transform(code).code).toEqual(result);

    // Try with a single interpolated child, wrapped in a composite.
    code = [
      '/**@jsx React.DOM*/',
      'var x = <Composite>',
      '  {this.props.children}',
      '</Composite>;'
    ].join('\n');
    result = [
      '/**@jsx React.DOM*/',
      'var x = Composite(null, ',
      '  this.props.children',
      ');'
    ].join('\n');
    expect(transform(code).code).toEqual(result);

    // Try with a single composite child, wrapped in a composite.
    code = [
      '/**@jsx React.DOM*/',
      'var x = <Composite>',
      '  <Composite2 />',
      '</Composite>;'
    ].join('\n');
    result = [
      '/**@jsx React.DOM*/',
      'var x = Composite(null, ',
      '  Composite2(null)',
      ');'
    ].join('\n');
    expect(transform(code).code).toEqual(result);
  });

  it('should insert commas after expressions before whitespace', function() {
    var code = [
      '/**@jsx React.DOM*/',
      'var x =',
      '  <div',
      '    attr1={',
      '      "foo" + "bar"',
      '    }',
      '    attr2={',
      '      "foo" + "bar" +',
      '      ',
      '      "baz" + "bug"',
      '    }',
      '    attr3={',
      '      "foo" + "bar" +',
      '      "baz" + "bug"',
      '      // Extra line here.',
      '    }',
      '    attr4="baz">',
      '  </div>;'
    ].join('\n');
    var result = [
      '/**@jsx React.DOM*/',
      'var x =',
      '  React.DOM.div({',
      '    attr1: ',
      '      "foo" + "bar", ',
      '    ',
      '    attr2: ',
      '      "foo" + "bar" +',
      '      ',
      '      "baz" + "bug", ',
      '    ',
      '    attr3: ',
      '      "foo" + "bar" +',
      '      "baz" + "bug", ',
      '      // Extra line here.',
      '    ',
      '    attr4: "baz"}',
      '  );'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should properly handle comments adjacent to children', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'var x = (',
      '  <div>',
      '    {/* A comment at the beginning */}',
      '    {/* A second comment at the beginning */}',
      '    <span>',
      '      {/* A nested comment */}',
      '    </span>',
      '    {/* A sandwiched comment */}',
      '    <br />',
      '    {/* A comment at the end */}',
      '    {/* A second comment at the end */}',
      '  </div>',
      ');'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'var x = (',
      '  React.DOM.div(null, ',
      '    /* A comment at the beginning */',
      '    /* A second comment at the beginning */',
      '    React.DOM.span(null',
      '      /* A nested comment */',
      '    ), ',
      '    /* A sandwiched comment */',
      '    React.DOM.br(null)',
      '    /* A comment at the end */',
      '    /* A second comment at the end */',
      '  )',
      ');'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should properly handle comments between props', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'var x = (',
      '  <div',
      '    /* a multi-line',
      '       comment */',
      '    attr1="foo">',
      '    <span // a double-slash comment',
      '      attr2="bar"',
      '    />',
      '  </div>',
      ');'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'var x = (',
      '  React.DOM.div({',
      '    /* a multi-line',
      '       comment */',
      '    attr1: "foo"}, ',
      '    React.DOM.span({// a double-slash comment',
      '      attr2: "bar"}',
      '    )',
      '  )',
      ');'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should not strip tags with a single child of &nbsp;', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<div>&nbsp;</div>;'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'React.DOM.div(null, "\u00A0");'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should not strip &nbsp; even coupled with other whitespace', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<div>&nbsp; </div>;'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'React.DOM.div(null, "\u00A0 ");'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should handle hasOwnProperty correctly', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<hasOwnProperty>testing</hasOwnProperty>;'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'hasOwnProperty(null, "testing");'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should allow constructor as prop', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<Component constructor="foo" />;'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'Component({constructor: "foo"});'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should allow JS namespacing', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<Namespace.Component />;'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'Namespace.Component(null);'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should allow deeper JS namespacing', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<Namespace.DeepNamespace.Component />;'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'Namespace.DeepNamespace.Component(null);'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('should disallow XML namespacing', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<Namespace:Component />;'
    ].join('\n');

    expect(() => transform(code)).toThrow();
  });

  it('wraps props in Object.assign for spread attributes', function() {
    var code = HEADER +
      '<Component { ... x } y\n={2 } z />';
    var result = HEADER +
      'Component(Object.assign({},   x , {y: \n2, z: true}))';

    expect(transform(code).code).toBe(result);
  });

  it('should transform known hyphenated tags', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<font-face />;'
    ].join('\n');
    var result = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      'React.DOM[\'font-face\'](null);'
    ].join('\n');

    expect(transform(code).code).toBe(result);
  });

  it('does not call Object.assign when there are no spreads', function() {
    expectObjectAssign(
      '<Component x={y} />'
    ).not.toBeCalled();
  });

  it('should throw for unknown hyphenated tags', function() {
    var code = [
      '/**',
      ' * @jsx React.DOM',
      ' */',
      '<x-component />;'
    ].join('\n');

    expect(() => transform(code)).toThrow();
  });

  it('calls assign with a new target object for spreads', function() {
    expectObjectAssign(
      '<Component {...x} />'
    ).toBeCalledWith({}, x);
  });

  it('calls assign with an empty object when the spread is first', function() {
    expectObjectAssign(
      '<Component { ...x } y={2} />'
    ).toBeCalledWith({}, x, { y: 2 });
  });

  it('coalesces consecutive properties into a single object', function() {
    expectObjectAssign(
      '<Component { ... x } y={2} z />'
    ).toBeCalledWith({}, x, { y: 2, z: true });
  });

  it('avoids an unnecessary empty object when spread is not first', function() {
    expectObjectAssign(
      '<Component x={1} {...y} />'
    ).toBeCalledWith({x: 1}, y);
  });

  it('passes the same value multiple times to Object.assign', function() {
    expectObjectAssign(
      '<Component x={1} y="2" {...z} {...z}><Child /></Component>'
    ).toBeCalledWith({x: 1, y: "2"}, z, z);
  });

  it('evaluates sequences before passing them to Object.assign', function() {
    expectObjectAssign(
      '<Component x="1" {...(z = { y: 2 }, z)} z={3}>Text</Component>'
    ).toBeCalledWith({x: "1"}, { y: 2 }, {z: 3});
  });

});
