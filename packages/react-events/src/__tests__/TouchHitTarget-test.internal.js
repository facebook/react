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
let ReactDOMServer;
let ReactSymbols;
let ReactEvents;
let TouchHitTarget;

const noOpResponder = {
  targetEventTypes: [],
  onEvent() {},
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

function initReactDOMServer() {
  init();
  ReactDOMServer = require('react-dom/server');
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
      }).toWarnDev('Warning: Event targets should not have children.');

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
      }).toWarnDev('Warning: Event targets should not have children.');

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
      }).toWarnDev('Warning: Event targets should not have children.');

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
      }).toWarnDev('Warning: Event targets should not have children.');

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
      }).toWarnDev('Warning: Event targets should not have children.');

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
      }).toWarnDev('Warning: Event targets should not have children.');

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

    it('should render a conditional TouchHitTarget correctly (false -> true)', () => {
      let cond = false;

      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            {cond ? null : (
              <TouchHitTarget top={10} left={10} right={10} bottom={10} />
            )}
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><div style="position: absolute; z-index: -1; bottom: -10px; ' +
          'left: -10px; right: -10px; top: -10px;"></div></div>',
      );

      cond = true;
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"></div>',
      );
    });

    it('should render a conditional TouchHitTarget correctly (true -> false)', () => {
      let cond = true;

      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            {cond ? null : (
              <TouchHitTarget top={10} left={10} right={10} bottom={10} />
            )}
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"></div>',
      );

      cond = false;
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><div style="position: absolute; z-index: -1; bottom: -10px; ' +
          'left: -10px; right: -10px; top: -10px;"></div></div>',
      );
    });

    it('should render a conditional TouchHitTarget hit slop correctly (false -> true)', () => {
      let cond = false;

      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            {cond ? (
              <TouchHitTarget />
            ) : (
              <TouchHitTarget top={10} left={10} right={10} bottom={10} />
            )}
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><div style="position: absolute; z-index: -1; bottom: -10px; ' +
          'left: -10px; right: -10px; top: -10px;"></div></div>',
      );

      cond = true;
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"></div>',
      );
    });

    it('should render a conditional TouchHitTarget hit slop correctly (true -> false)', () => {
      let cond = true;

      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            <span>Random span 1</span>
            {cond ? (
              <TouchHitTarget />
            ) : (
              <TouchHitTarget top={10} left={10} right={10} bottom={10} />
            )}
            <span>Random span 2</span>
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><span>Random span 1</span><span>Random span 2</span></div>',
      );

      cond = false;
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><span>Random span 1</span>' +
          '<div style="position: absolute; z-index: -1; bottom: -10px; ' +
          'left: -10px; right: -10px; top: -10px;"></div><span>Random span 2</span></div>',
      );
    });

    it('should update TouchHitTarget hit slop values correctly (false -> true)', () => {
      let cond = false;

      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            <span>Random span 1</span>
            {cond ? (
              <TouchHitTarget top={10} left={null} right={10} bottom={10} />
            ) : (
              <TouchHitTarget
                top={undefined}
                left={20}
                right={null}
                bottom={0}
              />
            )}
            <span>Random span 2</span>
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><span>Random span 1</span>' +
          '<div style="position: absolute; z-index: -1; bottom: 0px; ' +
          'left: -20px; right: 0px; top: 0px;"></div><span>Random span 2</span></div>',
      );

      cond = true;
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><span>Random span 1</span>' +
          '<div style="position: absolute; z-index: -1; bottom: 0px; ' +
          'left: -20px; right: 0px; top: 0px;"></div><span>Random span 2</span></div>',
      );
    });

    it('should update TouchHitTarget hit slop values correctly (true -> false)', () => {
      let cond = true;

      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            <span>Random span 1</span>
            {cond ? (
              <TouchHitTarget top={10} left={null} right={10} bottom={10} />
            ) : (
              <TouchHitTarget
                top={undefined}
                left={20}
                right={null}
                bottom={0}
              />
            )}
            <span>Random span 2</span>
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><span>Random span 1</span>' +
          '<div style="position: absolute; z-index: -1; bottom: -10px; ' +
          'left: 0px; right: -10px; top: -10px;"></div><span>Random span 2</span></div>',
      );

      cond = false;
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0;"><span>Random span 1</span><div style="position: absolute; ' +
          'z-index: -1; bottom: -10px; left: 0px; right: -10px; top: -10px;">' +
          '</div><span>Random span 2</span></div>',
      );
    });

    it('should hydrate TouchHitTarget hit slop elements correcty', () => {
      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            <TouchHitTarget />
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      container.innerHTML = '<div style="position:relative;z-index:0"></div>';
      ReactDOM.hydrate(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position:relative;z-index:0"></div>',
      );

      const Test2 = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            <TouchHitTarget top={10} left={10} right={10} bottom={10} />
          </div>
        </EventComponent>
      );

      const container2 = document.createElement('div');
      container2.innerHTML =
        '<div style="position:relative;z-index:0"><div style="position:absolute;pointer-events:none;z-index:-1;' +
        'bottom:-10px;left:-10px;right:-10px;top:-10px"></div></div>';
      ReactDOM.hydrate(<Test2 />, container2);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container2.innerHTML).toBe(
        '<div style="position:relative;z-index:0"><div style="position: absolute; z-index: -1; ' +
          'bottom: -10px; left: -10px; right: -10px; top: -10px;"></div></div>',
      );
    });

    it('should hydrate TouchHitTarget hit slop elements correcty and patch them', () => {
      const Test = () => (
        <EventComponent>
          <div style={{position: 'relative', zIndex: 0}}>
            <TouchHitTarget top={10} left={10} right={10} bottom={10} />
          </div>
        </EventComponent>
      );

      const container = document.createElement('div');
      container.innerHTML =
        '<div style="position: relative; z-index: 0"></div>';
      expect(() => {
        ReactDOM.hydrate(<Test />, container);
        expect(Scheduler).toFlushWithoutYielding();
      }).toWarnDev(
        'Warning: Expected server HTML to contain a matching <div> in <div>.',
        {withoutStack: true},
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe(
        '<div style="position: relative; z-index: 0"><div style="position: absolute; z-index: -1; bottom: -10px; ' +
          'left: -10px; right: -10px; top: -10px;"></div></div>',
      );
    });
  });

  describe('ReactDOMServer', () => {
    beforeEach(() => {
      initReactDOMServer();
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

      const output = ReactDOMServer.renderToString(<Test />);
      expect(output).toBe('<div></div>');
    });

    it('should render a TouchHitTarget with hit slop values', () => {
      const Test = () => (
        <EventComponent>
          <div>
            <TouchHitTarget top={10} left={10} right={10} bottom={10} />
          </div>
        </EventComponent>
      );

      let output = ReactDOMServer.renderToString(<Test />);
      expect(output).toBe(
        '<div><div style="position:absolute;pointer-events:none;z-index:-1;' +
          'bottom:-10px;left:-10px;right:-10px;top:-10px"></div></div>',
      );

      const Test2 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget top={null} left={undefined} right={0} bottom={10} />
          </div>
        </EventComponent>
      );

      output = ReactDOMServer.renderToString(<Test2 />);
      expect(output).toBe(
        '<div><div style="position:absolute;pointer-events:none;z-index:-1;' +
          'bottom:-10px;left:0px;right:0x;top:0px"></div></div>',
      );

      const Test3 = () => (
        <EventComponent>
          <div>
            <TouchHitTarget top={1} left={2} right={3} bottom={4} />
          </div>
        </EventComponent>
      );

      output = ReactDOMServer.renderToString(<Test3 />);
      expect(output).toBe(
        '<div><div style="position:absolute;pointer-events:none;z-index:-1;' +
          'bottom:-4px;left:-2px;right:-3px;top:-1px"></div></div>',
      );
    });
  });
});
