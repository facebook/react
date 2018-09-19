import React, {Fragment, PureComponent} from 'react';
import {unstable_createRoot, render} from 'react-dom';
import {unstable_trace as trace} from 'scheduler/tracing';
import {cache} from './cache';
import {
  setFakeRequestTime,
  setPaused,
  setPauseNewRequests,
  setProgressHandler,
} from './api';
import App from './components/App';
import Draggable from 'react-draggable';
import './index.css';

let handleReset;

class Shell extends PureComponent {
  state = {
    iteration: 0,
  };

  componentDidMount() {
    handleReset = this.handleReset;
  }

  handleReset = () =>
    this.setState(prevState => ({
      iteration: prevState.iteration + 1,
    }));

  render() {
    return <App key={this.state.iteration} />;
  }
}

class Debugger extends PureComponent {
  state = {
    iteration: 0,
    strategy: 'async',
    requestTime: 1,
    showDebugger: false,
    pauseNewRequests: false,
    waitTime: 0,
    requests: {},
  };

  componentDidMount() {
    setFakeRequestTime(this.state.requestTime * 1000);
    setProgressHandler(this.handleProgress);
    window.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === '/') {
        this.setState(state => ({
          showDebugger: !state.showDebugger,
        }));
      } else if (e.key.toLowerCase() === 'p') {
        this.togglePauseRequests();
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.requestTime !== this.state.requestTime) {
      setFakeRequestTime(this.state.requestTime * 1000);
    }
  }

  handleReset = () => {
    trace('Clear cache', () => {
      cache.invalidate();
      this.setState(state => ({
        requests: {},
      }));
      handleReset();
    });
  };

  handleProgress = (url, progress, isPaused) => {
    this.setState(state => ({
      requests: {
        ...state.requests,
        [url]: {
          url,
          progress,
          isPaused,
        },
      },
    }));
  };

  togglePauseRequests = () => {
    this.setState(
      prevState => {
        return {pauseNewRequests: !prevState.pauseNewRequests};
      },
      () => {
        setPauseNewRequests(this.state.pauseNewRequests);
      }
    );
  };

  render() {
    if (!this.state.showDebugger) {
      return null;
    }
    return (
      <Draggable cancel="input">
        <div
          className="🎛"
          style={{
            bottom: 20,
            right: 20,
          }}>
          <div>
            Latency: {this.state.requestTime} second{this.state.requestTime !==
            1
              ? 's'
              : ''}{' '}
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              style={{width: '100%'}}
              value={this.state.requestTime}
              onChange={e => {
                e.stopPropagation();
                this.setState({requestTime: parseFloat(e.target.value)});
              }}
            />
          </div>
          <label>
            <input
              type="checkbox"
              checked={this.state.pauseNewRequests}
              onChange={this.togglePauseRequests}
            />
            Pause new requests
          </label>
          <br />
          <br />
          {Object.values(this.state.requests).filter(x => x.progress !== 100)
            .length > 0 ? (
            <Fragment>
              <div style={{marginBottom: 10}}>
                <b>Loading</b>
              </div>
            </Fragment>
          ) : (
            <Fragment>
              <div style={{marginBottom: 10}}>
                <b>Loading</b>
              </div>
              <small style={{height: 20, display: 'block'}}>(None)</small>
            </Fragment>
          )}
          {Object.keys(this.state.requests)
            .reverse()
            .map(url => {
              const {progress, isPaused} = this.state.requests[url];
              if (progress === 100) {
                return null;
              }
              return (
                <div
                  key={url}
                  style={{
                    height: 20,
                    width: '100%',
                    position: 'relative',
                    cursor: 'pointer',
                    title: isPaused ? 'Resume' : 'Pause',
                  }}
                  onClick={e => {
                    setPaused(url, !isPaused);
                  }}>
                  <div
                    style={{
                      height: '100%',
                      width: progress + '%',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      backgroundColor: isPaused ? '#fbfb0e' : '#61dafb',
                      zIndex: -1,
                      opacity: 0.8,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: 'black',
                    }}>
                    {url}
                  </div>
                </div>
              );
            })}
          {Object.values(this.state.requests).filter(x => x.progress === 100)
            .length > 0 ? (
            <Fragment>
              <br />
              <div style={{marginBottom: 10}}>
                <b>Cached</b>{' '}
                <button
                  style={{
                    height: 16,
                    outline: 'none',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={this.handleReset}>
                  🗑
                </button>
              </div>
            </Fragment>
          ) : (
            <Fragment>
              <br />
              <div style={{marginBottom: 10}}>
                <b>Cached</b>
              </div>
              <small style={{height: 20, display: 'block'}}>(None)</small>
            </Fragment>
          )}
          {Object.keys(this.state.requests)
            .reverse()
            .map(url => {
              const {progress} = this.state.requests[url];
              if (progress !== 100) {
                return null;
              }

              return (
                <div
                  key={url}
                  style={{
                    height: 20,
                    width: '100%',
                    position: 'relative',
                  }}>
                  <div
                    style={{
                      height: '100%',
                      width: progress + '%',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      backgroundColor:
                        progress !== 100 ? '#61dafb' : 'lightgreen',
                      zIndex: -1,
                      opacity: 0.8,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color: 'black',
                    }}>
                    {url}
                  </div>
                </div>
              );
            })}
        </div>
      </Draggable>
    );
  }
}

unstable_createRoot(document.getElementById('root')).render(<Shell />);

render(<Debugger />, document.getElementById('debugger'));
