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

describe('ReactProfileMode', () => {
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
            ReactTestRenderer.create(<React.ProfileMode />);
          }).toThrow(
            'ProfileMode must specify a label string and callback function',
          );
        });
      }

      it('should support an empty mode', () => {
        expect(
          ReactTestRenderer.create(
            <React.ProfileMode label="label" callback={() => {}} />,
          ).toJSON(),
        ).toMatchSnapshot();
        expect(
          ReactTestRenderer.create(
            <div>
              <React.ProfileMode label="label" callback={() => {}} />
            </div>,
          ).toJSON(),
        ).toMatchSnapshot();
      });

      it('should render children', () => {
        const ProfiledComponent = ({name}) => <span>{name}</span>;
        const renderer = ReactTestRenderer.create(
          <div>
            Hi
            <React.ProfileMode label="label" callback={() => {}}>
              <span>there</span>
              <ProfiledComponent name="ProfileMode" />
            </React.ProfileMode>
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
          <React.ProfileMode label="outer" callback={() => {}}>
            <ProfiledComponent name="Brian" />
            <React.ProfileMode label="inner" callback={() => {}}>
              <ExtraProfiledComponent name="Brian" />
              <span>Now with extra profile strength!</span>
            </React.ProfileMode>
          </React.ProfileMode>,
        );
        expect(renderer.toJSON()).toMatchSnapshot();
      });
    });
  });

  describe('render timings', () => {
    beforeEach(() => {
      jest.resetModules();

      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.enableProfileModeMetrics = true;
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
    });

    it('logs render times for mount and update', () => {
      const callback = jest.fn();

      class ClassComponent extends React.Component {
        render() {
          return null;
        }
      }

      const FunctionalComponent = props => props.children;
      const Yield = ({value}) => {
        renderer.unstable_yield(value);
        return null;
      };

      const renderer = ReactTestRenderer.create(
        <React.Fragment>
          <Yield value="first" />
          <React.ProfileMode label="outer" callback={callback}>
            <div>
              <React.ProfileMode label="middle" callback={callback}>
                <FunctionalComponent>
                  <React.ProfileMode label="inner" callback={callback}>
                    <ClassComponent />
                  </React.ProfileMode>
                </FunctionalComponent>
              </React.ProfileMode>
            </div>
          </React.ProfileMode>
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
      const [innerCall, middleCall, outerCall] = callback.mock.calls;

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
          <React.ProfileMode label="outer" callback={callback}>
            <div>
              <React.ProfileMode label="middle" callback={callback}>
                <FunctionalComponent>
                  <React.ProfileMode label="inner" callback={callback}>
                    <ClassComponent />
                  </React.ProfileMode>
                </FunctionalComponent>
              </React.ProfileMode>
            </div>
          </React.ProfileMode>
          <Yield value="last" />
        </React.Fragment>,
      );

      // Times are logged until a render is committed.
      renderer.unstable_flushThrough(['first']);
      expect(callback).toHaveBeenCalledTimes(0);
      expect(renderer.unstable_flushAll()).toEqual(['last']);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('does not log times if sCU prevents a re-render', () => {
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
        <React.ProfileMode label="outer" callback={callback}>
          <div>
            <React.ProfileMode label="middle" callback={callback}>
              <Updater>
                <React.ProfileMode label="inner" callback={callback}>
                  <Pure>
                    <React.ProfileMode label="blocked" callback={callback}>
                      <div />
                    </React.ProfileMode>
                  </Pure>
                </React.ProfileMode>
              </Updater>
            </React.ProfileMode>
          </div>
        </React.ProfileMode>,
      );

      // All profile callbacks are called for initial render
      expect(callback).toHaveBeenCalledTimes(4);

      callback.mockReset();

      renderer.unstable_flushSync(() => {
        instance.setState({
          count: 1,
        });
      });

      // Only call profile updates for paths that have re-rendered
      // Since "blocked" is beneath a pure compoent, it isn't called
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback.mock.calls[0][0]).toBe('inner');
      expect(callback.mock.calls[1][0]).toBe('middle');
      expect(callback.mock.calls[2][0]).toBe('outer');
    });

    // TODO (bvaughn) Test updates only callback for committed modes

    // TODO (bvaughn) Test nested updates work (outer update is greater value than inner)
  });
});
