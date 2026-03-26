/**
 * @jest-environment jsdom
 */

'use strict';

let React;
let ReactDOMClient;
let act;
let useList;

describe('useList', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;

    useList = require('../useList').default;
  });

  function renderHook(hook) {
    const result = {current: null};
    let rerender;
    function TestComponent() {
      const [, setTick] = React.useState(0);
      rerender = () => setTick(t => t + 1);
      result.current = hook();
      return null;
    }
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    const {flushSync} = require('react-dom');
    flushSync(() => {
      root.render(React.createElement(TestComponent));
    });
    return {result, rerender};
  }

  it('should initialize with provided list', () => {
    const {result} = renderHook(() => useList([1, 2, 3]));
    expect(result.current.list).toEqual([1, 2, 3]);
  });

  it('should initialize with empty list if none provided', () => {
    const {result} = renderHook(() => useList());
    expect(result.current.list).toEqual([]);
  });

  it('should set list using setList', async () => {
    const {result, rerender} = renderHook(() => useList([1, 2, 3]));
    await act(() => {
      result.current.setList([4, 5, 6]);
      rerender();
    });
    expect(result.current.list).toEqual([4, 5, 6]);
  });

  it('should remove items using predicate', async () => {
    const {result, rerender} = renderHook(() => useList([1, 2, 3, 4]));
    expect(result.current).not.toBe(null);
    await act(() => {
      result.current.remove(x => x % 2 === 0);
      rerender();
    });
    expect(result.current.list).toEqual([1, 3]);
  });

  it('should not remove any items if predicate matches none', async () => {
    const {result, rerender} = renderHook(() => useList([1, 2, 3]));
    await act(() => {
      result.current.remove(x => x > 10);
      rerender();
    });
    expect(result.current.list).toEqual([1, 2, 3]);
  });

  it('should remove all items if predicate matches all', async () => {
    const {result, rerender} = renderHook(() => useList([1, 2, 3]));
    await act(() => {
      result.current.remove(() => true);
      rerender();
    });
    expect(result.current.list).toEqual([]);
  });

  it('should remove item at given index', async () => {
    const {result, rerender} = renderHook(() => useList(['a', 'b', 'c']));
    await act(() => {
      result.current.removeAt(1);
      rerender();
    });
    expect(result.current.list).toEqual(['a', 'c']);
  });

  it('should do nothing if removeAt is called with invalid index', async () => {
    const {result, rerender} = renderHook(() => useList(['a', 'b', 'c']));
    await act(() => {
      result.current.removeAt(10);
      rerender();
    });
    expect(result.current.list).toEqual(['a', 'b', 'c']);
  });

  it('should handle removeAt on empty list', async () => {
    const {result, rerender} = renderHook(() => useList([]));
    await act(() => {
      result.current.removeAt(0);
      rerender();
    });
    expect(result.current.list).toEqual([]);
  });
});
