import cn from 'classnames';
import semver from 'semver';
import React from 'react';
import { parse } from 'query-string';
import { semverString } from './propTypes'

const propTypes = {
  children: React.PropTypes.node.isRequired,
  title: React.PropTypes.node.isRequired,
  resolvedIn: semverString,
  resolvedBy: React.PropTypes.string
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
      resolvedIn,
      resolvedBy,
      affectedBrowsers,
      children,
    } = this.props;

    let { complete } = this.state;

    const { version } = parse(window.location.search);
    const isTestRelevant = (
      !version ||
      !resolvedIn ||
      semver.gte(version, resolvedIn)
    );

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
              className="test-case__title__check"
              type="checkbox"
              checked={complete}
              onChange={this.handleChange}
            />
            {' '}{title}
          </label>
        </h2>

        <dl className="test-case__details">
          {resolvedIn && (
            <dt>First supported in: </dt>)}
          {resolvedIn && (
             <dd>
               <a href={'https://github.com/facebook/react/tag/v' + resolvedIn}>
                 <code>{resolvedIn}</code>
               </a>
             </dd>
           )}

          {resolvedBy && (
            <dt>Fixed by: </dt>)}
          {resolvedBy && (
            <dd>
              <a href={'https://github.com/facebook/react/pull/' + resolvedBy.slice(1)}>
                <code>{resolvedBy}</code>
              </a>
            </dd>
          )}

          {affectedBrowsers &&
            <dt>Affected browsers: </dt>}
          {affectedBrowsers &&
            <dd>{affectedBrowsers}</dd>
          }
        </dl>

        <p className="test-case__desc">
          {description}
        </p>

        <div className="test-case__body">
          {!isTestRelevant &&(
             <p className="test-case__invalid-version">
               <strong>Note:</strong> This test case was fixed in a later version of React.
               This test is not expected to pass for the selected version, and that's ok!
             </p>
           )}

          {children}
        </div>
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
