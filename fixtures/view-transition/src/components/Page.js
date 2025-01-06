import React, {
  unstable_ViewTransition as ViewTransition,
  startTransition,
  useEffect,
  useState,
  unstable_Activity as Activity,
} from 'react';

import './Page.css';

import transitions from './Transitions.module.css';

const a = (
  <div key="a">
    <ViewTransition>
      <div>a</div>
    </ViewTransition>
  </div>
);

const b = (
  <div key="b">
    <ViewTransition>
      <div>b</div>
    </ViewTransition>
  </div>
);

function Component() {
  return (
    <ViewTransition
      className={
        transitions['enter-slide-right'] + ' ' + transitions['exit-slide-left']
      }>
      <p>Slide In from Left, Slide Out to Right</p>
    </ViewTransition>
  );
}

export default function Page() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    startTransition(() => {
      setShow(true);
    });
  }, []);
  const exclamation = (
    <ViewTransition name="exclamation">
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
      <ViewTransition>
        <div>
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
          <ViewTransition>
            {show ? <div>hello{exclamation}</div> : <section>Loading</section>}
          </ViewTransition>
          {show ? null : (
            <ViewTransition>
              <div>world{exclamation}</div>
            </ViewTransition>
          )}
          <Activity mode={show ? 'visible' : 'hidden'}>
            <ViewTransition>
              <div>!!</div>
            </ViewTransition>
          </Activity>
          {show ? <Component /> : <p>&nbsp;</p>}
        </div>
      </ViewTransition>
    </div>
  );
}
