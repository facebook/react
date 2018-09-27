const jestDiff = require('jest-diff');

describe('ErrorBoundaryReconciliation', () => {
  let BrokenRender;
  let DidCatchErrorBoundary;
  let GetDerivedErrorBoundary;
  let React;
  let ReactFeatureFlags;
  let ReactTestRenderer;
  let span;

  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactTestRenderer = require('react-test-renderer');
    React = require('react');

    DidCatchErrorBoundary = class extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        this.setState({error});
      }
      render() {
        return this.state.error
          ? React.createElement(this.props.fallbackTagName, {
              prop: 'ErrorBoundary',
            })
          : this.props.children;
      }
    };

    GetDerivedErrorBoundary = class extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        return this.state.error
          ? React.createElement(this.props.fallbackTagName, {
              prop: 'ErrorBoundary',
            })
          : this.props.children;
      }
    };

    const InvalidType = undefined;
    BrokenRender = ({fail}) =>
      fail ? <InvalidType /> : <span prop="BrokenRender" />;

    function toHaveRenderedChildren(renderer, children) {
      let actual, expected;
      try {
        actual = renderer.toJSON();
        expected = ReactTestRenderer.create(children).toJSON();
        expect(actual).toEqual(expected);
      } catch (error) {
        return {
          message: () => jestDiff(expected, actual),
          pass: false,
        };
      }
      return {pass: true};
    }
    expect.extend({toHaveRenderedChildren});
  });

  [true, false].forEach(isConcurrent => {
    function sharedTest(ErrorBoundary, fallbackTagName) {
      const renderer = ReactTestRenderer.create(
        <ErrorBoundary fallbackTagName={fallbackTagName}>
          <BrokenRender fail={false} />
        </ErrorBoundary>,
        {unstable_isConcurrent: isConcurrent},
      );
      if (isConcurrent) {
        renderer.unstable_flushAll();
      }
      expect(renderer).toHaveRenderedChildren(<span prop="BrokenRender" />);

      expect(() => {
        renderer.update(
          <ErrorBoundary fallbackTagName={fallbackTagName}>
            <BrokenRender fail={true} />
          </ErrorBoundary>,
        );
        if (isConcurrent) {
          renderer.unstable_flushAll();
        }
      }).toWarnDev(isConcurrent ? ['invalid', 'invalid'] : ['invalid']);
      expect(renderer).toHaveRenderedChildren(
        React.createElement(fallbackTagName, {prop: 'ErrorBoundary'}),
      );
    }

    describe(isConcurrent ? 'concurrent' : 'sync', () => {
      it('componentDidCatch can recover by rendering an element of the same type', () =>
        sharedTest(DidCatchErrorBoundary, 'span'));

      it('componentDidCatch can recover by rendering an element of a different type', () =>
        sharedTest(DidCatchErrorBoundary, 'div'));

      it('getDerivedStateFromError can recover by rendering an element of the same type', () =>
        sharedTest(GetDerivedErrorBoundary, 'span'));

      it('getDerivedStateFromError can recover by rendering an element of a different type', () =>
        sharedTest(GetDerivedErrorBoundary, 'div'));
    });
  });
});
