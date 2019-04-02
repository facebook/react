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
let ReactNoop;
let Scheduler;
let ReactFeatureFlags;
let EventComponent;
let ReactTestRenderer;
let ReactDOM;
let ReactSymbols;
let ReactEvents;
let TouchHitTarget;

const noOpResponder = {
  targetEventTypes: [],
  handleEvent() {},
};

function createReactEventComponent() {
  return {
    $$typeof: ReactSymbols.REACT_EVENT_COMPONENT_TYPE,
    props: null,
    responder: noOpResponder,
  };
}

function init() {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableEventAPI = true;
  React = require('react');
  Scheduler = require('scheduler');
  ReactSymbols = require('shared/ReactSymbols');
  ReactEvents = require('react-events');
}

function initNoopRenderer() {
  init();
  ReactNoop = require('react-noop-renderer');
}

function initTestRenderer() {
  init();
  ReactTestRenderer = require('react-test-renderer');
}

function initReactDOM() {
  init();
  ReactDOM = require('react-dom');
}

describe('TouchHitTarget', () => {
  describe('NoopRenderer', () => {
    beforeEach(() => {
      initNoopRenderer();
      EventComponent = createReactEventComponent();
      TouchHitTarget = ReactEvents.TouchHitTarget;
    });

    it('should not warn when a TouchHitTarget is used correctly', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <TouchHitTarget />
          </div>
        </EventComponent>
      );

      ReactNoop.render(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(<div />);
    });

    it('should warn when a TouchHitTarget has children', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <TouchHitTarget>
              <span>Child 1</span>
            </TouchHitTarget>
          </div>
        </EventComponent>
      );

      expect(() => {
        ReactNoop.render(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> must not have any children.',
      );

      const Test2 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget>Child 1</TouchHitTarget>
          </div>
        </EventComponent>
      );

      expect(() => {
        ReactNoop.render(<Test2 />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> must not have any children.',
      );

      // Should render without warnings
      const Test3 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget />
          </div>
        </EventComponent>
      );

      ReactNoop.render(<Test3 />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(<div />);
    });

    it('should warn when a TouchHitTarget is a direct child of an event component', () => {
      const Test = () => (
        <EventComponent>
          <TouchHitTarget />
        </EventComponent>
      );

      expect(() => {
        ReactNoop.render(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> cannot not be a direct child of an event component. ' +
          'Ensure <TouchHitTarget> is a direct child of a DOM element.',
      );
    });
  });

  describe('TestRenderer', () => {
    beforeEach(() => {
      initTestRenderer();
      EventComponent = createReactEventComponent();
      TouchHitTarget = ReactEvents.TouchHitTarget;
    });

    it('should not warn when a TouchHitTarget is used correctly', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <TouchHitTarget />
          </div>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Test />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<div />);
    });

    it('should warn when a TouchHitTarget has children', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <TouchHitTarget>
              <span>Child 1</span>
            </TouchHitTarget>
          </div>
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> must not have any children.',
      );

      const Test2 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget>Child 1</TouchHitTarget>
          </div>
        </EventComponent>
      );

      expect(() => {
        root.update(<Test2 />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> must not have any children.',
      );

      // Should render without warnings
      const Test3 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget />
          </div>
        </EventComponent>
      );

      root.update(<Test3 />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<div />);
    });

    it('should warn when a TouchHitTarget is a direct child of an event component', () => {
      const Test = () => (
        <EventComponent>
          <TouchHitTarget />
        </EventComponent>
      );

      const root = ReactTestRenderer.create(null);
      expect(() => {
        root.update(<Test />);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> cannot not be a direct child of an event component. ' +
          'Ensure <TouchHitTarget> is a direct child of a DOM element.',
      );
    });
  });

  describe('ReactDOM', () => {
    beforeEach(() => {
      initReactDOM();
      EventComponent = createReactEventComponent();
      TouchHitTarget = ReactEvents.TouchHitTarget;
    });

    it('should not warn when a TouchHitTarget is used correctly', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <TouchHitTarget />
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div></div>');
    });

    it('should warn when a TouchHitTarget has children', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <TouchHitTarget>
              <span>Child 1</span>
            </TouchHitTarget>
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      expect(() => {
        ReactDOM.render(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> must not have any children.',
      );

      const Test2 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget>Child 1</TouchHitTarget>
          </div>
        </EventComponent>
      );

      expect(() => {
        ReactDOM.render(<Test2 />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> must not have any children.',
      );

      // Should render without warnings
      const Test3 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget />
          </div>
        </EventComponent>
      );

      ReactDOM.render(<Test3 />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div></div>');
    });

    it('should warn when a TouchHitTarget is a direct child of an event component', () => {
      const Test = () => (
        <EventComponent>
          <TouchHitTarget />
        </EventComponent>
      );

      const container = document.createElement('div');
      expect(() => {
        ReactDOM.render(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: validateDOMNesting: <TouchHitTarget> cannot not be a direct child of an event component. ' +
          'Ensure <TouchHitTarget> is a direct child of a DOM element.',
      );
    });
  });
});
