import React, {
  unstable_ViewTransition as ViewTransition,
  unstable_Activity as Activity,
  useRef,
  useLayoutEffect,
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
      <p className="roboto-font">Slide In from Left, Slide Out to Right</p>
    </ViewTransition>
  );
}

export default function Page({url, navigate}) {
  const ref = useRef();
  const show = url === '/?b';
  useLayoutEffect(() => {
    const viewTransition = ref.current;
    requestAnimationFrame(() => {
      const keyframes = [
        {rotate: '0deg', transformOrigin: '30px 8px'},
        {rotate: '360deg', transformOrigin: '30px 8px'},
      ];
      viewTransition.old.animate(keyframes, 300);
      viewTransition.new.animate(keyframes, 300);
    });
  }, [show]);
  const exclamation = (
    <ViewTransition name="exclamation">
      <span>!</span>
    </ViewTransition>
  );
  return (
    <div>
      <button
        onClick={() => {
          navigate(show ? '/?a' : '/?b');
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
          <ViewTransition ref={ref}>
            {show ? <div>hello{exclamation}</div> : <section>Loading</section>}
          </ViewTransition>
          <p>scroll me</p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
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
