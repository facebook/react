/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function validateLinkPropsForStyleResource(props: any): boolean {
  if (__DEV__) {
    // This should only be called when we know we are opting into Resource semantics (i.e. precedence is not null)
    const {href, onLoad, onError, disabled} = props;
    const includedProps = [];
    if (onLoad) includedProps.push('`onLoad`');
    if (onError) includedProps.push('`onError`');
    if (disabled != null) includedProps.push('`disabled`');

    let includedPropsPhrase = propNamesListJoin(includedProps, 'and');
    includedPropsPhrase += includedProps.length === 1 ? ' prop' : ' props';
    const withArticlePhrase =
      includedProps.length === 1
        ? 'an ' + includedPropsPhrase
        : 'the ' + includedPropsPhrase;

    if (includedProps.length) {
      console.error(
        'React encountered a <link rel="stylesheet" href="%s" ... /> with a `precedence` prop that' +
          ' also included %s. The presence of loading and error handlers indicates an intent to manage' +
          ' the stylesheet loading state from your from your Component code and React will not hoist or' +
          ' deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet' +
          ' using the `precedence` prop remove the %s, otherwise remove the `precedence` prop.',
        href,
        withArticlePhrase,
        includedPropsPhrase,
      );
      return true;
    }
  }
  return false;
}

function propNamesListJoin(
  list: Array<string>,
  combinator: 'and' | 'or',
): string {
  switch (list.length) {
    case 0:
      return '';
    case 1:
      return list[0];
    case 2:
      return list[0] + ' ' + combinator + ' ' + list[1];
    default:
      return (
        list.slice(0, -1).join(', ') +
        ', ' +
        combinator +
        ' ' +
        list[list.length - 1]
      );
  }
}

export function validatePreinitArguments(href: mixed, options: mixed) {
  if (__DEV__) {
    if (!href || typeof href !== 'string') {
      const typeOfArg = getValueDescriptorExpectingObjectForWarning(href);
      console.error(
        'ReactDOM.preinit() expected the first argument to be a string representing an href but found %s instead.',
        typeOfArg,
      );
    } else if (typeof options !== 'object' || options === null) {
      const typeOfArg = getValueDescriptorExpectingObjectForWarning(options);
      console.error(
        'ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
          ' specifying the Resource type. It found %s instead. The href for the preload call where this warning originated is "%s".',
        typeOfArg,
        href,
      );
    } else {
      const as = options.as;
      switch (as) {
        case 'style':
        case 'script': {
          break;
        }

        // We have an invalid as type and need to warn
        default: {
          const typeOfAs = getValueDescriptorExpectingEnumForWarning(as);
          console.error(
            'ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
              ' specifying the Resource type. It found %s instead. Currently, valid resource types for for preinit are "style"' +
              ' and "script". The href for the preinit call where this warning originated is "%s".',
            typeOfAs,
            href,
          );
        }
      }
    }
  }
}

export function getValueDescriptorExpectingObjectForWarning(
  thing: any,
): string {
  return thing === null
    ? '`null`'
    : thing === undefined
    ? '`undefined`'
    : thing === ''
    ? 'an empty string'
    : `something with type "${typeof thing}"`;
}

export function getValueDescriptorExpectingEnumForWarning(thing: any): string {
  return thing === null
    ? '`null`'
    : thing === undefined
    ? '`undefined`'
    : thing === ''
    ? 'an empty string'
    : typeof thing === 'string'
    ? JSON.stringify(thing)
    : `something with type "${typeof thing}"`;
}
