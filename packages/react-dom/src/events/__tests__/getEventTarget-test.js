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

  describe('event on HTMLElement', () => {
      it('has expected target', () => {
        let actual;

        class Comp extends React.Component {
          render() {
            return <div onClick={e => actual = e.target}><span /></div>;
          }
        }

        ReactDOM.render(<Comp />, container);

        const div = container.firstChild;
        const span = div.firstChild;

        div.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }));

        expect(actual).toBe(div);

        span.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }));

        expect(actual).toBe(span);
      });
  });
});
