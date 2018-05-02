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
let ReactFeatureFlags;
let ReactTestRenderer;

describe('ProfileRoot', () => {
  [true, false].forEach(enabled => {
    describe(`enableProfileModeMetrics feature flag ${
      enabled ? 'enabled' : 'disabled'
    }`, () => {
      beforeEach(() => {
        jest.resetModules();

        ReactFeatureFlags = require('shared/ReactFeatureFlags');
        ReactFeatureFlags.enableProfileModeMetrics = enabled;
        React = require('react');
        ReactTestRenderer = require('react-test-renderer');
      });

      // This will throw in production too,
      // But the test is only interested in verifying the DEV error message.
      if (__DEV__) {
        it('should warn about invalid mode', () => {
          expect(() => {
            ReactTestRenderer.create(<React.unstable_ProfileRoot />);
          }).toThrow(
            'ProfileMode must specify a label string and callback function',
          );
        });
      }

      it('should support an empty mode', () => {
        expect(
          ReactTestRenderer.create(
            <React.unstable_ProfileRoot label="label" callback={() => {}} />,
          ).toJSON(),
        ).toMatchSnapshot();
        expect(
          ReactTestRenderer.create(
            <div>
              <React.unstable_ProfileRoot label="label" callback={() => {}} />
            </div>,
          ).toJSON(),
        ).toMatchSnapshot();
      });

      it('should render children', () => {
        const ProfiledComponent = ({name}) => <span>{name}</span>;
        const renderer = ReactTestRenderer.create(
          <div>
            Hi
            <React.unstable_ProfileRoot label="label" callback={() => {}}>
              <span>there</span>
              <ProfiledComponent name="ProfileMode" />
            </React.unstable_ProfileRoot>
          </div>,
        );
        expect(renderer.toJSON()).toMatchSnapshot();
      });

      it('should support nested ProfileModes', () => {
        const ProfiledComponent = ({name}) => <div>Hi, {name}</div>;
        class ExtraProfiledComponent extends React.Component {
          render() {
            return <block>Hi, {this.props.name}</block>;
          }
        }
        const renderer = ReactTestRenderer.create(
          <React.unstable_ProfileRoot label="outer" callback={() => {}}>
            <ProfiledComponent name="Brian" />
            <React.unstable_ProfileRoot label="inner" callback={() => {}}>
              <ExtraProfiledComponent name="Brian" />
              <span>Now with extra profile strength!</span>
            </React.unstable_ProfileRoot>
          </React.unstable_ProfileRoot>,
        );
        expect(renderer.toJSON()).toMatchSnapshot();
      });
    });
  });

  describe('render timings', () => {
    let AdvanceTime;
    let advanceTimeBy;

    beforeEach(() => {
      jest.resetModules();

      let currentTime = 0;
      global.performance = {
        now: () => {
          return currentTime;
        },
      };
      advanceTimeBy = amount => {
        currentTime += amount;
      };

      // Import after polyfill
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.enableProfileModeMetrics = true;
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');

      AdvanceTime = class extends React.Component {
        static defaultProps = {
          shouldComponentUpdate: true,
        };
        shouldComponentUpdate(nextProps) {
          return nextProps.shouldComponentUpdate;
        }
        render() {
          // Simulate time passing when this component is rendered
          advanceTimeBy(this.props.amount || 10);
          return this.props.children || null;
        }
      };
    });
    afterEach(() => {
      delete global.performance;
    });

    it('logs render times for mount and update', () => {
      const callback = jest.fn();

      const Yield = ({value}) => {
        advanceTimeBy(10);
        renderer.unstable_yield(value);
        return null;
      };

      const renderer = ReactTestRenderer.create(
        <React.Fragment>
          <Yield value="first" />
          <React.unstable_ProfileRoot label="outer" callback={callback}>
            <AdvanceTime>
              <React.unstable_ProfileRoot label="middle" callback={callback}>
                <AdvanceTime>
                  <React.unstable_ProfileRoot label="inner" callback={callback}>
                    <AdvanceTime />
                  </React.unstable_ProfileRoot>
                </AdvanceTime>
              </React.unstable_ProfileRoot>
            </AdvanceTime>
          </React.unstable_ProfileRoot>
          <Yield value="last" />
        </React.Fragment>,
        {
          unstable_isAsync: true,
        },
      );

      // Times are logged until a render is committed.
      renderer.unstable_flushThrough(['first']);
      expect(callback).toHaveBeenCalledTimes(0);
      expect(renderer.unstable_flushAll()).toEqual(['last']);
      expect(callback).toHaveBeenCalledTimes(3);

      // Callbacks bubble (reverse order).
      let [innerCall, middleCall, outerCall] = callback.mock.calls;

      expect(innerCall).toHaveLength(4);
      expect(innerCall[0]).toBe('inner');
      expect(innerCall[1]).toBe('mount');
      expect(innerCall[2]).toBeGreaterThan(0); // "actual" time
      expect(innerCall[3]).toBeGreaterThan(0); // "base" time

      expect(middleCall).toHaveLength(4);
      expect(middleCall[0]).toBe('middle');
      expect(middleCall[1]).toBe('mount');
      expect(middleCall[2]).toBeGreaterThan(0); // "actual" time
      expect(middleCall[3]).toBeGreaterThan(0); // "base" time

      expect(outerCall).toHaveLength(4);
      expect(outerCall[0]).toBe('outer');
      expect(outerCall[1]).toBe('mount');
      expect(outerCall[2]).toBeGreaterThan(0); // "actual" time
      expect(outerCall[3]).toBeGreaterThan(0); // "base" time

      callback.mockReset();

      renderer.update(
        <React.Fragment>
          <Yield value="first" />
          <React.unstable_ProfileRoot label="outer" callback={callback}>
            <AdvanceTime>
              <React.unstable_ProfileRoot label="middle" callback={callback}>
                <AdvanceTime>
                  <React.unstable_ProfileRoot label="inner" callback={callback}>
                    <AdvanceTime />
                  </React.unstable_ProfileRoot>
                </AdvanceTime>
              </React.unstable_ProfileRoot>
            </AdvanceTime>
          </React.unstable_ProfileRoot>
          <Yield value="last" />
        </React.Fragment>,
      );

      // Times are logged until a render is committed.
      renderer.unstable_flushThrough(['first']);
      expect(callback).toHaveBeenCalledTimes(0);
      expect(renderer.unstable_flushAll()).toEqual(['last']);
      expect(callback).toHaveBeenCalledTimes(3);
      [innerCall, middleCall, outerCall] = callback.mock.calls;
      expect(innerCall).toHaveLength(4);
      expect(innerCall[0]).toBe('inner');
      expect(innerCall[1]).toBe('update');
      expect(middleCall[0]).toBe('middle');
      expect(middleCall[1]).toBe('update');
      expect(outerCall[0]).toBe('outer');
      expect(outerCall[1]).toBe('update');
    });

    it('does not log update times for descendents of sCU false', () => {
      const callback = jest.fn();

      let instance;
      class Updater extends React.Component {
        state = {};
        render() {
          instance = this;
          return this.props.children;
        }
      }

      class Pure extends React.PureComponent {
        render() {
          return this.props.children;
        }
      }

      const renderer = ReactTestRenderer.create(
        <React.unstable_ProfileRoot label="outer" callback={callback}>
          <Updater>
            <React.unstable_ProfileRoot label="middle" callback={callback}>
              <Pure>
                <React.unstable_ProfileRoot label="inner" callback={callback}>
                  <div />
                </React.unstable_ProfileRoot>
              </Pure>
            </React.unstable_ProfileRoot>
          </Updater>
        </React.unstable_ProfileRoot>,
      );

      // All profile callbacks are called for initial render
      expect(callback).toHaveBeenCalledTimes(3);

      callback.mockReset();

      renderer.unstable_flushSync(() => {
        instance.setState({
          count: 1,
        });
      });

      // Only call profile updates for paths that have re-rendered
      // Since "inner" is beneath a pure compoent, it isn't called
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('middle');
      expect(callback.mock.calls[1][0]).toBe('outer');
    });

    it('includes render times of nested ProfileRoots in their parent times', () => {
      const callback = jest.fn();

      ReactTestRenderer.create(
        <React.unstable_ProfileRoot label="parent" callback={callback}>
          <AdvanceTime>
            <React.unstable_ProfileRoot label="child" callback={callback}>
              <AdvanceTime />
            </React.unstable_ProfileRoot>
          </AdvanceTime>
        </React.unstable_ProfileRoot>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      // Callbacks bubble (reverse order).
      const [childCall, parentCall] = callback.mock.calls;
      expect(childCall[0]).toBe('child');
      expect(parentCall[0]).toBe('parent');

      // Parent times should include child times
      expect(parentCall[2]).toBeGreaterThan(childCall[2]); // "actual" time
      expect(parentCall[3]).toBeGreaterThan(childCall[3]); // "base" time
    });

    it('record a decrease in "actual" time and no change in "base" time when sCU memoization is used', () => {
      const callback = jest.fn();

      const renderer = ReactTestRenderer.create(
        <React.unstable_ProfileRoot label="test" callback={callback}>
          <AdvanceTime>
            <AdvanceTime shouldComponentUpdate={false}>
              <AdvanceTime />
            </AdvanceTime>
          </AdvanceTime>
        </React.unstable_ProfileRoot>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      renderer.update(
        <React.unstable_ProfileRoot label="test" callback={callback}>
          <AdvanceTime>
            <AdvanceTime shouldComponentUpdate={false}>
              <AdvanceTime />
            </AdvanceTime>
          </AdvanceTime>
        </React.unstable_ProfileRoot>,
      );

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][2]).toBeLessThan(callback.mock.calls[0][2]); // "actual" time
      expect(callback.mock.calls[0][3]).toEqual(callback.mock.calls[0][3]); // "base" time
    });

    // TODO (bvaughn) Revisit these tests and maybe rewrite them better
    describe('interrupted render timings', () => {
      it('should resume/accumulate "actual" time after a scheduling interruptions', () => {
        const callback = jest.fn();

        const Yield = ({value}) => {
          advanceTimeBy(10);
          renderer.unstable_yield(value);
          return null;
        };

        // Render partially, but run out of time before completing.
        const renderer = ReactTestRenderer.create(
          <React.unstable_ProfileRoot label="test" callback={callback}>
            <Yield value="first" />
            <Yield value="second" />
          </React.unstable_ProfileRoot>,
          {unstable_isAsync: true},
        );
        renderer.unstable_flushThrough(['first']);

        expect(callback).toHaveBeenCalledTimes(0);

        // Resume/restart render.
        renderer.unstable_flushAll();

        // Verify that logged times include both durations above.
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][2]).toBeGreaterThan(4); // "actual" time
        expect(callback.mock.calls[0][3]).toBeGreaterThan(4); // "base" time
      });

      it('should resume/accumulate "actual" time after a higher priority interruption', () => {
        const callback = jest.fn();

        const Yield = ({value}) => {
          advanceTimeBy(10);
          renderer.unstable_yield(value);
          return null;
        };

        // Render partially, but don't complete
        const renderer = ReactTestRenderer.create(
          <React.unstable_ProfileRoot label="test" callback={callback}>
            <Yield value="first" />
            <Yield value="second" />
          </React.unstable_ProfileRoot>,
          {unstable_isAsync: true},
        );
        renderer.unstable_flushThrough(['first']);

        expect(callback).toHaveBeenCalledTimes(0);

        // Interrupt with higher priority work
        renderer.unstable_flushSync(() => {
          renderer.update(
            <React.unstable_ProfileRoot label="test" callback={callback}>
              <Yield value="third" />
            </React.unstable_ProfileRoot>,
          );
        });

        // Verify that logged times include both durations above.
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][2]).toBeGreaterThan(3); // "actual" time
        expect(callback.mock.calls[0][3]).toBeGreaterThan(3); // "base" time
      });
    });
  });
});
