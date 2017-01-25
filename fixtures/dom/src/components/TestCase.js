import cn from 'classnames';
import semver from 'semver';
import React from 'react';
import { parse } from 'query-string';

const propTypes = {
  children: React.PropTypes.node.isRequired,
  title: React.PropTypes.node.isRequired,
  minimumVersion: (props, ...args) => {
    let { minimumVersion } = props;

    let error = React.PropTypes.string(props, ...args);
    if (!error && minimumVersion != null && !semver.valid(minimumVersion))
      error = new Error(
        '`minimumVersion` should be a valid "semantic version" matching ' +
        'an existing React version'
      );

    return error || null;
  }
};

class TestCase extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      complete: false,
    };
  }

  handleChange = (e) => {
    this.setState({
      complete: e.target.checked
    })
  };

  render() {
    const {
      title,
      description,
      minimumVersion,
      affectedBrowsers,
      children,
    } = this.props;

    let { complete } = this.state;

    const { version } = parse(window.location.search);
    const isTestRelevant = (
      !version ||
      !minimumVersion ||
      semver.gte(version, minimumVersion)
    )

    complete = !isTestRelevant || complete;

    return (
      <section
        className={cn(
          "test-case",
          complete && 'test-case--complete'
        )}
      >
        <h2 className="test-case__title type-subheading">
          <label>
            <input
              type='checkbox'
              checked={complete}
              onChange={this.handleChange}
            />
            {' '}{title}
          </label>
          <dl className="test-case__details">
            {minimumVersion && (
              <dt>First supported version: </dt>)}
            {minimumVersion && (
              <dd><code>{minimumVersion}</code></dd>)}

            {affectedBrowsers &&
              <dt>Affected browsers: </dt>}
            {affectedBrowsers &&
              <dd>{affectedBrowsers}</dd>
            }
          </dl>
        </h2>

        <p>{description}</p>


        {!isTestRelevant &&(
          <p className="test-case__invalid-version">
            <strong>Note:</strong> This test case was fixed in a later version of React.
            This test is not expected to pass for the selected version, and that's ok!
          </p>
        )}
        {children}
      </section>
    );
  }
}

TestCase.propTypes = propTypes;

TestCase.Steps = class extends React.Component {
  render() {
    const { children } = this.props;
    return (
      <div>
        <h3>Steps to reproduce:</h3>
        <ol>
          {children}
        </ol>
      </div>
    )
  }
}

TestCase.ExpectedResult = class extends React.Component {
  render() {
    const { children } = this.props
    return (
      <div>
        <h3>Expected Result:</h3>
        <p>
          {children}
        </p>
      </div>
    )
  }
}
export default TestCase
