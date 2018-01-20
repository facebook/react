import React, {Component} from 'react';

// Triggers the DOM mismatch warnings if requested via query string.
export default class SSRMismatchTest extends Component {
  render() {
    // Default content rendered at the server.
    let content = (
      <div data-ssr-prop-extra={true}>
        <em>SSRMismatchTest default text</em>
      </div>
    );
    // In the browser where `window` is available, triggering a DOM mismatch if it's requested.
    if (typeof window !== 'undefined') {
      const queryString = this.props.url.replace(/^[^?]+[?]?/, '');
      if (queryString.indexOf('ssr-prop-mismatch') >= 0) {
        // The inner structure is the same as the server render, but the root element has an extra prop.
        content = (
          <div data-ssr-prop-extra={true} data-ssr-prop-mismatch={true}>
            <em>SSRMismatchTest default text</em>
          </div>
        );
      } else if (queryString.indexOf('ssr-prop-extra') >= 0) {
        // The inner structure is the same as the server render, but the root element is missing a server-rendered prop.
        content = (
          <div>
            <em>SSRMismatchTest default text</em>
          </div>
        );
      } else if (queryString.indexOf('ssr-text-mismatch') >= 0) {
        // The inner structure is the same as the server render, but the inner text node content differs.
        content = (
          <div data-ssr-prop-extra={true}>
            <em>SSRMismatchTest ssr-text-mismatch</em>
          </div>
        );
      } else if (queryString.indexOf('ssr-children-mismatch') >= 0) {
        // The inner structure is different from the server render.
        content = (
          <div data-ssr-prop-extra={true}>
            <p>SSRMismatchTest ssr-children-mismatch</p>
          </div>
        );
      }
    }
    return (
      <div>
        <div style={{paddingBottom: '10px'}}>
          SSRMismatchTest. Open the console, select a test case:{' '}
          <a href="/">none</a>{' '}
          <a href="/?ssr-prop-mismatch">ssr-prop-mismatch</a>{' '}
          <a href="/?ssr-prop-extra">ssr-prop-extra</a>{' '}
          <a href="/?ssr-text-mismatch">ssr-text-mismatch</a>{' '}
          <a href="/?ssr-children-mismatch">ssr-children-mismatch</a>
        </div>
        {content}
      </div>
    );
  }
}
