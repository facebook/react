import React, {
  unstable_ViewTransition as ViewTransition,
  unstable_Activity as Activity,
  unstable_useSwipeTransition as useSwipeTransition,
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

  const swipeRecognizer = useRef(null);
  const activeGesture = useRef(null);
  function onScroll() {
    if (activeGesture.current !== null) {
      return;
    }
    // eslint-disable-next-line no-undef
    const scrollTimeline = new ScrollTimeline({
      source: swipeRecognizer.current,
      axis: 'x',
    });
    activeGesture.current = startGesture(scrollTimeline);
  }
  function onScrollEnd() {
    if (activeGesture.current !== null) {
      const cancelGesture = activeGesture.current;
      activeGesture.current = null;
      cancelGesture();
    }
  }

  useLayoutEffect(() => {
    swipeRecognizer.current.scrollLeft = show ? 0 : 10000;
  }, [show]);

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
          <ViewTransition className={transitions['slide-on-nav']}>
            <h1>{!show ? 'A' : 'B'}</h1>
          </ViewTransition>
          <ViewTransition
            className={{
              'navigation-back': transitions['slide-right'],
              'navigation-forward': transitions['slide-left'],
            }}>
            <h1>{!show ? 'A' : 'B'}</h1>
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
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <p></p>
          <div
            className="swipe-recognizer"
            onScroll={onScroll}
            onScrollEnd={onScrollEnd}
            ref={swipeRecognizer}>
            <div className="swipe-overscroll">Swipe me</div>
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
