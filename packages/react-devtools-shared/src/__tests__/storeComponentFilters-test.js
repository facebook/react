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

import {
  getLegacyRenderImplementation,
  getVersionedRenderImplementation,
} from './utils';

describe('Store component filters', () => {
  let React;
  let Types;
  let bridge: FrontendBridge;
  let store: Store;
  let utils;
  let actAsync;

  beforeEach(() => {
    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;
    store.componentFilters = [];
    store.recordChangeDescriptions = true;

    React = require('react');
    Types = require('react-devtools-shared/src/frontend/types');
    utils = require('./utils');

    actAsync = utils.actAsync;
  });

  const {render} = getVersionedRenderImplementation();

  // @reactVersion >= 16.0
  it('should throw if filters are updated while profiling', async () => {
    await actAsync(async () => store.profilerStore.startProfiling());
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

    await actAsync(async () =>
      render(
        <ClassComponent>
          <FunctionComponent />
        </ClassComponent>,
      ),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <ClassComponent>
          ▾ <div>
            ▾ <FunctionComponent>
                <div>
    `);

    await actAsync(
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

    await actAsync(
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

    await actAsync(
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

    await actAsync(
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

    await actAsync(async () => (store.componentFilters = []));
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

    await actAsync(async () => render(<Component />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    await actAsync(
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

    await actAsync(async () =>
      render(
        <React.Fragment>
          <Foo />
          <Bar />
          <Baz />
        </React.Fragment>,
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

    await actAsync(
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

    await actAsync(
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

    await actAsync(
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

  // Disabled: filtering by path was removed, source is now determined lazily, including symbolication if applicable
  // @reactVersion >= 16.0
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should filter by path', async () => {
    // This component should use props object in order to throw for component stack generation
    // See ReactComponentStackFrame:155 or DevToolsComponentStackFrame:147
    const Component = props => {
      return <div>{props.message}</div>;
    };

    await actAsync(async () => render(<Component message="Hi" />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    await actAsync(
      async () =>
        (store.componentFilters = [
          utils.createLocationFilter(__filename.replace(__dirname, '')),
        ]),
    );

    expect(store).toMatchInlineSnapshot(`[root]`);

    await actAsync(
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

    await actAsync(async () => render(<Bar />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component> [Bar][Foo]
          ▾ <Component> [Foo]
            ▾ <Component>
                <div>
    `);

    await actAsync(
      async () => (store.componentFilters = [utils.createHOCFilter(true)]),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    await actAsync(
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
    await actAsync(
      async () => (store.componentFilters = [utils.createHOCFilter(true)]),
    );

    bridge.addListener('updateComponentFilters', componentFilters => {
      throw Error('Unexpected component update');
    });

    await actAsync(
      async () =>
        (store.componentFilters = [
          utils.createHOCFilter(false),
          utils.createHOCFilter(true),
        ]),
    );
    await actAsync(
      async () =>
        (store.componentFilters = [
          utils.createHOCFilter(true),
          utils.createLocationFilter('abc', false),
        ]),
    );
    await actAsync(
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

    await actAsync(async () => render(<Wrapper shouldSuspend={true} />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
          ▾ <Loading>
              <div>
    `);

    await actAsync(async () => render(<Wrapper shouldSuspend={false} />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
            <Component>
    `);

    await actAsync(async () => render(<Wrapper shouldSuspend={true} />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Wrapper>
          ▾ <Loading>
              <div>
    `);
  });

  describe('inline errors and warnings', () => {
    const {render: legacyRender} = getLegacyRenderImplementation();

    // @reactVersion >= 17.0
    // @reactVersion <= 18.2
    it('only counts for unfiltered components (legacy render)', async () => {
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

      await actAsync(
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
        );
      });

      expect(store).toMatchInlineSnapshot(``);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      await actAsync(async () => (store.componentFilters = []));
      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <ComponentWithError> ✕
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);

      await actAsync(
        async () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Warning')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 0
        [root]
            <ComponentWithError> ✕
      `);

      await actAsync(
        async () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Error')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 0, ⚠ 1
        [root]
            <ComponentWithWarning> ⚠
      `);

      await actAsync(
        async () =>
          (store.componentFilters = [
            utils.createDisplayNameFilter('Warning'),
            utils.createDisplayNameFilter('Error'),
          ]),
      );
      expect(store).toMatchInlineSnapshot(`[root]`);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      await actAsync(async () => (store.componentFilters = []));
      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <ComponentWithError> ✕
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);
    });

    // @reactVersion >= 18
    it('only counts for unfiltered components (createRoot)', async () => {
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

      await actAsync(
        async () =>
          (store.componentFilters = [
            utils.createDisplayNameFilter('Warning'),
            utils.createDisplayNameFilter('Error'),
          ]),
      );

      utils.withErrorsOrWarningsIgnored(['test-only:'], () => {
        utils.act(() => {
          render(
            <React.Fragment>
              <ComponentWithError />
              <ComponentWithWarning />
              <ComponentWithWarningAndError />
            </React.Fragment>,
          );
        }, false);
      });

      expect(store).toMatchInlineSnapshot(``);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      await actAsync(async () => (store.componentFilters = []));
      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <ComponentWithError> ✕
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);

      await actAsync(
        async () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Warning')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 0
        [root]
            <ComponentWithError> ✕
      `);

      await actAsync(
        async () =>
          (store.componentFilters = [utils.createDisplayNameFilter('Error')]),
      );
      expect(store).toMatchInlineSnapshot(`
        ✕ 0, ⚠ 1
        [root]
            <ComponentWithWarning> ⚠
      `);

      await actAsync(
        async () =>
          (store.componentFilters = [
            utils.createDisplayNameFilter('Warning'),
            utils.createDisplayNameFilter('Error'),
          ]),
      );
      expect(store).toMatchInlineSnapshot(`[root]`);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);

      await actAsync(async () => (store.componentFilters = []));
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
