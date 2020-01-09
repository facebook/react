const React = window.React;
const ReactDOM = window.ReactDOM;

class IframePortal extends React.Component {
  iframeRef = null;

  handleRef = ref => {
    if (ref !== this.iframeRef) {
      this.iframeRef = ref;
      if (ref) {
        if (ref.contentDocument && this.props.head) {
          ref.contentDocument.head.innerHTML = this.props.head;
        }
        // Re-render must take place in the next tick (Firefox)
        setTimeout(() => {
          this.forceUpdate();
        });
      }
    }
  };

  render() {
    const ref = this.iframeRef;
    let portal = null;
    if (ref && ref.contentDocument) {
      portal = ReactDOM.createPortal(
        this.props.children,
        ref.contentDocument.body
      );
    }

    return (
      <div>
        <iframe
          title="Iframe portal"
          style={{border: 'none', height: this.props.height}}
          ref={this.handleRef}
        />
        {portal}
      </div>
    );
  }
}

class IframeSubtree extends React.Component {
  warned = false;
  render() {
    if (!this.warned) {
      console.error(
        `IFrame has not yet been implemented for React v${React.version}`
      );
      this.warned = true;
    }
    return <div>{this.props.children}</div>;
  }
}

export default ReactDOM.createPortal ? IframePortal : IframeSubtree;
