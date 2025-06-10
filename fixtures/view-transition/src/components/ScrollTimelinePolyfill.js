// Example of a polyfill of ScrollTimeline that implements React's CustomTimeline protocol.

export default class ScrollTimelinePolyfill {
  constructor({source, axis}) {
    this.source = source;
    this.axis = axis;
  }
  get currentTime() {
    const source = this.source;
    const axis = this.axis;
    if (axis === 'block' || axis === 'x') {
      return (
        (100 * source.scrollLeft) / (source.scrollWidth - source.clientWidth)
      );
    } else {
      return (
        (100 * source.scrollTop) / (source.scrollHeight - source.clientHeight)
      );
    }
  }
  animate(animation) {
    animation.playbackRate = 0;
    const source = this.source;
    const update = () => {
      animation.currentTime = this.currentTime;
    };
    update();
    source.addEventListener('scroll', update);
    return () => {
      source.removeEventListener('scroll', update);
    };
  }
}
