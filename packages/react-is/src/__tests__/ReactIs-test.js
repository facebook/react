/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactIs;

describe('ReactIs', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactIs = require('react-is');
  });

  it('should return undefined for unknown/invalid types', () => {
    expect(ReactIs.typeOf('abc')).toBe(undefined);
    expect(ReactIs.typeOf(true)).toBe(undefined);
    expect(ReactIs.typeOf(123)).toBe(undefined);
    expect(ReactIs.typeOf({})).toBe(undefined);
    expect(ReactIs.typeOf(null)).toBe(undefined);
    expect(ReactIs.typeOf(undefined)).toBe(undefined);
  });

  it('should identify async mode', () => {
    expect(ReactIs.typeOf(<React.unstable_AsyncMode />)).toBe(
      ReactIs.AsyncMode,
    );
    expect(ReactIs.isAsyncMode(<React.unstable_AsyncMode />)).toBe(true);
    expect(ReactIs.isAsyncMode({type: ReactIs.AsyncMode})).toBe(false);
    expect(ReactIs.isAsyncMode(<React.StrictMode />)).toBe(false);
    expect(ReactIs.isAsyncMode(<div />)).toBe(false);
  });

  it('should identify context consumers', () => {
    const Context = React.createContext(false);
    expect(ReactIs.typeOf(<Context.Consumer />)).toBe(ReactIs.ContextConsumer);
    expect(ReactIs.isContextConsumer(<Context.Consumer />)).toBe(true);
    expect(ReactIs.isContextConsumer(<Context.Provider />)).toBe(false);
    expect(ReactIs.isContextConsumer(<div />)).toBe(false);
  });

  it('should identify context providers', () => {
    const Context = React.createContext(false);
    expect(ReactIs.typeOf(<Context.Provider />)).toBe(ReactIs.ContextProvider);
    expect(ReactIs.isContextProvider(<Context.Provider />)).toBe(true);
    expect(ReactIs.isContextProvider(<Context.Consumer />)).toBe(false);
    expect(ReactIs.isContextProvider(<div />)).toBe(false);
  });

  it('should identify elements', () => {
    expect(ReactIs.typeOf(<div />)).toBe(ReactIs.Element);
    expect(ReactIs.isElement(<div />)).toBe(true);
    expect(ReactIs.isElement('div')).toBe(false);
    expect(ReactIs.isElement(true)).toBe(false);
    expect(ReactIs.isElement(123)).toBe(false);
    expect(ReactIs.isElement(null)).toBe(false);
    expect(ReactIs.isElement(undefined)).toBe(false);
    expect(ReactIs.isElement({})).toBe(false);

    // It should also identify more specific types as elements
    const Context = React.createContext(false);
    expect(ReactIs.isElement(<Context.Provider />)).toBe(true);
    expect(ReactIs.isElement(<Context.Consumer />)).toBe(true);
    expect(ReactIs.isElement(<React.Fragment />)).toBe(true);
    expect(ReactIs.isElement(<React.unstable_AsyncMode />)).toBe(true);
    expect(ReactIs.isElement(<React.StrictMode />)).toBe(true);
  });

  it('should identify fragments', () => {
    expect(ReactIs.typeOf(<React.Fragment />)).toBe(ReactIs.Fragment);
    expect(ReactIs.isFragment(<React.Fragment />)).toBe(true);
    expect(ReactIs.isFragment({type: ReactIs.Fragment})).toBe(false);
    expect(ReactIs.isFragment('React.Fragment')).toBe(false);
    expect(ReactIs.isFragment(<div />)).toBe(false);
    expect(ReactIs.isFragment([])).toBe(false);
  });

  it('should identify portals', () => {
    const div = document.createElement('div');
    const portal = ReactDOM.createPortal(<div />, div);
    expect(ReactIs.typeOf(portal)).toBe(ReactIs.Portal);
    expect(ReactIs.isPortal(portal)).toBe(true);
    expect(ReactIs.isPortal(div)).toBe(false);
  });

  it('should identify strict mode', () => {
    expect(ReactIs.typeOf(<React.StrictMode />)).toBe(ReactIs.StrictMode);
    expect(ReactIs.isStrictMode(<React.StrictMode />)).toBe(true);
    expect(ReactIs.isStrictMode({type: ReactIs.StrictMode})).toBe(false);
    expect(ReactIs.isStrictMode(<React.unstable_AsyncMode />)).toBe(false);
    expect(ReactIs.isStrictMode(<div />)).toBe(false);
  });
});
