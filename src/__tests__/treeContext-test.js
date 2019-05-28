// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';
import type {
  DispatcherContext,
  StateContext,
} from 'src/devtools/views/Components/TreeContext';

describe('TreeListContext', () => {
  let React;
  let ReactDOM;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let utils;

  let BridgeContext;
  let StoreContext;
  let TreeContext;

  let dispatch: DispatcherContext;
  let state: StateContext;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    TestRenderer = utils.requireTestRenderer();

    BridgeContext = require('src/devtools/views/context').BridgeContext;
    StoreContext = require('src/devtools/views/context').StoreContext;
    TreeContext = require('src/devtools/views/Components/TreeContext');
  });

  afterEach(() => {
    // Reset between tests
    dispatch = ((null: any): DispatcherContext);
    state = ((null: any): StateContext);
  });

  const Capture = () => {
    dispatch = React.useContext(TreeContext.TreeDispatcherContext);
    state = React.useContext(TreeContext.TreeStateContext);
    return null;
  };

  const Contexts = () => {
    return (
      <BridgeContext.Provider value={bridge}>
        <StoreContext.Provider value={store}>
          <TreeContext.TreeContextController>
            <Capture />
          </TreeContext.TreeContextController>
        </StoreContext.Provider>
      </BridgeContext.Provider>
    );
  };

  describe('tree state', () => {
    it('should select the next and previous elements in the tree', () => {
      const Grandparent = () => <Parent />;
      const Parent = () => (
        <React.Fragment>
          <Child />
          <Child />
        </React.Fragment>
      );
      const Child = () => null;

      utils.act(() =>
        ReactDOM.render(<Grandparent />, document.createElement('div'))
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      utils.act(() => dispatch({ type: 'SELECT_NEXT_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: select first element');

      while (
        state.selectedElementIndex !== null &&
        state.selectedElementIndex < store.numElements - 1
      ) {
        const index = ((state.selectedElementIndex: any): number);
        utils.act(() => dispatch({ type: 'SELECT_NEXT_ELEMENT_IN_TREE' }));
        utils.act(() => renderer.update(<Contexts />));
        expect(state).toMatchSnapshot(`3: select element after (${index})`);
      }

      while (
        state.selectedElementIndex !== null &&
        state.selectedElementIndex > 0
      ) {
        const index = ((state.selectedElementIndex: any): number);
        utils.act(() => dispatch({ type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE' }));
        utils.act(() => renderer.update(<Contexts />));
        expect(state).toMatchSnapshot(`4: select element before (${index})`);
      }

      utils.act(() => dispatch({ type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('5: select previous wraps around to last');

      utils.act(() => dispatch({ type: 'SELECT_NEXT_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('6: select next wraps around to first');
    });

    it('should select child elements', () => {
      const Grandparent = () => (
        <React.Fragment>
          <Parent />
          <Parent />
        </React.Fragment>
      );
      const Parent = () => (
        <React.Fragment>
          <Child />
          <Child />
        </React.Fragment>
      );
      const Child = () => null;

      utils.act(() =>
        ReactDOM.render(<Grandparent />, document.createElement('div'))
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      utils.act(() =>
        dispatch({ type: 'SELECT_ELEMENT_AT_INDEX', payload: 0 })
      );
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: select first element');

      utils.act(() => dispatch({ type: 'SELECT_CHILD_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('3: select Parent');

      utils.act(() => dispatch({ type: 'SELECT_CHILD_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('4: select Child');

      const previousState = state;

      // There are no more children to select, so this should be a no-op
      utils.act(() => dispatch({ type: 'SELECT_CHILD_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toEqual(previousState);
    });

    it('should select parent elements and then collapse', () => {
      const Grandparent = () => (
        <React.Fragment>
          <Parent />
          <Parent />
        </React.Fragment>
      );
      const Parent = () => (
        <React.Fragment>
          <Child />
          <Child />
        </React.Fragment>
      );
      const Child = () => null;

      utils.act(() =>
        ReactDOM.render(<Grandparent />, document.createElement('div'))
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      const lastChildID = store.getElementIDAtIndex(store.numElements - 1);

      utils.act(() =>
        dispatch({ type: 'SELECT_ELEMENT_BY_ID', payload: lastChildID })
      );
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: select last child');

      utils.act(() => dispatch({ type: 'SELECT_PARENT_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('3: select Parent');

      utils.act(() => dispatch({ type: 'SELECT_PARENT_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('4: select Grandparent');

      const previousState = state;

      // There are no more ancestors to select, so this should be a no-op
      utils.act(() => dispatch({ type: 'SELECT_PARENT_ELEMENT_IN_TREE' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toEqual(previousState);
    });

    it('should clear selection if the selected element is unmounted', async done => {
      const Grandparent = props => props.children || null;
      const Parent = props => props.children || null;
      const Child = () => null;

      const container = document.createElement('div');
      utils.act(() =>
        ReactDOM.render(
          <Grandparent>
            <Parent>
              <Child />
              <Child />
            </Parent>
          </Grandparent>,
          container
        )
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      utils.act(() =>
        dispatch({ type: 'SELECT_ELEMENT_AT_INDEX', payload: 3 })
      );
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: select second child');

      await utils.actAsync(() =>
        ReactDOM.render(
          <Grandparent>
            <Parent />
          </Grandparent>,
          container
        )
      );
      expect(state).toMatchSnapshot(
        '3: remove children (parent should now be selected)'
      );

      await utils.actAsync(() => ReactDOM.unmountComponentAtNode(container));
      expect(state).toMatchSnapshot(
        '4: unmount root (nothing should be selected)'
      );

      done();
    });
  });

  describe('search state', () => {
    it('should find elements matching search text', () => {
      const Foo = () => null;
      const Bar = () => null;
      const Baz = () => null;

      utils.act(() =>
        ReactDOM.render(
          <React.Fragment>
            <Foo />
            <Bar />
            <Baz />
          </React.Fragment>,
          document.createElement('div')
        )
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      utils.act(() => dispatch({ type: 'SET_SEARCH_TEXT', payload: 'ba' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: search for "ba"');

      utils.act(() => dispatch({ type: 'SET_SEARCH_TEXT', payload: 'f' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('3: search for "f"');

      utils.act(() => dispatch({ type: 'SET_SEARCH_TEXT', payload: 'q' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('4: search for "q"');
    });

    it('should select the next and previous items within the search results', () => {
      const Foo = () => null;
      const Bar = () => null;
      const Baz = () => null;

      utils.act(() =>
        ReactDOM.render(
          <React.Fragment>
            <Foo />
            <Baz />
            <Bar />
            <Baz />
          </React.Fragment>,
          document.createElement('div')
        )
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      utils.act(() => dispatch({ type: 'SET_SEARCH_TEXT', payload: 'ba' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: search for "ba"');

      utils.act(() => dispatch({ type: 'GO_TO_NEXT_SEARCH_RESULT' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('3: go to second result');

      utils.act(() => dispatch({ type: 'GO_TO_NEXT_SEARCH_RESULT' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('4: go to third result');

      utils.act(() => dispatch({ type: 'GO_TO_PREVIOUS_SEARCH_RESULT' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('5: go to second result');

      utils.act(() => dispatch({ type: 'GO_TO_PREVIOUS_SEARCH_RESULT' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('6: go to first result');

      utils.act(() => dispatch({ type: 'GO_TO_PREVIOUS_SEARCH_RESULT' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('7: wrap to last result');

      utils.act(() => dispatch({ type: 'GO_TO_NEXT_SEARCH_RESULT' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('8: wrap to first result');
    });

    it('should add newly mounted elements to the search results set if they match the current text', async done => {
      const Foo = () => null;
      const Bar = () => null;
      const Baz = () => null;

      const container = document.createElement('div');

      utils.act(() =>
        ReactDOM.render(
          <React.Fragment>
            <Foo />
            <Bar />
          </React.Fragment>,
          container
        )
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      utils.act(() => dispatch({ type: 'SET_SEARCH_TEXT', payload: 'ba' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: search for "ba"');

      await utils.actAsync(() =>
        ReactDOM.render(
          <React.Fragment>
            <Foo />
            <Bar />
            <Baz />
          </React.Fragment>,
          container
        )
      );
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('3: mount Baz');

      done();
    });

    it('should remove unmounted elements from the search results set', async done => {
      const Foo = () => null;
      const Bar = () => null;
      const Baz = () => null;

      const container = document.createElement('div');

      utils.act(() =>
        ReactDOM.render(
          <React.Fragment>
            <Foo />
            <Bar />
            <Baz />
          </React.Fragment>,
          container
        )
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      utils.act(() => dispatch({ type: 'SET_SEARCH_TEXT', payload: 'ba' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: search for "ba"');

      utils.act(() => dispatch({ type: 'GO_TO_NEXT_SEARCH_RESULT' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('3: go to second result');

      await utils.actAsync(() =>
        ReactDOM.render(
          <React.Fragment>
            <Foo />
            <Bar />
          </React.Fragment>,
          container
        )
      );
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('4: unmount Baz');

      done();
    });
  });

  describe('owners state', () => {
    it('should support entering and existing the owners tree view', () => {
      const Grandparent = () => <Parent />;
      const Parent = () => (
        <React.Fragment>
          <Child />
          <Child />
        </React.Fragment>
      );
      const Child = () => null;

      utils.act(() =>
        ReactDOM.render(<Grandparent />, document.createElement('div'))
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      let parentID = ((store.getElementIDAtIndex(1): any): number);
      utils.act(() => dispatch({ type: 'SELECT_OWNER', payload: parentID }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: parent owners tree');

      utils.act(() => dispatch({ type: 'RESET_OWNER_STACK' }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('3: final state');
    });

    it('should remove an element from the owners list if it is unmounted', async done => {
      const Grandparent = ({ count }) => <Parent count={count} />;
      const Parent = ({ count }) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => null;

      const container = document.createElement('div');
      utils.act(() => ReactDOM.render(<Grandparent count={2} />, container));

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      let parentID = ((store.getElementIDAtIndex(1): any): number);
      utils.act(() => dispatch({ type: 'SELECT_OWNER', payload: parentID }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: parent owners tree');

      await utils.actAsync(() =>
        ReactDOM.render(<Grandparent count={1} />, container)
      );
      expect(state).toMatchSnapshot('3: remove second child');

      await utils.actAsync(() =>
        ReactDOM.render(<Grandparent count={0} />, container)
      );
      expect(state).toMatchSnapshot('4: remove first child');

      done();
    });

    it('should exit the owners list if the current owner is unmounted', async done => {
      const Parent = props => props.children || null;
      const Child = () => null;

      const container = document.createElement('div');
      utils.act(() =>
        ReactDOM.render(
          <Parent>
            <Child />
          </Parent>,
          container
        )
      );

      expect(store).toMatchSnapshot('0: mount');

      let renderer;
      utils.act(() => (renderer = TestRenderer.create(<Contexts />)));
      expect(state).toMatchSnapshot('1: initial state');

      let childID = ((store.getElementIDAtIndex(1): any): number);
      utils.act(() => dispatch({ type: 'SELECT_OWNER', payload: childID }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('2: child owners tree');

      await utils.actAsync(() => ReactDOM.render(<Parent />, container));
      expect(state).toMatchSnapshot('3: remove child');

      let parentID = ((store.getElementIDAtIndex(0): any): number);
      utils.act(() => dispatch({ type: 'SELECT_OWNER', payload: parentID }));
      utils.act(() => renderer.update(<Contexts />));
      expect(state).toMatchSnapshot('4: parent owners tree');

      await utils.actAsync(() => ReactDOM.unmountComponentAtNode(container));
      expect(state).toMatchSnapshot('5: unmount root');

      done();
    });
  });
});
