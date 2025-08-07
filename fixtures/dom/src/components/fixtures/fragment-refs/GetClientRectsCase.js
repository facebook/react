import TestCase from '../../TestCase';
import Fixture from '../../Fixture';

const React = window.React;
const {Fragment, useEffect, useRef, useState} = React;

export default function GetClientRectsCase() {
  const fragmentRef = useRef(null);
  const [rects, setRects] = useState([]);
  const getRects = () => {
    const rects = fragmentRef.current.getClientRects();
    setRects(rects);
  };

  return (
    <TestCase title="getClientRects">
      <TestCase.Steps>
        <li>
          Click the "Print Rects" button to get the client rects of the
          elements.
        </li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        Calling getClientRects on the fragment instance will return a list of a
        DOMRectList for each child node.
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <button onClick={getRects}>Print Rects</button>
          <div style={{display: 'flex'}}>
            <div
              style={{
                position: 'relative',
                width: '30vw',
                height: '30vh',
                border: '1px solid black',
              }}>
              {rects.map(({x, y, width, height}, index) => {
                const scale = 0.3;

                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      top: y * scale,
                      left: x * scale,
                      width: width * scale,
                      height: height * scale,
                      border: '1px solid red',
                      boxSizing: 'border-box',
                    }}></div>
                );
              })}
            </div>
            <div>
              {rects.map(({x, y, width, height}, index) => {
                return (
                  <div>
                    {index} :: {`{`}x: {x}, y: {y}, width: {width}, height:{' '}
                    {height}
                    {`}`}
                  </div>
                );
              })}
            </div>
          </div>
        </Fixture.Controls>
        <Fragment ref={fragmentRef}>
          <span
            style={{
              width: '300px',
              height: '250px',
              backgroundColor: 'lightblue',
              fontSize: 20,
              border: '1px solid black',
              marginBottom: '10px',
            }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </span>
          <div
            style={{
              width: '150px',
              height: '100px',
              backgroundColor: 'lightgreen',
              border: '1px solid black',
            }}></div>
          <div
            style={{
              width: '500px',
              height: '50px',
              backgroundColor: 'lightpink',
              border: '1px solid black',
            }}></div>
        </Fragment>
      </Fixture>
    </TestCase>
  );
}
