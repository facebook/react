const React = window.React;
const ReactDOM = window.ReactDOM;
import PropTypes from 'prop-types';

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
/**
 * Iframe Components
* 
* This file contains two components for rendering content inside iframes:
* 
* 1. IframePortal - Used when ReactDOM.createPortal is available. This component:
*    - Creates an iframe and renders children into it using portals
*    - Allows setting custom HTML in the iframe's head
*    - Configurable iframe height
* 
* 2. IframeSubtree - Fallback for older React versions where createPortal isn't available.
*    - Simply renders children directly while logging a warning
* 
* The file exports the appropriate component based on React version capabilities.
* 
* Props:
*   - children: React nodes to render inside the iframe
*   - head (optional): HTML string to inject into iframe's head
*   - height (optional): Height of the iframe (defaults to '100%')
*/
IframePortal.propTypes = {
  children: PropTypes.node.isRequired,
  head: PropTypes.string,
  height: PropTypes.string
};

IframePortal.defaultProps = {
  height: '100%'
};

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

IframeSubtree.propTypes = {
  children: PropTypes.node
};

export default ReactDOM.createPortal ? IframePortal : IframeSubtree;
