/** @flow */

import * as React from 'react';
import {Fragment, useEffect, useRef, useState} from 'react';

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

function ErrorDuringRender() {
  console.error('This error fires during every render');
  return null;
}

function ErrorOnMount() {
  useEffect(() => {
    console.error('This error fires on initial mount only');
  }, []);
  return null;
}

function ErrorOnUpdate() {
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) {
      console.error('This error fires on every update');
    } else {
      didMountRef.current = true;
    }
  });
  return null;
}

function ErrorOnUnmount() {
  useEffect(() => {
    return () => {
      console.error('This error fires on unmount');
    };
  }, []);
  return null;
}

function ErrorAndWarningDuringRender() {
  console.warn('This warning fires during every render');
  console.error('This error fires during every render');
  return null;
}

function ErrorAndWarningOnMount() {
  useEffect(() => {
    console.warn('This warning fires on initial mount only');
    console.error('This error fires on initial mount only');
  }, []);
  return null;
}

function ErrorAndWarningOnUpdate() {
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) {
      console.warn('This warning fires on every update');
      console.error('This error fires on every update');
    } else {
      didMountRef.current = true;
    }
  });
  return null;
}

function ErrorAndWarningOnUnmount() {
  useEffect(() => {
    return () => {
      console.warn('This warning fires on unmount');
      console.error('This error fires on unmount');
    };
  }, []);
  return null;
}

function ReallyLongErrorMessageThatWillCauseTextToBeTruncated() {
  console.error(
    'This error is a really long error message that should cause the text to be truncated in DevTools',
  );
  return null;
}

function ErrorWithMultipleArgs() {
  console.error('This error', 'passes console', 4, 'arguments');
  return null;
}

function ErrorWithStringSubstitutions() {
  console.error('This error uses %s substitutions', 'string');
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
      {count === 0 ? <WarnOnMount /> : null}
      <ErrorDuringRender />
      <ErrorOnMount />
      <ErrorOnUpdate />
      {count === 0 ? <ErrorOnUnmount /> : null}
      <ErrorAndWarningDuringRender />
      <ErrorAndWarningOnMount />
      <ErrorAndWarningOnUpdate />
      {count === 0 ? <ErrorAndWarningOnUnmount /> : null}
      <ErrorWithMultipleArgs />
      <ErrorWithStringSubstitutions />
      <ReallyLongErrorMessageThatWillCauseTextToBeTruncated />
    </Fragment>
  );
}
