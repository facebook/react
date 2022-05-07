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
  let Types;
  let bridge: FrontendBridge;
  let legacyRender;
  let store: Store;
  let utils;
  let internalAct;

  const act = (callback: Function) => {
    internalAct(() => {
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
    Types = require('react-devtools-shared/src/types');
    utils = require('./utils');
    internalAct = require('jest-react').act;

    legacyRender = utils.legacyRender;
  });

  it('should throw if filters are updated while profiling', () => {
    act(() => store.profilerStore.startProfiling());
    expect(() => (store.componentFilters = [])).toThrow(
      'Cannot modify filter preferences while profiling',
    );
  });

  it('should support filtering by element type', () => {
    class ClassComponent extends React.Component<{|children: React$Node|}> {
      render() {
        return <div>{this.props.children}</div>;
      }
    }
    const FunctionComponent = () => <div>Hi</div>;

    act(() =>
      legacyRender(
        <ClassComponent>
          <FunctionComponent />
        </ClassComponent>,
        document.createElement('div'),
      ),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <ClassComponent>
          ▾ <div>
            ▾ <FunctionComponent>
                <div>
    `);

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeHostComponent),
        ]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <ClassComponent>
            <FunctionComponent>
    `);

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass),
        ]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <div>
          ▾ <FunctionComponent>
              <div>
    `);

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass),
          utils.createElementTypeFilter(Types.ElementTypeFunction),
        ]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <div>
            <div>
    `);

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass, false),
          utils.createElementTypeFilter(Types.ElementTypeFunction, false),
        ]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <ClassComponent>
          ▾ <div>
            ▾ <FunctionComponent>
                <div>
    `);

    act(() => (store.componentFilters = []));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <ClassComponent>
          ▾ <div>
            ▾ <FunctionComponent>
                <div>
    `);
  });

  it('should ignore invalid ElementTypeRoot filter', () => {
    const Component = () => <div>Hi</div>;

    act(() => legacyRender(<Component />, document.createElement('div')));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeRoot),
        ]),
    );

    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);
  });

  it('should filter by display name', () => {
    const Text = ({label}) => label;
    const Foo = () => <Text label="foo" />;
    const Bar = () => <Text label="bar" />;
    const Baz = () => <Text label="baz" />;

    act(() =>
      legacyRender(
        <React.Fragment>
          <Foo />
          <Bar />
          <Baz />
        </React.Fragment>,
        document.createElement('div'),
      ),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Foo>
            <Text>
        ▾ <Bar>
            <Text>
        ▾ <Baz>
            <Text>
    `);

    act(
      () => (store.componentFilters = [utils.createDisplayNameFilter('Foo')]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
          <Text>
        ▾ <Bar>
            <Text>
        ▾ <Baz>
            <Text>
    `);

    act(() => (store.componentFilters = [utils.createDisplayNameFilter('Ba')]));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Foo>
            <Text>
          <Text>
          <Text>
    `);

    act(
      () => (store.componentFilters = [utils.createDisplayNameFilter('B.z')]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Foo>
            <Text>
        ▾ <Bar>
            <Text>
          <Text>
    `);
  });

  it('should filter by path', () => {
    const Component = () => <div>Hi</div>;

    act(() => legacyRender(<Component />, document.createElement('div')));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    act(
      () =>
        (store.componentFilters = [
          utils.createLocationFilter(__filename.replace(__dirname, '')),
        ]),
    );

    expect(store).toMatchInlineSnapshot(`[root]`);

    act(
      () =>
        (store.componentFilters = [
          utils.createLocationFilter('this:is:a:made:up:path'),
        ]),
    );

    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);
  });

  it('should filter HOCs', () => {
    const Component = () => <div>Hi</div>;
    const Foo = () => <Component />;
    Foo.displayName = 'Foo(Component)';
    const Bar = () => <Foo />;
    Bar.displayName = 'Bar(Foo(Component))';

    act(() => legacyRender(<Bar />, document.createElement('div')));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component> [Bar][Foo]
          ▾ <Component> [Foo]
            ▾ <Component>
                <div>
    `);

    act(() => (store.componentFilters = [utils.createHOCFilter(true)]));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    act(() => (store.componentFilters = [utils.createHOCFilter(false)]));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component> [Bar][Foo]
          ▾ <Component> [Foo]
            ▾ <Component>
                <div>
    `);
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
    act(() => legacyRender(<Wrapper shouldSuspend={true} />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
          ▾ <Loading>
              <div>
    `);

    act(() => legacyRender(<Wrapper shouldSuspend={false} />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
            <Component>
    `);

    act(() => legacyRender(<Wrapper shouldSuspend={true} />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
          ▾ <Loading>
              <div>
    `);
  });

  describe('inline errors and warnings', () => {
    it('only counts for unfiltered components', () => {
      function ComponentWithWarning() {
        console.warn('test-only: render warning');
        return null;
      }
      function ComponentWithError() {
        console.error('test-only: render error');
        return null;
      }
      function ComponentWithWarningAndError() {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      }

      // HACK This require() is needed (somewhere in the test) for this case to pass.
      // Without it, the legacyRender() call below causes this test to fail
      // because it requires "react-dom" for the first time,
      // which causes the console error() and warn() methods to be overridden again,
      // effectively disconnecting the DevTools override in 'react-devtools-shared/src/backend/console'.
      require('react-dom');

      const container = document.createElement('div');
      utils.withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(
          () =>
            (store.componentFilters = [
              utils.createDisplayNameFilter('Warning'),
              utils.createDisplayNameFilter('Error'),
            ]),
        );
        act(() =>
          legacyRender(
            <React.Fragment>
              <ComponentWithError />
              <ComponentWithWarning />
              <ComponentWithWarningAndError />
            </React.Fragment>,
            container,
          ),
        );
      });

      expect(store).toMatchInlineSnapshot(`[root]`);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      act(() => (store.componentFilters = []));
      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <ComponentWithError> ✕
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);

      act(
        () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Warning')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 0
        [root]
            <ComponentWithError> ✕
      `);

      act(
        () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Error')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 0, ⚠ 1
        [root]
            <ComponentWithWarning> ⚠
      `);

      act(
        () =>
          (store.componentFilters = [
            utils.createDisplayNameFilter('Warning'),
            utils.createDisplayNameFilter('Error'),
          ]),
      );
      expect(store).toMatchInlineSnapshot(`[root]`);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      act(() => (store.componentFilters = []));
      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <ComponentWithError> ✕
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);
    });
  });
});
