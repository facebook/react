describe('ReactFiberClassComponent', () => {
  let React;
  let ReactNoop;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should render a class if nominal', () => {
    class NominalComponent extends React.Component {
      render() {
        return <div />;
      }
    }

    ReactNoop.render(<NominalComponent />);
    ReactNoop.flush();
  });

  it('should return a meaningful warning when constructor is returned', () => {
    spyOn(console, 'error');
    class RenderTextInvalidConstructor extends React.Component {
      constructor(props) {
        super(props);
        return {something: false};
      }

      render() {
        return <div />;
      }
    }

    ReactNoop.render(<RenderTextInvalidConstructor />);
    ReactNoop.flushUnitsOfWork(2);

    const error = console.error.calls.mostRecent().args[0];

    expectDev(error).toBe(
      'Warning: RenderTextInvalidConstructor(...): No `render` method found on the returned component instance: ' +
      'did you accidentally return an object from the constructor?'
    );
  });

  it('should return error if render is not defined', () => {
    spyOn(console, 'error');
    class RenderTestUndefinedRender extends React.Component {}

    ReactNoop.render(<RenderTestUndefinedRender />);
    ReactNoop.flushUnitsOfWork(2);

    const error = console.error.calls.mostRecent().args[0];

    expectDev(error).toBe(
      'Warning: RenderTestUndefinedRender(...): No `render` method found on the returned ' +
        'component instance: you may have forgotten to define `render`.',
    );
  });
});
