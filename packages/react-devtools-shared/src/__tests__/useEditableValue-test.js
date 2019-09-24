/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('useEditableValue', () => {
  let act;
  let React;
  let ReactDOM;
  let useEditableValue;

  beforeEach(() => {
    const utils = require('./utils');
    act = utils.act;

    React = require('react');
    ReactDOM = require('react-dom');

    useEditableValue = require('../devtools/views/hooks').useEditableValue;
  });

  it('should override editable state when external props are updated', () => {
    let state;

    function Example({value}) {
      const tuple = useEditableValue(value);
      state = tuple[0];
      return null;
    }

    const container = document.createElement('div');
    ReactDOM.render(<Example value="foo" />, container);
    expect(state.editableValue).toEqual('"foo"');
    expect(state.externalValue).toEqual('foo');
    expect(state.hasPendingChanges).toBe(false);

    // If there are NO pending changes,
    // an update to the external prop value should override the local/pending value.
    ReactDOM.render(<Example value="bar" />, container);
    expect(state.editableValue).toEqual('"bar"');
    expect(state.externalValue).toEqual('bar');
    expect(state.hasPendingChanges).toBe(false);
  });

  it('should not override editable state when external props are updated if there are pending changes', () => {
    let dispatch, state;

    function Example({value}) {
      const tuple = useEditableValue(value);
      state = tuple[0];
      dispatch = tuple[1];
      return null;
    }

    const container = document.createElement('div');
    ReactDOM.render(<Example value="foo" />, container);
    expect(state.editableValue).toEqual('"foo"');
    expect(state.externalValue).toEqual('foo');
    expect(state.hasPendingChanges).toBe(false);

    // Update (local) editable state.
    act(() =>
      dispatch({
        type: 'UPDATE',
        editableValue: 'not-foo',
        externalValue: 'foo',
      }),
    );
    expect(state.editableValue).toEqual('not-foo');
    expect(state.externalValue).toEqual('foo');
    expect(state.hasPendingChanges).toBe(true);

    // If there ARE pending changes,
    // an update to the external prop value should NOT override the local/pending value.
    ReactDOM.render(<Example value="bar" />, container);
    expect(state.editableValue).toEqual('not-foo');
    expect(state.externalValue).toEqual('bar');
    expect(state.hasPendingChanges).toBe(true);
  });
});
