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

var React;
var ReactNoop;

describe('ReactIncrementalErrorHandling', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  it('propagates an error from a noop error boundary', () => {
    class NoopBoundary extends React.Component {
      unstable_handleError() {
        // Noop
      }
      render() {
        return this.props.children;
      }
    }

    function RenderError() {
      throw new Error('render error');
    }

    ReactNoop.render(
      <NoopBoundary>
        <RenderError />
      </NoopBoundary>
    );

    expect(ReactNoop.flush).toThrow('render error');
  });
});
