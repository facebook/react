/** @flow */

import React, {Fragment, useEffect, useRef, useState} from 'react';

function WarnDuringRender() {
  console.warn('This warning fires during every render');
  return null;
}

function WarnOnMount() {
  useEffect(() => {
    console.warn('This warning fires on initial mount only');
  }, []);
  return null;
}

function WarnOnUpdate() {
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) {
      console.warn('This warning fires on every update');
    } else {
      didMountRef.current = true;
    }
  });
  return null;
}

function WarnOnUnmount() {
  useEffect(() => {
    return () => {
      console.warn('This warning fires on unmount');
    };
  }, []);
  return null;
}

export default function ElementTypes() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount(count + 1);
  return (
    <Fragment>
      <h1>Inline warnings</h1>
      <button onClick={handleClick}>Update {count > 0 ? count : ''}</button>
      <WarnDuringRender />
      <WarnOnMount />
      <WarnOnUpdate />
      {count === 0 ? <WarnOnUnmount /> : null}
    </Fragment>
  );
}
