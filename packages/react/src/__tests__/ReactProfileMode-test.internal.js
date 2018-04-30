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

      it('should support an empty mode', () => {
        expect(
          ReactTestRenderer.create(<React.ProfileMode />).toJSON(),
        ).toMatchSnapshot();
        expect(
          ReactTestRenderer.create(
            <div>
              <React.ProfileMode />
            </div>,
          ).toJSON(),
        ).toMatchSnapshot();
      });

      it('should render children', () => {
        const ProfiledComponent = ({name}) => <span>{name}</span>;
        const renderer = ReactTestRenderer.create(
          <div>
            Hi
            <React.ProfileMode>
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
          <React.ProfileMode>
            <ProfiledComponent name="Brian" />
            <React.ProfileMode>
              <ExtraProfiledComponent name="Brian" />
              <span>Now with extra profile strength!</span>
            </React.ProfileMode>
          </React.ProfileMode>,
        );
        expect(renderer.toJSON()).toMatchSnapshot();
      });
    });
  });
});
