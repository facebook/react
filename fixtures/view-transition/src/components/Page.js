import React, {
  addTransitionType,
  ViewTransition,
  Activity,
  useLayoutEffect,
  useEffect,
  useState,
  useId,
  useOptimistic,
  startTransition,
  Suspense,
} from 'react';

import {createPortal} from 'react-dom';

import SwipeRecognizer from './SwipeRecognizer.js';

import './Page.css';

import transitions from './Transitions.module.css';
import NestedReveal from './NestedReveal.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
      default={
        transitions['enter-slide-right'] + ' ' + transitions['exit-slide-left']
      }>
      <p className="roboto-font">Slide In from Left, Slide Out to Right</p>
      <p>
        <img
          src="https://react.dev/_next/image?url=%2Fimages%2Fteam%2Fsebmarkbage.jpg&w=3840&q=75"
          width="400"
          height="248"
        />
      </p>
    </ViewTransition>
  );
}

function Id() {
  // This is just testing that Id inside a ViewTransition can hydrate correctly.
  return <span id={useId()} />;
}

let wait;
function Suspend() {
  if (!wait) wait = sleep(500);
  return React.use(wait);
}

export default function Page({url, navigate}) {
  const [renderedUrl, optimisticNavigate] = useOptimistic(
    url,
    (state, direction) => {
      return direction === 'left' ? '/?a' : '/?b';
    }
  );
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

  useLayoutEffect(() => {
    // Calling a default update should not interrupt ViewTransitions but
    // a flushSync will.
    // Promise.resolve().then(() => {
    //   flushSync(() => {
    // setCounter(c => c + 10);
    //  });
    // });
  }, [show]);

  const [showModal, setShowModal] = useState(false);
  const portal = showModal ? (
    createPortal(
      <div className="portal">
        Portal: {!show ? 'A' : 'B'}
        <ViewTransition>
          <div>{!show ? 'A' : 'B'}</div>
        </ViewTransition>
      </div>,
      document.body
    )
  ) : (
    <button
      onClick={() =>
        startTransition(async () => {
          await sleep(2000);
          setShowModal(true);
        })
      }>
      Show Modal
    </button>
  );

  const exclamation = (
    <ViewTransition name="exclamation" onShare={onTransition}>
      <span>
        <div>!</div>
      </span>
    </ViewTransition>
  );
  return (
    <div className="swipe-recognizer">
      <SwipeRecognizer
        action={swipeAction}
        gesture={direction => {
          addTransitionType(
            direction === 'left' ? 'navigation-forward' : 'navigation-back'
          );
          optimisticNavigate(direction);
        }}
        direction={show ? 'left' : 'right'}>
        <button
          className="button"
          onClick={() => {
            navigate(url === '/?b' ? '/?a' : '/?b');
          }}>
          {url === '/?b' ? 'Goto A' : 'Goto B'}
        </button>
        <ViewTransition default="none">
          <div>
            <ViewTransition>
              <div>
                <ViewTransition default={transitions['slide-on-nav']}>
                  <h1>{!show ? 'A' : 'B' + counter}</h1>
                </ViewTransition>
              </div>
            </ViewTransition>
            <ViewTransition
              default={{
                'navigation-back': transitions['slide-right'],
                'navigation-forward': transitions['slide-left'],
              }}>
              <h1>{!show ? 'A' + counter : 'B'}</h1>
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
              {show ? (
                <div>hello{exclamation}</div>
              ) : (
                <section>Loading</section>
              )}
            </ViewTransition>
            <p>
              <Id />
            </p>
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
            <Suspense
              fallback={
                <ViewTransition>
                  <div>
                    <ViewTransition name="shared-reveal">
                      <h2>█████</h2>
                    </ViewTransition>
                    <p>████</p>
                    <p>███████</p>
                    <p>████</p>
                    <p>██</p>
                    <p>██████</p>
                    <p>███</p>
                    <p>████</p>
                  </div>
                </ViewTransition>
              }>
              <ViewTransition>
                <div>
                  <p>these</p>
                  <p>rows</p>
                  <ViewTransition name="shared-reveal">
                    <h2>exist</h2>
                  </ViewTransition>
                  <p>to</p>
                  <p>test</p>
                  <p>scrolling</p>
                  <p>content</p>
                  <p>out</p>
                  <p>of</p>
                  {portal}
                  <p>the</p>
                  <p>viewport</p>
                  <Suspend />
                </div>
              </ViewTransition>
              {show ? <Component /> : null}
            </Suspense>
          </div>
        </ViewTransition>
      </SwipeRecognizer>
      <NestedReveal />
    </div>
  );
}
