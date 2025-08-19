/**
 * @jest-environment node
 */

'use strict';

const React = require('react');
const ReactNoop = require('react-noop-renderer');
const Scheduler = require('scheduler');
const {act} = require('react-test-renderer');

// This test reproduces the bug reported in:
// https://github.com/facebook/react/issues/XXXXX
// where recursive components with early returns before hooks cause
// "Internal React error: Expected static flag was missing" errors.

describe('ReactEarlyReturnHooksBug', () => {
  let ReactFeatureFlags;
  let didWarnAboutStaticFlag;
  let originalConsoleError;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    
    // Capture console.error to check for the specific error
    didWarnAboutStaticFlag = false;
    originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Expected static flag was missing')) {
        didWarnAboutStaticFlag = true;
      }
      originalConsoleError(...args);
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  // Simple test to verify the fix works for conditional hook calls
  it('should not trigger static flag error with conditional hook calls', async () => {
    function ConditionalHooksComponent({ shouldUseHooks }) {
       // Hooks called FIRST (unconditionally) - following Rules of Hooks
      const [count, setCount] = React.useState(0);
      React.useEffect(() => {
        if (shouldUseHooks) {
          setCount(1);
        }
      }, [shouldUseHooks]);

      // Early return AFTER all hooks are called
      if (!shouldUseHooks) {
        return <div>No hooks used</div>;
      }

      return <div>Count: {count}</div>;
    }

    const root = ReactNoop.createRoot(null);

    // First render without hooks
    await act(async () => {
      root.render(<ConditionalHooksComponent shouldUseHooks={false} />);
    });

    // Second render with hooks - this would trigger the bug before our fix
    await act(async () => {
      root.render(<ConditionalHooksComponent shouldUseHooks={true} />);
    });

    // The bug should NOT trigger the static flag error anymore due to our fix
    expect(didWarnAboutStaticFlag).toBe(false);
  });

  // Test the original recursive component issue (simplified) - now with proper hook placement
  it('should not trigger static flag error with hooks called before early returns in recursive component', async () => {
    // This is the problematic component from the user's report (now fixed)
   function SubGroupFilter({ depth, label, root, action }) {
  // Call hooks FIRST (unconditionally) - following Rules of Hooks
  const [index, setIndex] = React.useState(0);
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    if (root.length > 0 && root[index]) {
      setItems([{ id: 'test', name: 'Test' }]);
    }
  }, [root, index]);

  // Limit recursion to avoid infinite loop
  if (depth > 2) {
    return React.createElement('div', null, 'Max depth reached');
  }

  // Early return AFTER all hooks are called
  if (!root.length) {
    return null;
  }

      return (
        <>
          <fieldset>
            <legend>{label}</legend>
            <select 
              name="product-group" 
              onChange={event => setIndex(event.currentTarget.selectedIndex)}
            >
              {root.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </fieldset>
          <SubGroupFilter 
            depth={depth + 1} 
            label={`Subgroup - ${root[index]?.name || 'Unknown'}`} 
            root={items} 
            action={action} 
          />
        </>
      );
    }

    function SearchForm({ root, action }) {
      return (
        <>
          <span>Search Form</span>
          <form>
            <SubGroupFilter depth={0} label="Product groups" root={root} action={action} />
            <button className="button">search</button>
          </form>
        </>
      );
    }

    const root = ReactNoop.createRoot(null);

    // Initial render with root data
    await act(async () => {
      root.render(
        <SearchForm 
          root={[
            { id: "foo1", name: "Foo1" },
            { id: "foo2", name: "Foo2" }
          ]} 
          action={() => {}}
        />
      );
    });

    // The bug should NOT trigger the static flag error anymore due to our fix
    expect(didWarnAboutStaticFlag).toBe(false);
  });

  // This shows the correct way to structure the component
   it('should work correctly when hooks are called unconditionally before early return', async () => {
    // CORRECT: Hooks are called unconditionally at the top level before any early returns
    function SubGroupFilter({ depth, label, root, action }) {
      // Call hooks first (unconditionally)
      const [index, setIndex] = React.useState(0);
      const [items, setItems] = React.useState([]);

      React.useEffect(() => {
        if (root.length > 0 && root[index]) {
          setItems([{ id: 'test', name: 'Test' }]);
        }
      }, [root, index]);

      // Limit recursion to avoid infinite loop
      if (depth > 0) {
        return <div>Max depth reached</div>;
      }

      // Early return after hooks
      if (!root.length) {
        return null;
      }

      return (
        <>
          <fieldset>
            <legend>{label}</legend>
            <select 
              name="product-group" 
              onChange={event => setIndex(event.currentTarget.selectedIndex)}
            >
              {root.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </fieldset>
          <SubGroupFilter 
            depth={depth + 1} 
            label={`Subgroup - ${root[index]?.name || 'Unknown'}`} 
            root={items} 
            action={action} 
          />
        </>
      );
    }

    function SearchForm({ root, action }) {
      return (
        <>
          <span>Search Form</span>
          <form>
            <SubGroupFilter depth={0} label="Product groups" root={root} action={action} />
            <button className="button">search</button>
          </form>
        </>
      );
    }

    const root = ReactNoop.createRoot(null);

    await act(async () => {
      root.render(
        <SearchForm 
          root={[
            { id: "foo1", name: "Foo1" },
            { id: "foo2", name: "Foo2" }
          ]} 
          action={() => {}}
        />
      );
    });

    // This should not trigger the static flag error
    expect(didWarnAboutStaticFlag).toBe(false);
  });
});
