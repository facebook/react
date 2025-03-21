import TestCase from '../../TestCase';
import Fixture from '../../Fixture';

const React = window.React;
const {Fragment, useRef, useState} = React;

function WrapperComponent(props) {
  return props.children;
}

function handler(e) {
  const text = e.currentTarget.innerText;
  alert('You clicked: ' + text);
}

const initialState = {
  child: false,
  parent: false,
  grandparent: false,
};

export default function EventListenerCase() {
  const fragmentRef = useRef(null);
  const [clickedState, setClickedState] = useState({...initialState});

  return (
    <TestCase title="Event Dispatch">
      <TestCase.Steps>
        <li>
          Each div has regular click handlers, you can click each one to observe
          the status changing
        </li>
        <li>Clear the clicked state</li>
        <li>
          Click the "Dispatch click event" button to dispatch a click event on
          the Fragment
        </li>
      </TestCase.Steps>

      <TestCase.ExpectedResult>
        Dispatching an event on a Fragment will forward the dispatch to its
        parent. You can observe when dispatching that the parent handler is
        called in additional to bubbling from there. A delay is added to make
        the bubbling more clear.
      </TestCase.ExpectedResult>

      <Fixture>
        <Fixture.Controls>
          <button
            onClick={() => {
              fragmentRef.current.dispatchEvent(
                new MouseEvent('click', {bubbles: true})
              );
            }}>
            Dispatch click event
          </button>
          <button
            onClick={() => {
              setClickedState({...initialState});
            }}>
            Reset clicked state
          </button>
        </Fixture.Controls>
        <div
          onClick={() => {
            setTimeout(() => {
              setClickedState(prev => ({...prev, grandparent: true}));
            }, 200);
          }}
          className="card">
          Fragment grandparent - clicked:{' '}
          {clickedState.grandparent ? 'true' : 'false'}
          <div
            onClick={() => {
              setTimeout(() => {
                setClickedState(prev => ({...prev, parent: true}));
              }, 100);
            }}
            className="card">
            Fragment parent - clicked: {clickedState.parent ? 'true' : 'false'}
            <Fragment ref={fragmentRef}>
              <div
                className="card"
                onClick={() => {
                  setClickedState(prev => ({...prev, child: true}));
                }}>
                Fragment child - clicked:{' '}
                {clickedState.child ? 'true' : 'false'}
              </div>
            </Fragment>
          </div>
        </div>
      </Fixture>
    </TestCase>
  );
}
