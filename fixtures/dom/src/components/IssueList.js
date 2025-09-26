const React = window.React;
import PropTypes from 'prop-types';

function csv(string) {
  return string.split(/\s*,\s*/);
}

export default function IssueList({issues}) {
  if (!issues) {
    return null;
  }

  if (typeof issues === 'string') {
    issues = csv(issues);
  }

  let links = issues.map((issue, i) => (
    <React.Fragment key={issue}>
      {i > 0 ? ', ' : ''}
      <a href={`https://github.com/facebook/react/issues/${issue}`}>
        {issue}
      </a>
    </React.Fragment>
  ));

  return <span>{links}</span>;
}

IssueList.propTypes = {
  issues: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
};
