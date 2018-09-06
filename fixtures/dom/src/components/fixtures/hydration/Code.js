/**
 * react-live does not support React 14. For this version, just return
 * a textarea.
 *
 * TODO: Could we just get rid of react-live? It only adds syntax highlighting
 */

import semver from 'semver';
import {LiveProvider, LiveEditor, LiveError} from 'react-live';

const React = window.React;
const supportsReactLive = semver(React.version).major > 1; // React 15 or higher

export class CodeProvider extends React.Component {
  render() {
    const {code, children} = this.props;

    if (supportsReactLive) {
      return <LiveProvider code={code} children={children} />;
    }

    return <div>{children}</div>;
  }
}

export class CodeEditor extends React.Component {
  render() {
    const {code, onChange} = this.props;

    if (supportsReactLive) {
      return <LiveEditor onChange={onChange} />;
    }

    return (
      <textarea value={code} onChange={event => onChange(event.target.value)} />
    );
  }
}

export class CodeError extends React.Component {
  render() {
    let {error, className} = this.props;

    if (supportsReactLive) {
      return <LiveError className={className} />;
    }

    return error ? <div className={className}>{error.message}</div> : null;
  }
}
