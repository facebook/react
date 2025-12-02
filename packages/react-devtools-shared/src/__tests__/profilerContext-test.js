/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof ReactTestRenderer from 'react-test-renderer';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Context} from 'react-devtools-shared/src/devtools/views/Profiler/ProfilerContext';
import type {DispatcherContext} from 'react-devtools-shared/src/devtools/views/Components/TreeContext';
import type Store from 'react-devtools-shared/src/devtools/store';

import {getVersionedRenderImplementation} from './utils';

describe('ProfilerContext', () => {
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let TestRenderer: ReactTestRenderer;
  let bridge: FrontendBridge;
  let legacyRender;
  let store: Store;
  let utils;

  let BridgeContext;
  let ProfilerContext;
  let ProfilerContextController;
  let StoreContext;
  let TreeContextController;
  let TreeDispatcherContext;
  let TreeStateContext;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    legacyRender = utils.legacyRender;

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;
    store.recordChangeDescriptions = true;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    TestRenderer = utils.requireTestRenderer();

    BridgeContext =
      require('react-devtools-shared/src/devtools/views/context').BridgeContext;
    ProfilerContext =
      require('react-devtools-shared/src/devtools/views/Profiler/ProfilerContext').ProfilerContext;
    ProfilerContextController =
      require('react-devtools-shared/src/devtools/views/Profiler/ProfilerContext').ProfilerContextController;
    StoreContext =
      require('react-devtools-shared/src/devtools/views/context').StoreContext;
    TreeContextController =
      require('react-devtools-shared/src/devtools/views/Components/TreeContext').TreeContextController;
    TreeDispatcherContext =
      require('react-devtools-shared/src/devtools/views/Components/TreeContext').TreeDispatcherContext;
    TreeStateContext =
      require('react-devtools-shared/src/devtools/views/Components/TreeContext').TreeStateContext;
  });

  const {render} = getVersionedRenderImplementation();

  const Contexts = ({
    children = null,
    defaultInspectedElementID = null,
    defaultInspectedElementIndex = null,
  }: any) => (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContextController
          defaultInspectedElementID={defaultInspectedElementID}
          defaultInspectedElementIndex={defaultInspectedElementIndex}>
          <ProfilerContextController>{children}</ProfilerContextController>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  // @reactVersion <= 18.2
  // @reactVersion >= 18.0
  it('updates updates profiling support based on the attached roots (legacy render)', async () => {
    const Component = () => null;

    let context: Context = ((null: any): Context);

    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }
    await utils.actAsync(() => {
      TestRenderer.create(
        <Contexts>
          <ContextReader />
        </Contexts>,
      );
    });

    expect(context.supportsProfiling).toBe(false);

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    await utils.actAsync(() => legacyRender(<Component />, containerA));
    expect(context.supportsProfiling).toBe(true);

    await utils.actAsync(() => legacyRender(<Component />, containerB));
    await utils.actAsync(() => ReactDOM.unmountComponentAtNode(containerA));
    expect(context.supportsProfiling).toBe(true);

    await utils.actAsync(() => ReactDOM.unmountComponentAtNode(containerB));
    expect(context.supportsProfiling).toBe(false);
  });

  // @reactVersion >= 18
  it('updates updates profiling support based on the attached roots (createRoot)', async () => {
    const Component = () => null;

    let context: Context = ((null: any): Context);

    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }
    await utils.actAsync(() => {
      TestRenderer.create(
        <Contexts>
          <ContextReader />
        </Contexts>,
      );
    });

    expect(context.supportsProfiling).toBe(false);

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    const rootA = ReactDOMClient.createRoot(containerA);
    const rootB = ReactDOMClient.createRoot(containerB);

    await utils.actAsync(() => rootA.render(<Component />));
    expect(context.supportsProfiling).toBe(true);

    await utils.actAsync(() => rootB.render(<Component />));
    await utils.actAsync(() => rootA.unmount());
    expect(context.supportsProfiling).toBe(true);

    await utils.actAsync(() => rootB.unmount());
    expect(context.supportsProfiling).toBe(false);
  });

  it('should gracefully handle an empty profiling session (with no recorded commits)', async () => {
    const Example = () => null;

    utils.act(() => render(<Example />));

    let context: Context = ((null: any): Context);

    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }

    // Profile but don't record any updates.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => {
      TestRenderer.create(
        <Contexts>
          <ContextReader />
        </Contexts>,
      );
    });
    expect(context).not.toBeNull();
    expect(context.didRecordCommits).toBe(false);
    expect(context.isProcessingData).toBe(false);
    expect(context.isProfiling).toBe(true);
    expect(context.profilingData).toBe(null);
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    expect(context).not.toBeNull();
    expect(context.didRecordCommits).toBe(false);
    expect(context.isProcessingData).toBe(false);
    expect(context.isProfiling).toBe(false);
    expect(context.profilingData).toBe(null);
  });

  // @reactVersion <= 18.2
  // @reactVersion >= 18.0
  it('should auto-select the root ID matching the Components tab selection if it has profiling data (legacy render)', async () => {
    const Parent = () => <Child />;
    const Child = () => null;

    const containerOne = document.createElement('div');
    const containerTwo = document.createElement('div');
    utils.act(() => legacyRender(<Parent />, containerOne));
    utils.act(() => legacyRender(<Parent />, containerTwo));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child>
      [root]
        ▾ <Parent>
            <Child>
    `);

    // Profile and record updates to both roots.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => legacyRender(<Parent />, containerOne));
    await utils.actAsync(() => legacyRender(<Parent />, containerTwo));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    let context: Context = ((null: any): Context);
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }

    // Select an element within the second root.
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultInspectedElementID={store.getElementIDAtIndex(3)}
          defaultInspectedElementIndex={3}>
          <ContextReader />
        </Contexts>,
      ),
    );

    expect(context).not.toBeNull();
    expect(context.rootID).toBe(
      store.getRootIDForElement(((store.getElementIDAtIndex(3): any): number)),
    );
  });

  // @reactVersion >= 18
  it('should auto-select the root ID matching the Components tab selection if it has profiling data (createRoot)', async () => {
    const Parent = () => <Child />;
    const Child = () => null;

    const containerOne = document.createElement('div');
    const containerTwo = document.createElement('div');

    const rootOne = ReactDOMClient.createRoot(containerOne);
    const rootTwo = ReactDOMClient.createRoot(containerTwo);

    utils.act(() => rootOne.render(<Parent />));
    utils.act(() => rootTwo.render(<Parent />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child>
      [root]
        ▾ <Parent>
            <Child>
    `);

    // Profile and record updates to both roots.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => rootOne.render(<Parent />));
    await utils.actAsync(() => rootTwo.render(<Parent />));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    let context: Context = ((null: any): Context);
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }

    // Select an element within the second root.
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultInspectedElementID={store.getElementIDAtIndex(3)}
          defaultInspectedElementIndex={3}>
          <ContextReader />
        </Contexts>,
      ),
    );

    expect(context).not.toBeNull();
    expect(context.rootID).toBe(
      store.getRootIDForElement(((store.getElementIDAtIndex(3): any): number)),
    );
  });

  // @reactVersion <= 18.2
  // @reactVersion >= 18.0
  it('should not select the root ID matching the Components tab selection if it has no profiling data (legacy render)', async () => {
    const Parent = () => <Child />;
    const Child = () => null;

    const containerOne = document.createElement('div');
    const containerTwo = document.createElement('div');
    utils.act(() => legacyRender(<Parent />, containerOne));
    utils.act(() => legacyRender(<Parent />, containerTwo));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child>
      [root]
        ▾ <Parent>
            <Child>
    `);

    // Profile and record updates to only the first root.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => legacyRender(<Parent />, containerOne));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    let context: Context = ((null: any): Context);
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }

    // Select an element within the second root.
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultInspectedElementID={store.getElementIDAtIndex(3)}
          defaultInspectedElementIndex={3}>
          <ContextReader />
        </Contexts>,
      ),
    );

    // Verify the default profiling root is the first one.
    expect(context).not.toBeNull();
    expect(context.rootID).toBe(
      store.getRootIDForElement(((store.getElementIDAtIndex(0): any): number)),
    );
  });

  // @reactVersion >= 18
  it('should not select the root ID matching the Components tab selection if it has no profiling data (createRoot)', async () => {
    const Parent = () => <Child />;
    const Child = () => null;

    const containerOne = document.createElement('div');
    const containerTwo = document.createElement('div');

    const rootOne = ReactDOMClient.createRoot(containerOne);
    const rootTwo = ReactDOMClient.createRoot(containerTwo);

    utils.act(() => rootOne.render(<Parent />));
    utils.act(() => rootTwo.render(<Parent />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child>
      [root]
        ▾ <Parent>
            <Child>
    `);

    // Profile and record updates to only the first root.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => rootOne.render(<Parent />));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    let context: Context = ((null: any): Context);
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }

    // Select an element within the second root.
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultInspectedElementID={store.getElementIDAtIndex(3)}
          defaultInspectedElementIndex={3}>
          <ContextReader />
        </Contexts>,
      ),
    );

    // Verify the default profiling root is the first one.
    expect(context).not.toBeNull();
    expect(context.rootID).toBe(
      store.getRootIDForElement(((store.getElementIDAtIndex(0): any): number)),
    );
  });

  // @reactVersion <= 18.2
  // @reactVersion >= 18.0
  it('should maintain root selection between profiling sessions so long as there is data for that root (legacy render)', async () => {
    const Parent = () => <Child />;
    const Child = () => null;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    utils.act(() => legacyRender(<Parent />, containerA));
    utils.act(() => legacyRender(<Parent />, containerB));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child>
      [root]
        ▾ <Parent>
            <Child>
    `);

    // Profile and record updates.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => legacyRender(<Parent />, containerA));
    await utils.actAsync(() => legacyRender(<Parent />, containerB));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    let context: Context = ((null: any): Context);
    let dispatch: DispatcherContext = ((null: any): DispatcherContext);
    let inspectedElementID = null;
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      dispatch = React.useContext(TreeDispatcherContext);
      inspectedElementID =
        React.useContext(TreeStateContext).inspectedElementID;
      return null;
    }

    const id = ((store.getElementIDAtIndex(3): any): number);

    // Select an element within the second root.
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultInspectedElementID={id}
          defaultInspectedElementIndex={3}>
          <ContextReader />
        </Contexts>,
      ),
    );

    expect(inspectedElementID).toBe(id);

    // Profile and record more updates to both roots
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => legacyRender(<Parent />, containerA));
    await utils.actAsync(() => legacyRender(<Parent />, containerB));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    const otherID = ((store.getElementIDAtIndex(0): any): number);

    // Change the selected element within a the Components tab.
    utils.act(() => dispatch({type: 'SELECT_ELEMENT_AT_INDEX', payload: 0}));

    // Verify that the initial Profiler root selection is maintained.
    expect(inspectedElementID).toBe(otherID);
    expect(context).not.toBeNull();
    expect(context.rootID).toBe(store.getRootIDForElement(id));
  });

  // @reactVersion >= 18.0
  it('should maintain root selection between profiling sessions so long as there is data for that root (createRoot)', async () => {
    const Parent = () => <Child />;
    const Child = () => null;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    const rootA = ReactDOMClient.createRoot(containerA);
    const rootB = ReactDOMClient.createRoot(containerB);

    utils.act(() => rootA.render(<Parent />));
    utils.act(() => rootB.render(<Parent />));

    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Parent>
            <Child>
      [root]
        ▾ <Parent>
            <Child>
    `);

    // Profile and record updates.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => rootA.render(<Parent />));
    await utils.actAsync(() => rootB.render(<Parent />));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    let context: Context = ((null: any): Context);
    let dispatch: DispatcherContext = ((null: any): DispatcherContext);
    let inspectedElementID = null;
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      dispatch = React.useContext(TreeDispatcherContext);
      inspectedElementID =
        React.useContext(TreeStateContext).inspectedElementID;
      return null;
    }

    const id = ((store.getElementIDAtIndex(3): any): number);

    // Select an element within the second root.
    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts
          defaultInspectedElementID={id}
          defaultInspectedElementIndex={3}>
          <ContextReader />
        </Contexts>,
      ),
    );

    expect(inspectedElementID).toBe(id);

    // Profile and record more updates to both roots
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => rootA.render(<Parent />));
    await utils.actAsync(() => rootB.render(<Parent />));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    const otherID = ((store.getElementIDAtIndex(0): any): number);

    // Change the selected element within a the Components tab.
    utils.act(() => dispatch({type: 'SELECT_ELEMENT_AT_INDEX', payload: 0}));

    // Verify that the initial Profiler root selection is maintained.
    expect(inspectedElementID).toBe(otherID);
    expect(context).not.toBeNull();
    expect(context.rootID).toBe(store.getRootIDForElement(id));
  });

  it('should sync selected element in the Components tab too, provided the element is a match', async () => {
    const GrandParent = ({includeChild}) => (
      <Parent includeChild={includeChild} />
    );
    const Parent = ({includeChild}) => (includeChild ? <Child /> : null);
    const Child = () => null;

    utils.act(() => render(<GrandParent includeChild={true} />));
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <GrandParent>
          ▾ <Parent>
              <Child>
    `);

    const parentID = ((store.getElementIDAtIndex(1): any): number);
    const childID = ((store.getElementIDAtIndex(2): any): number);

    // Profile and record updates.
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => render(<GrandParent includeChild={true} />));
    await utils.actAsync(() => render(<GrandParent includeChild={false} />));
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <GrandParent>
            <Parent>
    `);

    let context: Context = ((null: any): Context);
    let inspectedElementID = null;
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      inspectedElementID =
        React.useContext(TreeStateContext).inspectedElementID;
      return null;
    }

    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts>
          <ContextReader />
        </Contexts>,
      ),
    );
    expect(inspectedElementID).toBeNull();

    // Select an element in the Profiler tab and verify that the selection is synced to the Components tab.
    await utils.actAsync(() => context.selectFiber(parentID, 'Parent'));
    expect(inspectedElementID).toBe(parentID);

    // Select an unmounted element and verify no Components tab selection doesn't change.
    await utils.actAsync(() => context.selectFiber(childID, 'Child'));
    expect(inspectedElementID).toBe(parentID);
  });

  it('should toggle profiling when the keyboard shortcut is pressed', async () => {
    // Context providers
    const Profiler =
      require('react-devtools-shared/src/devtools/views/Profiler/Profiler').default;
    const {
      TimelineContextController,
    } = require('react-devtools-timeline/src/TimelineContext');
    const {
      SettingsContextController,
    } = require('react-devtools-shared/src/devtools/views/Settings/SettingsContext');
    const {
      ModalDialogContextController,
    } = require('react-devtools-shared/src/devtools/views/ModalDialog');

    // Dom component for profiling to be enabled
    const Component = () => null;
    utils.act(() => render(<Component />));

    const profilerContainer = document.createElement('div');
    document.body.appendChild(profilerContainer);

    // Create a root for the profiler
    const profilerRoot = ReactDOMClient.createRoot(profilerContainer);

    // Render the profiler
    utils.act(() => {
      profilerRoot.render(
        <Contexts>
          <SettingsContextController browserTheme="light">
            <ModalDialogContextController>
              <TimelineContextController>
                <Profiler />
              </TimelineContextController>
            </ModalDialogContextController>
          </SettingsContextController>
        </Contexts>,
      );
    });

    // Verify that the profiler is not profiling.
    expect(store.profilerStore.isProfilingBasedOnUserInput).toBe(false);

    // Trigger the keyboard shortcut.
    const ownerWindow = profilerContainer.ownerDocument.defaultView;
    const isMac =
      typeof navigator !== 'undefined' &&
      navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const keyEvent = new KeyboardEvent('keydown', {
      key: 'e',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });

    // Dispatch keyboard event to toggle profiling on
    // Try utils.actAsync with recursivelyFlush=false
    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(keyEvent);
    }, false);
    expect(store.profilerStore.isProfilingBasedOnUserInput).toBe(true);

    // Dispatch keyboard event to toggle profiling off
    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(keyEvent);
    }, false);
    expect(store.profilerStore.isProfilingBasedOnUserInput).toBe(false);

    document.body.removeChild(profilerContainer);
  });

  // @reactVersion >= 18
  it('should navigate between commits when the keyboard shortcut is pressed', async () => {
    const Parent = () => <Child />;
    const Child = () => null;

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    utils.act(() => root.render(<Parent />));

    // Profile and record multiple commits
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => root.render(<Parent />)); // Commit 1
    await utils.actAsync(() => root.render(<Parent />)); // Commit 2
    await utils.actAsync(() => root.render(<Parent />)); // Commit 3
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    // Context providers
    const Profiler =
      require('react-devtools-shared/src/devtools/views/Profiler/Profiler').default;
    const {
      TimelineContextController,
    } = require('react-devtools-timeline/src/TimelineContext');
    const {
      SettingsContextController,
    } = require('react-devtools-shared/src/devtools/views/Settings/SettingsContext');
    const {
      ModalDialogContextController,
    } = require('react-devtools-shared/src/devtools/views/ModalDialog');

    let context: Context = ((null: any): Context);
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }

    const profilerContainer = document.createElement('div');
    document.body.appendChild(profilerContainer);

    // Create a root for the profiler
    const profilerRoot = ReactDOMClient.createRoot(profilerContainer);

    // Render the profiler with ContextReader
    await utils.actAsync(() => {
      profilerRoot.render(
        <Contexts>
          <SettingsContextController browserTheme="light">
            <ModalDialogContextController>
              <TimelineContextController>
                <Profiler />
                <ContextReader />
              </TimelineContextController>
            </ModalDialogContextController>
          </SettingsContextController>
        </Contexts>,
      );
    });

    // Verify we have profiling data with 3 commits
    expect(context.didRecordCommits).toBe(true);
    expect(context.profilingData).not.toBeNull();
    const rootID = context.rootID;
    expect(rootID).not.toBeNull();
    const dataForRoot = context.profilingData.dataForRoots.get(rootID);
    expect(dataForRoot.commitData.length).toBe(3);

    // Set initial commit selection
    await utils.actAsync(() => context.selectCommitIndex(0));
    expect(context.selectedCommitIndex).toBe(0);

    const ownerWindow = profilerContainer.ownerDocument.defaultView;
    const isMac =
      typeof navigator !== 'undefined' &&
      navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // Test ArrowRight navigation (forward) with correct modifier
    const arrowRightEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });

    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(arrowRightEvent);
    }, false);
    expect(context.selectedCommitIndex).toBe(1);

    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(arrowRightEvent);
    }, false);
    expect(context.selectedCommitIndex).toBe(2);

    // Test wrap-around (last -> first)
    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(arrowRightEvent);
    }, false);
    expect(context.selectedCommitIndex).toBe(0);

    // Test ArrowLeft navigation (backward) with correct modifier
    const arrowLeftEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });

    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(arrowLeftEvent);
    }, false);
    expect(context.selectedCommitIndex).toBe(2);

    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(arrowLeftEvent);
    }, false);
    expect(context.selectedCommitIndex).toBe(1);

    await utils.actAsync(() => {
      ownerWindow.dispatchEvent(arrowLeftEvent);
    }, false);
    expect(context.selectedCommitIndex).toBe(0);

    document.body.removeChild(profilerContainer);
  });

  it('should handle commit selection edge cases when filtering commits', async () => {
    // Create components that render with different durations
    const FastComponent = () => null;
    const SlowComponent = () => {
      // Simulate slow render
      const start = performance.now();
      while (performance.now() - start < 20) {
        // Busy wait
      }
      return null;
    };

    const container = document.createElement('div');

    // Initial render
    utils.act(() => legacyRender(<FastComponent />, container));

    let context: Context = ((null: any): Context);
    function ContextReader() {
      context = React.useContext(ProfilerContext);
      return null;
    }

    await utils.actAsync(() =>
      TestRenderer.create(
        <Contexts>
          <ContextReader />
        </Contexts>,
      ),
    );

    // Profile with multiple commits of varying durations
    await utils.actAsync(() => store.profilerStore.startProfiling());
    await utils.actAsync(() => legacyRender(<FastComponent />, container)); // Fast commit (index 0)
    await utils.actAsync(() => legacyRender(<SlowComponent />, container)); // Slow commit (index 1)
    await utils.actAsync(() => legacyRender(<FastComponent />, container)); // Fast commit (index 2)
    await utils.actAsync(() => legacyRender(<SlowComponent />, container)); // Slow commit (index 3)
    await utils.actAsync(() => store.profilerStore.stopProfiling());

    // Initially, no commit is selected and no filter is enabled
    expect(context.selectedCommitIndex).toBe(null);
    expect(context.isCommitFilterEnabled).toBe(false);

    // Case 1: When no commit is selected and there are commits, first should auto-select
    expect(context.filteredCommitIndices.length).toBe(4);
    expect(context.selectedFilteredCommitIndex).toBe(null);

    // The context should auto-select the first commit when rendered with commits available
    await utils.actAsync(() => {
      TestRenderer.create(
        <Contexts>
          <ContextReader />
        </Contexts>,
      );
    });
    expect(context.selectedCommitIndex).toBe(0);

    // Case 2: Select a slow commit, then enable filter to hide it
    await utils.actAsync(() => context.selectCommitIndex(3)); // Select last slow commit
    expect(context.selectedCommitIndex).toBe(3);

    // Enable filter with duration threshold that filters out fast commits
    await utils.actAsync(() => context.setIsCommitFilterEnabled(true));
    await utils.actAsync(() => context.setMinCommitDuration(10)); // Filter for commits > 10ms

    // After filtering, only slow commits (1, 3) should remain
    // Selected commit (3) should still be valid
    expect(context.filteredCommitIndices).toEqual([1, 3]);
    expect(context.selectedCommitIndex).toBe(3);
    expect(context.selectedFilteredCommitIndex).toBe(1); // Index 1 in filtered array

    // Case 3: Select a fast commit, then filter it out
    await utils.actAsync(() => context.setIsCommitFilterEnabled(false));
    await utils.actAsync(() => context.selectCommitIndex(0)); // Select first fast commit
    expect(context.selectedCommitIndex).toBe(0);

    // Re-enable filter - commit 0 should be filtered out
    await utils.actAsync(() => context.setIsCommitFilterEnabled(true));

    // Context should auto-correct to last valid filtered commit
    expect(context.filteredCommitIndices).toEqual([1, 3]);
    expect(context.selectedCommitIndex).toBe(3); // Auto-corrected to last filtered commit
    expect(context.selectedFilteredCommitIndex).toBe(1);

    // Case 4: Filter out all commits
    await utils.actAsync(() => context.setMinCommitDuration(1000)); // Very high threshold

    // No commits should pass filter
    expect(context.filteredCommitIndices).toEqual([]);
    expect(context.selectedCommitIndex).toBe(null); // Should be null when no commits
    expect(context.selectedFilteredCommitIndex).toBe(null);
  });
});
