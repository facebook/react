/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let PropTypes;
let React;
let ReactDOMServer;

describe('ReactContext', () => {
  beforeEach(() => {
    jest.resetModules();
    PropTypes = require('prop-types');
    React = require('react');
    ReactDOMServer = require('react-dom/server');
  });

  it('ignores displayName on the context type', () => {
    const Context = React.createContext(null);
    Context.displayName = 'MyContextType';
    function Validator() {
      return null;
    }
    Validator.propTypes = {dontPassToSeeErrorStack: PropTypes.bool.isRequired};

    expect(() => {
      ReactDOMServer.renderToStaticMarkup(
        <Context.Provider>
          <Context.Consumer>{() => <Validator />}</Context.Consumer>
        </Context.Provider>,
      );
    }).toErrorDev(
      'Warning: Failed prop type: The prop `dontPassToSeeErrorStack` is marked as required in `Validator`, but its value is `undefined`.\n' +
        '    in Validator (at **)\n' +
        '    in Context.Consumer (at **)\n' +
        '    in Context.Provider (at **)',
    );
  });
});
