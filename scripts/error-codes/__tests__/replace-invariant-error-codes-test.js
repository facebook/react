/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable quotes */
'use strict';

let babel = require('babel-core');
let devExpressionWithCodes = require('../replace-invariant-error-codes');

function transform(input) {
  return babel.transform(input, {
    plugins: [devExpressionWithCodes],
  }).code;
}

function compare(input, output) {
  var compiled = transform(input);
  expect(compiled).toEqual(output);
}

var oldEnv;

describe('error codes transform', () => {
  beforeEach(() => {
    oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = '';
  });

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
  });

  it('should replace simple invariant calls', () => {
    compare(
      "import invariant from 'shared/reactProdInvariant';\n" +
        "invariant(condition, 'Do not override existing functions.');",
      "import _prodInvariant from 'shared/reactProdInvariant';\n" +
        "import invariant from 'shared/reactProdInvariant';\n" +
        '!condition ? ' +
        '__DEV__ ? ' +
        "invariant(false, 'Do not override existing functions.') : " +
        `_prodInvariant('16') : void 0;`
    );
  });

  it('should only add `reactProdInvariant` once', () => {
    var expectedInvariantTransformResult =
      '!condition ? ' +
      '__DEV__ ? ' +
      "invariant(false, 'Do not override existing functions.') : " +
      `_prodInvariant('16') : void 0;`;

    compare(
      `import invariant from 'invariant';
invariant(condition, 'Do not override existing functions.');
invariant(condition, 'Do not override existing functions.');`,
      `import _prodInvariant from 'shared/reactProdInvariant';
import invariant from 'invariant';
${expectedInvariantTransformResult}
${expectedInvariantTransformResult}`
    );
  });

  it('should support invariant calls with args', () => {
    compare(
      "import invariant from 'shared/reactProdInvariant';\n" +
        "invariant(condition, 'Expected %s target to be an array; got %s', 'foo', 'bar');",
      "import _prodInvariant from 'shared/reactProdInvariant';\n" +
        "import invariant from 'shared/reactProdInvariant';\n" +
        '!condition ? ' +
        '__DEV__ ? ' +
        "invariant(false, 'Expected %s target to be an array; got %s', 'foo', 'bar') : " +
        `_prodInvariant('7', 'foo', 'bar') : void 0;`
    );
  });

  it('should support invariant calls with a concatenated template string and args', () => {
    compare(
      "import invariant from 'shared/reactProdInvariant';\n" +
        "invariant(condition, 'Expected a component class, ' + 'got %s.' + '%s', 'Foo', 'Bar');",
      "import _prodInvariant from 'shared/reactProdInvariant';\n" +
        "import invariant from 'shared/reactProdInvariant';\n" +
        '!condition ? ' +
        '__DEV__ ? ' +
        "invariant(false, 'Expected a component class, got %s.%s', 'Foo', 'Bar') : " +
        `_prodInvariant('18', 'Foo', 'Bar') : void 0;`
    );
  });

  it('should correctly transform invariants that are not in the error codes map', () => {
    compare(
      "import invariant from 'shared/reactProdInvariant';\n" +
        "invariant(condition, 'This is not a real error message.');",
      "import _prodInvariant from 'shared/reactProdInvariant';\n" +
        "import invariant from 'shared/reactProdInvariant';\n" +
        "!condition ? invariant(false, 'This is not a real error message.') : void 0;"
    );
  });
});
