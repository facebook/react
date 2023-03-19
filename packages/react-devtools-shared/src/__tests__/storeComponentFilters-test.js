/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

  const act = async (callback: Function) => {
    if (React.unstable_act != null) {
      await React.unstable_act(callback);
    } else {
      callback();
    }

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

    legacyRender = utils.legacyRender;
  });

  // @reactVersion >= 16.0
  it('should throw if filters are updated while profiling', async () => {
    await act(async () => store.profilerStore.startProfiling());
    expect(() => (store.componentFilters = [])).toThrow(
      'Cannot modify filter preferences while profiling',
    );
  });

  // @reactVersion >= 16.0
  it('should support filtering by element type', async () => {
    class ClassComponent extends React.Component<{children: React$Node}> {
      render() {
        return <div>{this.props.children}</div>;
      }
    }
    const FunctionComponent = () => <div>Hi</div>;

    await act(async () =>
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

    await act(
      async () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeHostComponent),
        ]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <ClassComponent>
            <FunctionComponent>
    `);

    await act(
      async () =>
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

    await act(
      async () =>
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

    await act(
      async () =>
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

    await act(async () => (store.componentFilters = []));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <ClassComponent>
          ▾ <div>
            ▾ <FunctionComponent>
                <div>
    `);
  });

  // @reactVersion >= 16.0
  it('should ignore invalid ElementTypeRoot filter', async () => {
    const Component = () => <div>Hi</div>;

    await act(async () =>
      legacyRender(<Component />, document.createElement('div')),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    await act(
      async () =>
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

  // @reactVersion >= 16.2
  it('should filter by display name', async () => {
    const Text = ({label}) => label;
    const Foo = () => <Text label="foo" />;
    const Bar = () => <Text label="bar" />;
    const Baz = () => <Text label="baz" />;

    await act(async () =>
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

    await act(
      async () =>
        (store.componentFilters = [utils.createDisplayNameFilter('Foo')]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
          <Text>
        ▾ <Bar>
            <Text>
        ▾ <Baz>
            <Text>
    `);

    await act(
      async () =>
        (store.componentFilters = [utils.createDisplayNameFilter('Ba')]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Foo>
            <Text>
          <Text>
          <Text>
    `);

    await act(
      async () =>
        (store.componentFilters = [utils.createDisplayNameFilter('B.z')]),
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

  // @reactVersion >= 16.0
  it('should filter by path', async () => {
    const Component = () => <div>Hi</div>;

    await act(async () =>
      legacyRender(<Component />, document.createElement('div')),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    await act(
      async () =>
        (store.componentFilters = [
          utils.createLocationFilter(__filename.replace(__dirname, '')),
        ]),
    );

    expect(store).toMatchInlineSnapshot(`[root]`);

    await act(
      async () =>
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

  // @reactVersion >= 16.0
  it('should filter HOCs', async () => {
    const Component = () => <div>Hi</div>;
    const Foo = () => <Component />;
    Foo.displayName = 'Foo(Component)';
    const Bar = () => <Foo />;
    Bar.displayName = 'Bar(Foo(Component))';

    await act(async () => legacyRender(<Bar />, document.createElement('div')));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component> [Bar][Foo]
          ▾ <Component> [Foo]
            ▾ <Component>
                <div>
    `);

    await act(
      async () => (store.componentFilters = [utils.createHOCFilter(true)]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    await act(
      async () => (store.componentFilters = [utils.createHOCFilter(false)]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component> [Bar][Foo]
          ▾ <Component> [Foo]
            ▾ <Component>
                <div>
    `);
  });

  // @reactVersion >= 16.0
  it('should not send a bridge update if the set of enabled filters has not changed', async () => {
    await act(
      async () => (store.componentFilters = [utils.createHOCFilter(true)]),
    );

    bridge.addListener('updateComponentFilters', componentFilters => {
      throw Error('Unexpected component update');
    });

    await act(
      async () =>
        (store.componentFilters = [
          utils.createHOCFilter(false),
          utils.createHOCFilter(true),
        ]),
    );
    await act(
      async () =>
        (store.componentFilters = [
          utils.createHOCFilter(true),
          utils.createLocationFilter('abc', false),
        ]),
    );
    await act(
      async () =>
        (store.componentFilters = [
          utils.createHOCFilter(true),
          utils.createElementTypeFilter(Types.ElementTypeHostComponent, false),
        ]),
    );
  });

  // @reactVersion >= 18.0
  it('should not break when Suspense nodes are filtered from the tree', async () => {
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
    await act(async () =>
      legacyRender(<Wrapper shouldSuspend={true} />, container),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
          ▾ <Loading>
              <div>
    `);

    await act(async () =>
      legacyRender(<Wrapper shouldSuspend={false} />, container),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
            <Component>
    `);

    await act(async () =>
      legacyRender(<Wrapper shouldSuspend={true} />, container),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
          ▾ <Loading>
              <div>
    `);
  });

  describe('inline errors and warnings', () => {
    // @reactVersion >= 17.0
    it('only counts for unfiltered components', async () => {
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
      await act(
        async () =>
          (store.componentFilters = [
            utils.createDisplayNameFilter('Warning'),
            utils.createDisplayNameFilter('Error'),
          ]),
      );
      utils.withErrorsOrWarningsIgnored(['test-only:'], () => {
        legacyRender(
          <React.Fragment>
            <ComponentWithError />
            <ComponentWithWarning />
            <ComponentWithWarningAndError />
          </React.Fragment>,
          container,
        );
      });

      expect(store).toMatchInlineSnapshot(``);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      await act(async () => (store.componentFilters = []));
      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <ComponentWithError> ✕
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);

      await act(
        async () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Warning')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 0
        [root]
            <ComponentWithError> ✕
      `);

      await act(
        async () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Error')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 0, ⚠ 1
        [root]
            <ComponentWithWarning> ⚠
      `);

      await act(
        async () =>
          (store.componentFilters = [
            utils.createDisplayNameFilter('Warning'),
            utils.createDisplayNameFilter('Error'),
          ]),
      );
      expect(store).toMatchInlineSnapshot(`[root]`);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      await act(async () => (store.componentFilters = []));
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
