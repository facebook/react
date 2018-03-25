import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;

export default class MediaEvents extends React.Component {
  state = {
    playbackRate: 2,
    events: {
      onCanPlay: false,
      onCanPlayThrough: false,
      onDurationChange: false,
      onEmptied: false,
      onEnded: false,
      onError: false,
      onLoadedData: false,
      onLoadedMetadata: false,
      onLoadStart: false,
      onPause: false,
      onPlay: false,
      onPlaying: false,
      onProgress: false,
      onRateChange: false,
      onSeeked: false,
      onSeeking: false,
      onSuspend: false,
      onTimeUpdate: false,
      onVolumeChange: false,
      onWaiting: false,
    },
  };

  updatePlaybackRate = () => {
    this.video.playbackRate = 2;
  };

  setVideo = el => {
    this.video = el;
  };

  eventDidFire(event) {
    this.setState({
      events: Object.assign({}, this.state.events, {[event]: true}),
    });
  }

  getProgress() {
    const events = Object.keys(this.state.events);
    const total = events.length;
    const fired = events.filter(type => this.state.events[type]).length;

    return fired / total;
  }

  render() {
    const events = Object.keys(this.state.events);
    const handlers = events.reduce((events, event) => {
      events[event] = this.eventDidFire.bind(this, event);
      return events;
    }, {});

    return (
      <FixtureSet title="Media Events" description="">
        <TestCase
          title="Event bubbling"
          description="Media events should synthetically bubble">
          <TestCase.Steps>
            <li>Play the loaded video</li>
            <li>Pause the loaded video</li>
            <li>Play the failing video</li>
            <li>Drag the track bar</li>
            <li>Toggle the volume button</li>
            <li>
              <button onClick={this.updatePlaybackRate}>
                Click this button to increase playback rate
              </button>
            </li>
          </TestCase.Steps>

          <p className="footnote">
            Note: This test does not confirm <code>onStalled</code>,{' '}
            <code>onAbort</code>, or <code>onEncrypted</code>
          </p>

          <TestCase.ExpectedResult>
            All events in the table below should be marked as "true".
          </TestCase.ExpectedResult>

          <section {...handlers}>
            <video src="/test.mp4" width="300" controls ref={this.setVideo} />
            <video src="/missing.mp4" width="300" controls />
            <p className="footnote">
              Note: The second video will not load. This is intentional.
            </p>
          </section>
          <hr />
          <section>
            <h3>Events</h3>
            <p>The following events should bubble:</p>
            <table>
              <tbody>{events.map(this.renderOutcome, this)}</tbody>
            </table>
          </section>
        </TestCase>
      </FixtureSet>
    );
  }

  renderOutcome(event) {
    let fired = this.state.events[event];

    return (
      <tr key={event}>
        <td>
          <b>{event}</b>
        </td>
        <td style={{color: fired ? null : 'red'}}>{`${fired}`}</td>
      </tr>
    );
  }
}
