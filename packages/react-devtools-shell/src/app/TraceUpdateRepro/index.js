import * as React from 'react';
import {useEffect, useRef, useState} from 'react';

function ShouldReRender() {
  // Used just to trigger the re-render
  const [, setCount] = useState(0);

  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(value => value + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [setCount]);

  return <p>Should re-render count: {renders.current}x</p>;
}

function ShouldNotReRender() {
  const renders = useRef(0);
  renders.current += 1;
  return <p>Should not re-render count: {renders.current}x</p>;
}

export default function TraceUpdateRepro() {
  return (
    <>
      <ShouldReRender />

      {/* This one isn't highlighted... */}
      <ShouldNotReRender />

      {/* These ones are highlighted. I wonder if there is some sort of tree depth check?*/}
      <div>
        <ShouldNotReRender />
      </div>
      <div>
        <div>
          <ShouldNotReRender />
        </div>
      </div>
    </>
  );
}
