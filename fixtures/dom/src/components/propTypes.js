import semver from 'semver';

const React = window.React;

export function semverString (props, propName, componentName) {
  let version = props[propName];

  let error = React.PropTypes.string(...arguments);
  if (!error && version != null && !semver.valid(version))
    error = new Error(
      `\`${propName}\` should be a valid "semantic version" matching ` +
      'an existing React version'
    );

  return error || null;
};
