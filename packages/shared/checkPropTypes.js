/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const loggedTypeFailures = {};

export default function checkPropTypes(
  typeSpecs: Object,
  values: Object,
  location: string,
  componentName: ?string,
): void {
  if (__DEV__) {
    // $FlowFixMe This is okay but Flow doesn't know it.
    const has = Function.call.bind(Object.prototype.hasOwnProperty);
    for (const typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        let error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            const err = Error(
              (componentName || 'React class') +
                ': ' +
                location +
                ' type `' +
                typeSpecName +
                '` is invalid; ' +
                'it must be a function, usually from the `prop-types` package, but received `' +
                typeof typeSpecs[typeSpecName] +
                '`.' +
                'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.',
            );
            err.name = 'Invariant Violation';
            throw err;
          }
          error = typeSpecs[typeSpecName](
            values,
            typeSpecName,
            componentName,
            location,
            null,
            'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED',
          );
        } catch (ex) {
          error = ex;
        }
        if (error && !(error instanceof Error)) {
          console.error(
            '%s: type specification of %s' +
              ' `%s` is invalid; the type checker ' +
              'function must return `null` or an `Error` but returned a %s. ' +
              'You may have forgotten to pass an argument to the type checker ' +
              'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
              'shape all require an argument).',
            componentName || 'React class',
            location,
            typeSpecName,
            typeof error,
          );
        }
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;
          console.error('Failed %s type: %s', location, error.message);
        }
      }
    }
  }
}
