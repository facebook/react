/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

describe('Store component filters', () => {
  let React;
  let ReactDOM;
  let TestUtils;
  let Types;
  let bridge: FrontendBridge;
  let store: Store;
  let utils;

  const act = (callback: Function) => {
    TestUtils.unstable_concurrentAct(() => {
      callback();
    });
    jest.runAllTimers(); // Flush Bridge operations
  };

  beforeEach(() => {
    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;
    store.componentFilters = [];
    store.recordChangeDescriptions = true;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
    Types = require('react-devtools-shared/src/types');
    utils = require('./utils');
  });

  it('should throw if filters are updated while profiling', () => {
    act(() => store.profilerStore.startProfiling());
    expect(() => (store.componentFilters = [])).toThrow(
      'Cannot modify filter preferences while profiling',
    );
  });

  it('should support filtering by element type', () => {
    class Root extends React.Component<{|children: React$Node|}> {
      render() {
        return <div>{this.props.children}</div>;
      }
    }
    const Component = () => <div>Hi</div>;

    act(() =>
      ReactDOM.render(
        <Root>
          <Component />
        </Root>,
        document.createElement('div'),
      ),
    );
    expect(store).toMatchSnapshot('1: mount');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeHostComponent),
        ]),
    );

    expect(store).toMatchSnapshot('2: hide host components');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass),
        ]),
    );

    expect(store).toMatchSnapshot('3: hide class components');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass),
          utils.createElementTypeFilter(Types.ElementTypeFunction),
        ]),
    );

    expect(store).toMatchSnapshot('4: hide class and function components');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass, false),
          utils.createElementTypeFilter(Types.ElementTypeFunction, false),
        ]),
    );

    expect(store).toMatchSnapshot('5: disable all filters');
  });

  it('should ignore invalid ElementTypeRoot filter', () => {
    const Root = () => <div>Hi</div>;

    act(() => ReactDOM.render(<Root />, document.createElement('div')));
    expect(store).toMatchSnapshot('1: mount');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeRoot),
        ]),
    );

    expect(store).toMatchSnapshot('2: add invalid filter');
  });

  it('should filter by display name', () => {
    const Text = ({label}) => label;
    const Foo = () => <Text label="foo" />;
    const Bar = () => <Text label="bar" />;
    const Baz = () => <Text label="baz" />;

    act(() =>
      ReactDOM.render(
        <React.Fragment>
          <Foo />
          <Bar />
          <Baz />
        </React.Fragment>,
        document.createElement('div'),
      ),
    );
    expect(store).toMatchSnapshot('1: mount');

    act(
      () => (store.componentFilters = [utils.createDisplayNameFilter('Foo')]),
    );
    expect(store).toMatchSnapshot('2: filter "Foo"');

    act(() => (store.componentFilters = [utils.createDisplayNameFilter('Ba')]));
    expect(store).toMatchSnapshot('3: filter "Ba"');

    act(
      () => (store.componentFilters = [utils.createDisplayNameFilter('B.z')]),
    );
    expect(store).toMatchSnapshot('4: filter "B.z"');
  });

  it('should filter by path', () => {
    const Component = () => <div>Hi</div>;

    act(() => ReactDOM.render(<Component />, document.createElement('div')));
    expect(store).toMatchSnapshot('1: mount');

    act(
      () =>
        (store.componentFilters = [
          utils.createLocationFilter(__filename.replace(__dirname, '')),
        ]),
    );

    expect(store).toMatchSnapshot(
      '2: hide all components declared within this test filed',
    );

    act(
      () =>
        (store.componentFilters = [
          utils.createLocationFilter('this:is:a:made:up:path'),
        ]),
    );

    expect(store).toMatchSnapshot('3: hide components in a made up fake path');
  });

  it('should filter HOCs', () => {
    const Component = () => <div>Hi</div>;
    const Foo = () => <Component />;
    Foo.displayName = 'Foo(Component)';
    const Bar = () => <Foo />;
    Bar.displayName = 'Bar(Foo(Component))';

    act(() => ReactDOM.render(<Bar />, document.createElement('div')));
    expect(store).toMatchSnapshot('1: mount');

    act(() => (store.componentFilters = [utils.createHOCFilter(true)]));

    expect(store).toMatchSnapshot('2: hide all HOCs');

    act(() => (store.componentFilters = [utils.createHOCFilter(false)]));

    expect(store).toMatchSnapshot('3: disable HOC filter');
  });

  it('should not send a bridge update if the set of enabled filters has not changed', () => {
    act(() => (store.componentFilters = [utils.createHOCFilter(true)]));

    bridge.addListener('updateComponentFilters', componentFilters => {
      throw Error('Unexpected component update');
    });

    act(
      () =>
        (store.componentFilters = [
          utils.createHOCFilter(false),
          utils.createHOCFilter(true),
        ]),
    );
    act(
      () =>
        (store.componentFilters = [
          utils.createHOCFilter(true),
          utils.createLocationFilter('abc', false),
        ]),
    );
    act(
      () =>
        (store.componentFilters = [
          utils.createHOCFilter(true),
          utils.createElementTypeFilter(Types.ElementTypeHostComponent, false),
        ]),
    );
  });

  it('should not break when Suspense nodes are filtered from the tree', () => {
    const promise = new Promise(() => {});

    const Loading = () => <div>Loading...</div>;

    const Component = ({shouldSuspend}) => {
      if (shouldSuspend) {
        throw promise;
      }
      return null;
    };

    const Wrapper = ({shouldSuspend}) => (
      <React.Suspense fallback={<Loading />}>
        <Component shouldSuspend={shouldSuspend} />
      </React.Suspense>
    );

    store.componentFilters = [
      utils.createElementTypeFilter(Types.ElementTypeSuspense),
    ];

    const container = document.createElement('div');
    act(() => ReactDOM.render(<Wrapper shouldSuspend={true} />, container));
    expect(store).toMatchSnapshot('1: suspended');

    act(() => ReactDOM.render(<Wrapper shouldSuspend={false} />, container));
    expect(store).toMatchSnapshot('2: resolved');

    act(() => ReactDOM.render(<Wrapper shouldSuspend={true} />, container));
    expect(store).toMatchSnapshot('3: suspended');
  });
});
