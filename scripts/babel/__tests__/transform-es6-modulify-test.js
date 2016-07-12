/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* eslint-disable quotes */
'use strict';

const babel = require('babel-core');
const babelEs6ModulifyPlugin = require('../transform-es6-modulify');

function transform(input) {
  return babel.transform(input, {
    plugins: [babelEs6ModulifyPlugin],
  }).code;
}

function compare(input, output) {
  var compiled = transform(input);
  expect(compiled).toEqual(output);
}

describe('transform-es6-modulify', () => {
  // var ... = require('...'); -> import ... from '...';
  it('should rewrite `require` to `import`', () => {
    compare(
      "var React = require('react');",

      "import React from 'react';"
    );

    compare(
      "var React = require('react');",

      "import React from 'react';"
    );
  });

  it('rewrites multi requires inserted by Babel', () => {
    compare(
`var _prodInvariant = require('./reactProdInvariant'),
    _assign = require('object-assign');`,

`import _prodInvariant from './reactProdInvariant';
import _assign from 'object-assign';`
    );
  });

  it('should throw when the RHS is a MemberExpression', () => {
    expect(() => {
      transform("var createElement = require('react').createElement;");
    }).toThrowError(/Invalid require: `require\(\)` must be in the form of `var ... = require\(...\);`/);
  });

  it('should throw for non-top level requires', () => {
    expect(() => {
      transform(
`
if (3 > 2) {
  var React = require('react');
}
`
      );
    }).toThrowError(/Invalid require: `require\(\)` must be on the top-level/);
  });

  it('should throw when `require()` is not in a VariableDeclarator', () => {
    expect(() => {
      transform(
`
var React;
React = require('react');
`);
    }).toThrowError(/Invalid require: `require\(\)` must be directly in a variable declarator/);

    expect(() => {
      transform("var React = require('react') || null;");
    }).toThrowError(/Invalid require: `require\(\)` must be directly in a variable declarator/);

    expect(() => {
      transform("require('inject-something');");
    }).toThrowError(/Invalid require: `require\(\)` must be directly in a variable declarator/);
  });

  it('should throw when the parameter passed to `require()` is not a literal string', () => {
    expect(() => {
      transform("var React = require('re' + 'act');");
    }).toThrowError(/Invalid require: `require\(\)` must take a literal string as argument/);
  });

  it('should throw when it sees destructuring', () => {
    expect(() => {
      transform("var {createElement} = require('react');");
    }).toThrowError(/Invalid require: left hand side of `require\(\)` must be an identifier/);
  });


  // module.exports = ...; -> exports default ...;
  it('should rewrite `module.exports` to `export default`', () => {
    compare(
      "module.exports = {};",

      "export default {};"
    );

    compare(
      "module.exports = React;",

      "export default React;"
    );

    compare(
      "module.exports = 3 > 2 ? React : ReactDOM;",

      "export default 3 > 2 ? React : ReactDOM;"
    );

    compare(
      "module.exports = class Foo {};",

      "export default (class Foo {});"
    );

    compare(
      "module.exports = class {};",

      "export default (class {});"
    );

    compare(
      "module.exports = function foo() {};",

      "export default (function foo() {});"
    );

    compare(
      "module.exports = function() {};",

      "export default (function () {});"
    );
  });

  it('should throw when it sees module.exports.foo = ...', () => {
    expect(() => {
      transform("module.exports.createElement = createElement;");
    }).toThrowError(/Invalid exports: `module.exports` must be in the form of `module.exports = ...;`/);
  });

  it('should throw when it sees module.exports on the right hand side', () => {
    expect(() => {
      transform('foo = module.exports;');
    }).toThrowError(/Invalid exports: `module.exports` must be in the form of `module.exports = ...;`/);

    expect(() => {
      transform(`var foo = module.exports;`);
    }).toThrowError(/Invalid exports: `module.exports` must be in the form of `module.exports = ...;`/);
  });

  it('should throw for non-top level exports', () => {
    expect(() => {
      transform(
`
if (3 > 2) {
  module.exports = React;
}
`
      );
    }).toThrowError(/Invalid exports: `module.exports = ...` must be on the top-level/);
  });

  it('should throw when there are more than one module.exports', () => {
    expect(() => {
      transform(
`
module.exports = React;
module.exports = ReactDOM;
`
      );
    }).toThrowError(/Invalid exports: `module.exports = ...` can only happen once in a module/);
  });
});
