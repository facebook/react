/**
 * Custom Prop Type Validators
 * 
 * This file contains custom validators for React component props
 * that can be used across the DOM test fixtures.
 */

import PropTypes from 'prop-types';
import semver from 'semver';

/**
 * Validates that a prop is a valid semantic version string
 * 
 * This validator ensures that:
 * 1. The prop is a string (using PropTypes.string)
 * 2. The string is a valid semantic version format (using semver.valid)
 * 
 * Use this for props that should contain React version numbers
 * to ensure they match the expected format (e.g. "16.8.0").
 * 
 * @param {Object} props - Component props
 * @param {string} propName - Name of the prop to validate
 * @param {string} componentName - Name of the component for error messages
 * @returns {Error|null} Returns an error if validation fails, null otherwise
 * 
 * @example
 * // Usage in a component:
 * MyComponent.propTypes = {
 *   reactVersion: semverString
 * }
 */
export function semverString(props, propName, componentName) {
  let version = props[propName];

  let error = PropTypes.string(...arguments);
  if (!error && version != null && !semver.valid(version))
    error = new Error(
      `\`${propName}\` should be a valid "semantic version" matching ` +
        'an existing React version'
    );

  return error || null;
}
