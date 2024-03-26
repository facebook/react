let ReactDOM = require('react-dom');

describe('ReactDOMRoot', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    ReactDOM = require('react-dom');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // @gate !disableLegacyMode
  test('deprecation warning for ReactDOM.render', () => {
    spyOnDev(console, 'error');

    ReactDOM.render('Hi', container);
    expect(container.textContent).toEqual('Hi');
    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.mock.calls[0][0]).toContain(
        'ReactDOM.render has not been supported since React 18',
      );
    }
  });

  // @gate !disableLegacyMode
  test('deprecation warning for ReactDOM.hydrate', () => {
    spyOnDev(console, 'error');

    container.innerHTML = 'Hi';
    ReactDOM.hydrate('Hi', container);
    expect(container.textContent).toEqual('Hi');
    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error.mock.calls[0][0]).toContain(
        'ReactDOM.hydrate has not been supported since React 18',
      );
    }
  });
});
