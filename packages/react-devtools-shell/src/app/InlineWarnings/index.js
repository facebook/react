/** @flow */

import * as React from 'react';
import {Fragment, useEffect, useRef, useState} from 'react';

function WarnDuringRender({children = null}) {
  console.warn('This warning fires during every render');
  return children;
}

function WarnOnMount({children = null}) {
  useEffect(() => {
    console.warn('This warning fires on initial mount only');
  }, []);
  return children;
}

function WarnOnUpdate({children = null}) {
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) {
      console.warn('This warning fires on every update');
    } else {
      didMountRef.current = true;
    }
  });
  return children;
}

function WarnOnUnmount({children = null}) {
  useEffect(() => {
    return () => {
      console.warn('This warning fires on unmount');
    };
  }, []);
  return children;
}

function ErrorDuringRender({children = null}) {
  console.error('This error fires during every render');
  return children;
}

function ErrorOnMount({children = null}) {
  useEffect(() => {
    console.error('This error fires on initial mount only');
  }, []);
  return children;
}

function ErrorOnUpdate({children = null}) {
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) {
      console.error('This error fires on every update');
    } else {
      didMountRef.current = true;
    }
  });
  return children;
}

function ErrorOnUnmount({children = null}) {
  useEffect(() => {
    return () => {
      console.error('This error fires on unmount');
    };
  }, []);
  return children;
}

function ErrorAndWarningDuringRender({children = null}) {
  console.warn('This warning fires during every render');
  console.error('This error fires during every render');
  return children;
}

function ErrorAndWarningOnMount({children = null}) {
  useEffect(() => {
    console.warn('This warning fires on initial mount only');
    console.error('This error fires on initial mount only');
  }, []);
  return children;
}

function ErrorAndWarningOnUpdate({children = null}) {
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) {
      console.warn('This warning fires on every update');
      console.error('This error fires on every update');
    } else {
      didMountRef.current = true;
    }
  });
  return children;
}

function ErrorAndWarningOnUnmount({children = null}) {
  useEffect(() => {
    return () => {
      console.warn('This warning fires on unmount');
      console.error('This error fires on unmount');
    };
  }, []);
  return children;
}

function ReallyLongErrorMessageThatWillCauseTextToBeTruncated({
  children = null,
}) {
  console.error(
    'This error is a really long error message that should cause the text to be truncated in DevTools',
  );
  return children;
}

function ErrorWithMultipleArgs({children = null}) {
  console.error('This error', 'passes console', 4, 'arguments');
  return children;
}

function ErrorWithStringSubstitutions({children = null}) {
  console.error('This error uses "%s" substitutions', 'string');
  return children;
}

function ReactErrorOnHostComponent({children = null}) {
  return <div data-camelCasedAttribute="should-lower-case">{children}</div>;
}

function DuplicateWarningsAndErrors({children = null}) {
  console.warn('this warning is logged twice per render');
  console.warn('this warning is logged twice per render');
  console.error('this error is logged twice per render');
  console.error('this error is logged twice per render');
  return <div data-camelCasedAttribute="should-lower-case">{children}</div>;
}

function MultipleWarningsAndErrors({children = null}) {
  console.warn('this is the first warning logged');
  console.warn('this is the second warning logged');
  console.error('this is the first error logged');
  console.error('this is the second error logged');
  return <div data-camelCasedAttribute="should-lower-case">{children}</div>;
}

function ComponentWithMissingKey({children}) {
  return [<div />];
}

function ComponentWithSymbolWarning() {
  console.warn('this is a symbol', Symbol('foo'));
  console.error('this is a symbol', Symbol.for('bar'));
  return null;
}

export default function ErrorsAndWarnings(): React.Node {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount(count + 1);
  return (
    <Fragment>
      <h1>Inline warnings</h1>
      <button onClick={handleClick}>Update {count > 0 ? count : ''}</button>
      <ComponentWithMissingKey />
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
      <ReactErrorOnHostComponent />
      <ReallyLongErrorMessageThatWillCauseTextToBeTruncated />
      <DuplicateWarningsAndErrors />
      <MultipleWarningsAndErrors />
      <ComponentWithSymbolWarning />
    </Fragment>
  );
}
