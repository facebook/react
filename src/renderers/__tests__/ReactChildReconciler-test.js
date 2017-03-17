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

// NOTE: We're explicitly not using JSX here. This is intended to test
// the current stack addendum without having source location added by babel.

'use strict';

var React;
var ReactTestUtils;

describe('ReactChildReconciler', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestUtils = require('ReactTestUtils');
  });

  function createIterable(array) {
    return {
      '@@iterator': function() {
        var i = 0;
        return {
          next() {
            const next = {
              value: i < array.length ? array[i] : undefined,
              done: i === array.length,
            };
            i++;
            return next;
          },
        };
      },
    };
  }

  it('warns for duplicated array keys', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{[<div key="1" />, <div key="1" />]}</div>;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Child keys must be unique; when two children share a key, only the first child will be used.',
    );
  });

  it('warns for duplicated array keys with component stack info', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{[<div key="1" />, <div key="1" />]}</div>;
      }
    }

    class Parent extends React.Component {
      render() {
        return React.cloneElement(this.props.child);
      }
    }

    class GrandParent extends React.Component {
      render() {
        return <Parent child={<Component />} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(
      normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
    ).toContain(
      'Encountered two children with the same key, `1`. ' +
        'Child keys must be unique; when two children share a key, ' +
        'only the first child will be used.\n' +
        '    in div (at **)\n' +
        '    in Component (at **)\n' +
        '    in Parent (at **)\n' +
        '    in GrandParent (at **)',
    );
  });

  it('warns for duplicated iterable keys', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{createIterable([<div key="1" />, <div key="1" />])}</div>;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Child keys must be unique; when two children share a key, only the first child will be used.',
    );
  });

  it('warns for duplicated iterable keys with component stack info', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{createIterable([<div key="1" />, <div key="1" />])}</div>;
      }
    }

    class Parent extends React.Component {
      render() {
        return React.cloneElement(this.props.child);
      }
    }

    class GrandParent extends React.Component {
      render() {
        return <Parent child={<Component />} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(
      normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
    ).toContain(
      'Encountered two children with the same key, `1`. ' +
        'Child keys must be unique; when two children share a key, ' +
        'only the first child will be used.\n' +
        '    in div (at **)\n' +
        '    in Component (at **)\n' +
        '    in Parent (at **)\n' +
        '    in GrandParent (at **)',
    );
  });
});
