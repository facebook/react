/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('getEventTarget', () => {
  let container;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');

    // The container has to be attached for events to fire.
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('when event is implemented in a browser', () => {
    describe('when event is dispatch', () => {
      it('get target element object', () => {
        let target = null;
        class Comp extends React.Component {
          render() {
            return <input onKeyDown={e => (target = e.target)} />;
          }
        }

        ReactDOM.render(<Comp />, container);

        const nativeEvent = new KeyboardEvent('keydown', {
          key: 'f',
          bubbles: true,
          cancelable: true,
        });

        expect(target).toEqual(null);
        container.firstChild.dispatchEvent(nativeEvent);
        expect(target).toEqual(container.firstChild);
      });
    });
  });
});
