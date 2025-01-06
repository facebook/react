import React, {
  unstable_ViewTransition as ViewTransition,
  startTransition,
  useEffect,
  useState,
  unstable_Activity as Activity,
} from 'react';

import './Page.css';

const a = (
  <div key="a">
    <ViewTransition group="normal">
      <div>a</div>
    </ViewTransition>
  </div>
);

const b = (
  <div key="b">
    <ViewTransition group="normal">
      <div>b</div>
    </ViewTransition>
  </div>
);

export default function Page() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    startTransition(() => {
      setShow(true);
    });
  }, []);
  const exclamation = (
    <ViewTransition name="exclamation" group="normal">
      <span>!</span>
    </ViewTransition>
  );
  return (
    <div>
      <button
        onClick={() => {
          startTransition(() => {
            setShow(show => !show);
          });
        }}>
        {show ? 'A' : 'B'}
      </button>
      {show ? (
        <div>
          {a}
          {b}
        </div>
      ) : (
        <div>
          {b}
          {a}
        </div>
      )}
      <ViewTransition group="normal">
        {show ? <div>hello{exclamation}</div> : <section>Loading</section>}
      </ViewTransition>
      {show ? null : (
        <ViewTransition group="normal">
          <div>world{exclamation}</div>
        </ViewTransition>
      )}
      <Activity mode={show ? 'visible' : 'hidden'}>
        <ViewTransition group="normal">
          <div>!!</div>
        </ViewTransition>
      </Activity>
    </div>
  );
}
