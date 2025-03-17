import React, {
  unstable_ViewTransition as ViewTransition,
  unstable_Activity as Activity,
  unstable_useSwipeTransition as useSwipeTransition,
  useEffect,
  useState,
  useId,
} from 'react';

import SwipeRecognizer from './SwipeRecognizer';

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

function Id() {
  // This is just testing that Id inside a ViewTransition can hydrate correctly.
  return <span id={useId()} />;
}

export default function Page({url, navigate}) {
  const [renderedUrl, startGesture] = useSwipeTransition('/?a', url, '/?b');
  const show = renderedUrl === '/?b';
  function onTransition(viewTransition, types) {
    const keyframes = [
      {rotate: '0deg', transformOrigin: '30px 8px'},
      {rotate: '360deg', transformOrigin: '30px 8px'},
    ];
    viewTransition.old.animate(keyframes, 250);
    viewTransition.new.animate(keyframes, 250);
  }

  function swipeAction() {
    navigate(show ? '/?a' : '/?b');
  }

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCounter(c => c + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const exclamation = (
    <ViewTransition name="exclamation" onShare={onTransition}>
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
      <ViewTransition className="none">
        <div>
          <ViewTransition>
            <div>
              <ViewTransition className={transitions['slide-on-nav']}>
                <h1>{!show ? 'A' : 'B'}</h1>
              </ViewTransition>
            </div>
          </ViewTransition>
          <ViewTransition
            className={{
              'navigation-back': transitions['slide-right'],
              'navigation-forward': transitions['slide-left'],
            }}>
            <h1>{!show ? 'A' + counter : 'B' + counter}</h1>
          </ViewTransition>
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
          <p>scroll me</p>
          <p>
            <Id />
          </p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <div className="swipe-recognizer">
            <SwipeRecognizer
              action={swipeAction}
              gesture={startGesture}
              direction={show ? 'left' : 'right'}>
              Swipe me
            </SwipeRecognizer>
          </div>
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
          {show ? <Component /> : null}
        </div>
      </ViewTransition>
    </div>
  );
}
