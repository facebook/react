import TestCase from '../../TestCase';
import Fixture from '../../Fixture';

const React = window.React;
const {Fragment, useEffect, useRef, useState} = React;

function WrapperComponent(props) {
  return props.children;
}

function handler(e) {
  const text = e.currentTarget.innerText;
  alert('You clicked: ' + text);
}

export default function EventListenerCase() {
  const fragmentRef = useRef(null);
  const [extraChildCount, setExtraChildCount] = useState(0);

  useEffect(() => {
    fragmentRef.current.addEventListener('click', handler);

    const lastFragmentRefValue = fragmentRef.current;
    return () => {
      lastFragmentRefValue.removeEventListener('click', handler);
    };
  });

  return (
    <TestCase title="Event Registration">
      <TestCase.Steps>
        <li>Click one of the children, observe the alert</li>
        <li>Add a new child, click it, observe the alert</li>
        <li>Remove the event listeners, click a child, observe no alert</li>
        <li>Add the event listeners back, click a child, observe the alert</li>
      </TestCase.Steps>

      <TestCase.ExpectedResult>
        <p>
          Fragment refs can manage event listeners on the first level of host
          children. This page loads with an effect that sets up click event
          hanndlers on each child card. Clicking on a card will show an alert
          with the card's text.
        </p>
        <p>
          New child nodes will also have event listeners applied. Removed nodes
          will have their listeners cleaned up.
        </p>
      </TestCase.ExpectedResult>

      <Fixture>
        <Fixture.Controls>
          <div>Target count: {extraChildCount + 3}</div>
          <button
            onClick={() => {
              setExtraChildCount(prev => prev + 1);
            }}>
            Add Child
          </button>
          <button
            onClick={() => {
              fragmentRef.current.addEventListener('click', handler);
            }}>
            Add click event listeners
          </button>
          <button
            onClick={() => {
              fragmentRef.current.removeEventListener('click', handler);
            }}>
            Remove click event listeners
          </button>
        </Fixture.Controls>
        <div className="card-container">
          <Fragment ref={fragmentRef}>
            <div className="card" id="child-a">
              Child A
            </div>
            <div className="card" id="child-b">
              Child B
            </div>
            <WrapperComponent>
              <div className="card" id="child-c">
                Child C
              </div>
              {Array.from({length: extraChildCount}).map((_, index) => (
                <div className="card" id={'extra-child-' + index} key={index}>
                  Extra Child {index}
                </div>
              ))}
            </WrapperComponent>
          </Fragment>
        </div>
      </Fixture>
    </TestCase>
  );
}
