/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactDOM;
let useKeyboard;

import {createEventTarget} from '../testing-library';

function initializeModules(hasPointerEvents) {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFlareAPI = true;
  React = require('react');
  ReactDOM = require('react-dom');
  useKeyboard = require('react-events/keyboard').useKeyboard;
}

describe('Keyboard event responder', () => {
  let container;

  beforeEach(() => {
    initializeModules();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.render(null, container);
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onKeyDown, onKeyUp, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      onKeyUp = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({
          disabled: true,
          onKeyDown,
          onKeyUp,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('prevents custom events being dispatched', () => {
      const target = createEventTarget(ref.current);
      target.keydown();
      target.keyup();
      expect(onKeyDown).not.toBeCalled();
      expect(onKeyUp).not.toBeCalled();
    });
  });

  describe('onKeyDown', () => {
    let onKeyDown, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({
          onKeyDown,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "keydown" event', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Q'});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({key: 'Q', type: 'keydown'}),
      );
    });
  });

  describe('preventKeys', () => {
    it('onKeyDown is default prevented', () => {
      const onKeyDown = jest.fn();
      const ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({
          onKeyDown,
          preventKeys: ['Tab'],
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      const preventDefault = jest.fn();
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).toBeCalled();
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Tab',
          type: 'keydown',
          defaultPrevented: true,
        }),
      );
    });

    it('onKeyDown is default prevented (falsy modifier keys)', () => {
      let onKeyDown = jest.fn();
      let ref = React.createRef();
      let Component = () => {
        const listener = useKeyboard({
          onKeyDown,
          preventKeys: [['Tab', {metaKey: false}]],
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      let preventDefault = jest.fn();
      let target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, metaKey: true});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).not.toBeCalled();
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Tab',
          type: 'keydown',
          defaultPrevented: false,
        }),
      );

      onKeyDown = jest.fn();
      ref = React.createRef();
      Component = () => {
        const listener = useKeyboard({
          onKeyDown,
          preventKeys: [['Tab', {metaKey: true}]],
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      preventDefault = jest.fn();
      target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, metaKey: false});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).not.toBeCalled();
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Tab',
          type: 'keydown',
          defaultPrevented: false,
        }),
      );
    });

    it('onKeyDown is default prevented (truthy modifier keys)', () => {
      let onKeyDown = jest.fn();
      let ref = React.createRef();
      let Component = () => {
        const listener = useKeyboard({
          onKeyDown,
          preventKeys: [['Tab', {metaKey: true}]],
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      let preventDefault = jest.fn();
      let target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, metaKey: true});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).toBeCalled();
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Tab',
          type: 'keydown',
          defaultPrevented: true,
        }),
      );

      onKeyDown = jest.fn();
      ref = React.createRef();
      Component = () => {
        const listener = useKeyboard({
          onKeyDown,
          preventKeys: [['Tab', {metaKey: false}]],
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);

      preventDefault = jest.fn();
      target = createEventTarget(ref.current);
      target.keydown({key: 'Tab', preventDefault, metaKey: false});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(preventDefault).toBeCalled();
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Tab',
          type: 'keydown',
          defaultPrevented: true,
        }),
      );
    });
  });

  describe('onKeyUp', () => {
    let onKeyDown, onKeyUp, ref;

    beforeEach(() => {
      onKeyDown = jest.fn();
      onKeyUp = jest.fn();
      ref = React.createRef();
      const Component = () => {
        const listener = useKeyboard({
          onKeyDown,
          onKeyUp,
        });
        return <div ref={ref} listeners={listener} />;
      };
      ReactDOM.render(<Component />, container);
    });

    it('is called after "keydown" event', () => {
      const target = createEventTarget(ref.current);
      target.keydown({key: 'Q'});
      target.keyup({key: 'Q'});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({key: 'Q', type: 'keydown'}),
      );
      expect(onKeyUp).toHaveBeenCalledTimes(1);
      expect(onKeyUp).toHaveBeenCalledWith(
        expect.objectContaining({key: 'Q', type: 'keyup'}),
      );
    });
  });
});
