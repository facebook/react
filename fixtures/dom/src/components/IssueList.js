/**
 * IssueList Component
 * 
 * Renders a list of GitHub issue links for the React repository.
 * Can accept a comma-separated string or an array of issue numbers.
 */

const React = window.React;
import PropTypes from 'prop-types';

/**
 * Parses a comma-separated string into an array
 * @param {string} string - Comma-separated list of values
 * @returns {Array<string>} Array of trimmed values
 */
function csv(string) {
  return string.split(/\s*,\s*/);
}

/**
 * Component that renders a list of GitHub issue links
 * 
 * @param {Object} props - Component props
 * @param {string|Array<string>} props.issues - Issue numbers as a comma-separated string or array
 * @returns {React.ReactElement|null} - Rendered component or null if no issues
 * 
 * @example
 * // With string of issues
 * <IssueList issues="12345, 67890" />
 * 
 * // With array of issues
 * <IssueList issues={['12345', '67890']} />
 */
export default function IssueList({issues}) {
  if (!issues) {
    return null;
  }

  if (typeof issues === 'string') {
    issues = csv(issues);
  }

  let links = issues.reduce((memo, issue, i) => {
    return memo.concat(
      i > 0 && i < issues.length ? ', ' : null,
      <a href={'https://github.com/facebook/react/issues/' + issue} key={issue}>
        {issue}
      </a>
    );
  }, []);

  return <span>{links}</span>;
}

IssueList.propTypes = {
  issues: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ])
};
