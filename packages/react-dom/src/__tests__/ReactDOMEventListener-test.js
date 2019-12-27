/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMEventListener', () => {
  let React;
  let ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should dispatch events from outside React tree', () => {
    const mock = jest.fn();

    const container = document.createElement('div');
    const node = ReactDOM.render(<div onMouseEnter={mock} />, container);
    const otherNode = document.createElement('h1');
    document.body.appendChild(container);
    document.body.appendChild(otherNode);

    try {
      otherNode.dispatchEvent(
        new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
          relatedTarget: node,
        }),
      );
      expect(mock).toBeCalled();
    } finally {
      document.body.removeChild(container);
      document.body.removeChild(otherNode);
    }
  });

  describe('Propagation', () => {
    it('should propagate events one level down', () => {
      const mouseOut = jest.fn();
      const onMouseOut = event => mouseOut(event.currentTarget);

      const childContainer = document.createElement('div');
      const parentContainer = document.createElement('div');
      const childNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Child</div>,
        childContainer,
      );
      const parentNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>div</div>,
        parentContainer,
      );
      parentNode.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      try {
        const nativeEvent = document.createEvent('Event');
        nativeEvent.initEvent('mouseout', true, true);
        childNode.dispatchEvent(nativeEvent);

        expect(mouseOut).toBeCalled();
        expect(mouseOut).toHaveBeenCalledTimes(2);
        expect(mouseOut.mock.calls[0][0]).toEqual(childNode);
        expect(mouseOut.mock.calls[1][0]).toEqual(parentNode);
      } finally {
        document.body.removeChild(parentContainer);
      }
    });

    it('should propagate events two levels down', () => {
      const mouseOut = jest.fn();
      const onMouseOut = event => mouseOut(event.currentTarget);

      const childContainer = document.createElement('div');
      const parentContainer = document.createElement('div');
      const grandParentContainer = document.createElement('div');
      const childNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Child</div>,
        childContainer,
      );
      const parentNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Parent</div>,
        parentContainer,
      );
      const grandParentNode = ReactDOM.render(
        <div onMouseOut={onMouseOut}>Parent</div>,
        grandParentContainer,
      );
      parentNode.appendChild(childContainer);
      grandParentNode.appendChild(parentContainer);

      document.body.appendChild(grandParentContainer);

      try {
        const nativeEvent = document.createEvent('Event');
        nativeEvent.initEvent('mouseout', true, true);
        childNode.dispatchEvent(nativeEvent);

        expect(mouseOut).toBeCalled();
        expect(mouseOut).toHaveBeenCalledTimes(3);
        expect(mouseOut.mock.calls[0][0]).toEqual(childNode);
        expect(mouseOut.mock.calls[1][0]).toEqual(parentNode);
        expect(mouseOut.mock.calls[2][0]).toEqual(grandParentNode);
      } finally {
        document.body.removeChild(grandParentContainer);
      }
    });

    // Regression test for https://github.com/facebook/react/issues/1105
    it('should not get confused by disappearing elements', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      try {
        class MyComponent extends React.Component {
          state = {clicked: false};
          handleClick = () => {
            this.setState({clicked: true});
          };
          componentDidMount() {
            expect(ReactDOM.findDOMNode(this)).toBe(container.firstChild);
          }
          componentDidUpdate() {
            expect(ReactDOM.findDOMNode(this)).toBe(container.firstChild);
          }
          render() {
            if (this.state.clicked) {
              return <span>clicked!</span>;
            } else {
              return (
                <button onClick={this.handleClick}>not yet clicked</button>
              );
            }
          }
        }
        ReactDOM.render(<MyComponent />, container);
        container.firstChild.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
          }),
        );
        expect(container.firstChild.textContent).toBe('clicked!');
      } finally {
        document.body.removeChild(container);
      }
    });

    it('should batch between handlers from different roots', () => {
      const mock = jest.fn();

      const childContainer = document.createElement('div');
      const handleChildMouseOut = () => {
        ReactDOM.render(<div>1</div>, childContainer);
        mock(childNode.textContent);
      };

      const parentContainer = document.createElement('div');
      const handleParentMouseOut = () => {
        ReactDOM.render(<div>2</div>, childContainer);
        mock(childNode.textContent);
      };

      const childNode = ReactDOM.render(
        <div onMouseOut={handleChildMouseOut}>Child</div>,
        childContainer,
      );
      const parentNode = ReactDOM.render(
        <div onMouseOut={handleParentMouseOut}>Parent</div>,
        parentContainer,
      );
      parentNode.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      try {
        const nativeEvent = document.createEvent('Event');
        nativeEvent.initEvent('mouseout', true, true);
        childNode.dispatchEvent(nativeEvent);

        // Child and parent should both call from event handlers.
        expect(mock).toHaveBeenCalledTimes(2);
        // The first call schedules a render of '1' into the 'Child'.
        // However, we're batching so it isn't flushed yet.
        expect(mock.mock.calls[0][0]).toBe('Child');
        // The first call schedules a render of '2' into the 'Child'.
        // We're still batching so it isn't flushed yet either.
        expect(mock.mock.calls[1][0]).toBe('Child');
        // By the time we leave the handler, the second update is flushed.
        expect(childNode.textContent).toBe('2');
      } finally {
        document.body.removeChild(parentContainer);
      }
    });
  });

  it('should not fire duplicate events for a React DOM tree', () => {
    const mouseOut = jest.fn();
    const onMouseOut = event => mouseOut(event.target);

    class Wrapper extends React.Component {
      getInner = () => {
        return this.refs.inner;
      };

      render() {
        const inner = <div ref="inner">Inner</div>;
        return (
          <div>
            <div onMouseOut={onMouseOut} id="outer">
              {inner}
            </div>
          </div>
        );
      }
    }

    const container = document.createElement('div');
    const instance = ReactDOM.render(<Wrapper />, container);

    document.body.appendChild(container);

    try {
      const nativeEvent = document.createEvent('Event');
      nativeEvent.initEvent('mouseout', true, true);
      instance.getInner().dispatchEvent(nativeEvent);

      expect(mouseOut).toBeCalled();
      expect(mouseOut).toHaveBeenCalledTimes(1);
      expect(mouseOut.mock.calls[0][0]).toEqual(instance.getInner());
    } finally {
      document.body.removeChild(container);
    }
  });

  // Regression test for https://github.com/facebook/react/pull/12877
  it('should not fire form events twice', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const formRef = React.createRef();
    const inputRef = React.createRef();

    const handleInvalid = jest.fn();
    const handleReset = jest.fn();
    const handleSubmit = jest.fn();
    ReactDOM.render(
      <form ref={formRef} onReset={handleReset} onSubmit={handleSubmit}>
        <input ref={inputRef} onInvalid={handleInvalid} />
      </form>,
      container,
    );

    inputRef.current.dispatchEvent(
      new Event('invalid', {
        // https://developer.mozilla.org/en-US/docs/Web/Events/invalid
        bubbles: false,
      }),
    );
    expect(handleInvalid).toHaveBeenCalledTimes(1);

    formRef.current.dispatchEvent(
      new Event('reset', {
        // https://developer.mozilla.org/en-US/docs/Web/Events/reset
        bubbles: true,
      }),
    );
    expect(handleReset).toHaveBeenCalledTimes(1);

    formRef.current.dispatchEvent(
      new Event('submit', {
        // https://developer.mozilla.org/en-US/docs/Web/Events/submit
        bubbles: true,
      }),
    );
    expect(handleSubmit).toHaveBeenCalledTimes(1);

    formRef.current.dispatchEvent(
      new Event('submit', {
        // Might happen on older browsers.
        bubbles: true,
      }),
    );
    expect(handleSubmit).toHaveBeenCalledTimes(2); // It already fired in this test.

    document.body.removeChild(container);
  });

  // This is a special case for submit and reset events as they are listened on
  // at the element level and not the document.
  // @see https://github.com/facebook/react/pull/13462
  it('should not receive submit events if native, interim DOM handler prevents it', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const formRef = React.createRef();
      const interimRef = React.createRef();

      const handleSubmit = jest.fn();
      const handleReset = jest.fn();
      ReactDOM.render(
        <div ref={interimRef}>
          <form ref={formRef} onSubmit={handleSubmit} onReset={handleReset} />
        </div>,
        container,
      );

      interimRef.current.onsubmit = nativeEvent =>
        nativeEvent.stopPropagation();
      interimRef.current.onreset = nativeEvent => nativeEvent.stopPropagation();

      formRef.current.dispatchEvent(
        new Event('submit', {
          // https://developer.mozilla.org/en-US/docs/Web/Events/submit
          bubbles: true,
        }),
      );

      formRef.current.dispatchEvent(
        new Event('reset', {
          // https://developer.mozilla.org/en-US/docs/Web/Events/reset
          bubbles: true,
        }),
      );

      expect(handleSubmit).toHaveBeenCalled();
      expect(handleReset).toHaveBeenCalled();
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should dispatch loadstart only for media elements', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const imgRef = React.createRef();
      const videoRef = React.createRef();

      const handleImgLoadStart = jest.fn();
      const handleVideoLoadStart = jest.fn();
      ReactDOM.render(
        <div>
          <img ref={imgRef} onLoadStart={handleImgLoadStart} />
          <video ref={videoRef} onLoadStart={handleVideoLoadStart} />
        </div>,
        container,
      );

      // Note for debugging: loadstart currently doesn't fire in Chrome.
      // https://bugs.chromium.org/p/chromium/issues/detail?id=458851
      imgRef.current.dispatchEvent(
        new ProgressEvent('loadstart', {
          bubbles: false,
        }),
      );
      // Historically, we happened to not support onLoadStart
      // on <img>, and this test documents that lack of support.
      // If we decide to support it in the future, we should change
      // this line to expect 1 call. Note that fixing this would
      // be simple but would require attaching a handler to each
      // <img>. So far nobody asked us for it.
      expect(handleImgLoadStart).toHaveBeenCalledTimes(0);

      videoRef.current.dispatchEvent(
        new ProgressEvent('loadstart', {
          bubbles: false,
        }),
      );
      expect(handleVideoLoadStart).toHaveBeenCalledTimes(1);
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should not attempt to listen to unnecessary events on the top level', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const videoRef = React.createRef();
    const handleVideoPlay = jest.fn(); // We'll test this one.
    const mediaEvents = {
      onAbort() {},
      onCanPlay() {},
      onCanPlayThrough() {},
      onDurationChange() {},
      onEmptied() {},
      onEncrypted() {},
      onEnded() {},
      onError() {},
      onLoadedData() {},
      onLoadedMetadata() {},
      onLoadStart() {},
      onPause() {},
      onPlay() {},
      onPlaying() {},
      onProgress() {},
      onRateChange() {},
      onSeeked() {},
      onSeeking() {},
      onStalled() {},
      onSuspend() {},
      onTimeUpdate() {},
      onVolumeChange() {},
      onWaiting() {},
    };

    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type) {
      throw new Error(
        `Did not expect to add a top-level listener for the "${type}" event.`,
      );
    };

    try {
      // We expect that mounting this tree will
      // *not* attach handlers for any top-level events.
      ReactDOM.render(
        <div>
          <video ref={videoRef} {...mediaEvents} onPlay={handleVideoPlay} />
          <audio {...mediaEvents}>
            <source {...mediaEvents} />
          </audio>
          <form onReset={() => {}} onSubmit={() => {}} />
        </div>,
        container,
      );

      // Also verify dispatching one of them works
      videoRef.current.dispatchEvent(
        new Event('play', {
          bubbles: false,
        }),
      );
      expect(handleVideoPlay).toHaveBeenCalledTimes(1);
    } finally {
      document.addEventListener = originalAddEventListener;
      document.body.removeChild(container);
    }
  });

  it('should dispatch load for embed elements', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ref = React.createRef();
      const handleLoad = jest.fn();

      ReactDOM.render(
        <div>
          <embed ref={ref} onLoad={handleLoad} />
        </div>,
        container,
      );

      ref.current.dispatchEvent(
        new ProgressEvent('load', {
          bubbles: false,
        }),
      );

      expect(handleLoad).toHaveBeenCalledTimes(1);
    } finally {
      document.body.removeChild(container);
    }
  });
});
