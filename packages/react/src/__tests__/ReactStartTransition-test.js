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
let ReactTestRenderer;
let act;
let useState;
let useTransition;

const SUSPICIOUS_NUMBER_OF_FIBERS_UPDATED = 10;

describe('ReactStartTransition', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    act = require('jest-react').act;
    useState = React.useState;
    useTransition = React.useTransition;
  });

  if (
    require('shared/ReactFeatureFlags').warnOnSubscriptionInsideStartTransition
  ) {
    it('Warns if a suspicious number of fibers are updated inside startTransition', () => {
      const subs = new Set();
      const useUserSpaceSubscription = () => {
        const setState = useState(0)[1];
        subs.add(setState);
      };

      let triggerHookTransition;

      const Component = ({level}) => {
        useUserSpaceSubscription();
        if (level === 0) {
          triggerHookTransition = useTransition()[1];
        }
        if (level < SUSPICIOUS_NUMBER_OF_FIBERS_UPDATED) {
          return <Component level={level + 1} />;
        }
        return null;
      };

      act(() => {
        ReactTestRenderer.create(<Component level={0} />, {
          unstable_isConcurrent: true,
        });
      });

      expect(() => {
        act(() => {
          React.startTransition(() => {
            subs.forEach(setState => {
              setState(state => state + 1);
            });
          });
        });
      }).toWarnDev(
        [
          'Detected a suspicious number of fibers being updated ' +
            `(${SUSPICIOUS_NUMBER_OF_FIBERS_UPDATED}) inside startTransition. ` +
            'If this is due to a user-space defined subscription please re-write ' +
            'it to use React provided hooks. Otherwise concurrent mode guarantees ' +
            'are off the table.',
        ],
        {withoutStack: true},
      );

      expect(() => {
        act(() => {
          triggerHookTransition(() => {
            subs.forEach(setState => {
              setState(state => state + 1);
            });
          });
        });
      }).toWarnDev(
        [
          'Detected a suspicious number of fibers being updated ' +
            `(${SUSPICIOUS_NUMBER_OF_FIBERS_UPDATED}) inside startTransition. ` +
            'If this is due to a user-space defined subscription please re-write ' +
            'it to use React provided hooks. Otherwise concurrent mode guarantees ' +
            'are off the table.',
        ],
        {withoutStack: true},
      );
    });
  } else {
    it('Dummy test so that jest doesnt complain about lack of tests in this file when the warning feature flag is off', () => {});
  }
});
