let ReactFeatureFlags;
let React;
let ReactDOM;
let ReactTestUtils;

describe('ReactTestUtils', () => {
  beforeEach(() => {
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableHooks = true;
    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('flushEffects should run any enqueued effects', () => {
    let effected = false;
    let layoutEffected = false;
    function App() {
      React.useEffect(() => {
        effected = true;
      });
      React.useLayoutEffect(() => {
        layoutEffected = true;
      });
      return null;
    }
    ReactTestUtils.renderIntoDocument(<App />);
    // effects haven't fired yet
    expect(effected).toBe(false);
    // layout effects have, however
    expect(layoutEffected).toBe(true);

    ReactTestUtils.flushEffects();
    // effects have now fired
    expect(effected).toBe(true);
  });
});
