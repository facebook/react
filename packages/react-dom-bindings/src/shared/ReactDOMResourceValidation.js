/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import hasOwnProperty from 'shared/hasOwnProperty';

type Props = {[string]: mixed};

export function warnOnMissingHrefAndRel(
  pendingProps: Props,
  currentProps: ?Props,
) {
  if (__DEV__) {
    if (currentProps != null) {
      const originalResourceName =
        typeof currentProps.href === 'string'
          ? `Resource with href "${currentProps.href}"`
          : 'Resource';
      const originalRelStatement = getValueDescriptorExpectingEnumForWarning(
        currentProps.rel,
      );
      const pendingRel = getValueDescriptorExpectingEnumForWarning(
        pendingProps.rel,
      );
      const pendingHref = getValueDescriptorExpectingEnumForWarning(
        pendingProps.href,
      );
      if (typeof pendingProps.rel !== 'string') {
        console.error(
          'A <link> previously rendered as a %s with rel "%s" but was updated with an invalid rel: %s. When a link' +
            ' does not have a valid rel prop it is not represented in the DOM. If this is intentional, instead' +
            ' do not render the <link> anymore.',
          originalResourceName,
          originalRelStatement,
          pendingRel,
        );
      } else if (typeof pendingProps.href !== 'string') {
        console.error(
          'A <link> previously rendered as a %s but was updated with an invalid href prop: %s. When a link' +
            ' does not have a valid href prop it is not represented in the DOM. If this is intentional, instead' +
            ' do not render the <link> anymore.',
          originalResourceName,
          pendingHref,
        );
      }
    } else {
      const pendingRel = getValueDescriptorExpectingEnumForWarning(
        pendingProps.rel,
      );
      const pendingHref = getValueDescriptorExpectingEnumForWarning(
        pendingProps.href,
      );
      if (typeof pendingProps.rel !== 'string') {
        console.error(
          'A <link> is rendering with an invalid rel: %s. When a link' +
            ' does not have a valid rel prop it is not represented in the DOM. If this is intentional, instead' +
            ' do not render the <link> anymore.',
          pendingRel,
        );
      } else if (typeof pendingProps.href !== 'string') {
        console.error(
          'A <link> is rendering with an invalid href: %s. When a link' +
            ' does not have a valid href prop it is not represented in the DOM. If this is intentional, instead' +
            ' do not render the <link> anymore.',
          pendingHref,
        );
      }
    }
  }
}

export function validatePreloadResourceDifference(
  originalProps: any,
  originalImplicit: boolean,
  latestProps: any,
  latestImplicit: boolean,
) {
  if (__DEV__) {
    const {href} = originalProps;
    const originalWarningName = getResourceNameForWarning(
      'preload',
      originalProps,
      originalImplicit,
    );
    const latestWarningName = getResourceNameForWarning(
      'preload',
      latestProps,
      latestImplicit,
    );

    if (latestProps.as !== originalProps.as) {
      console.error(
        'A %s is using the same href "%s" as a %s. This is always an error and React will only keep the first preload' +
          ' for any given href, discarding subsequent instances. To fix, find where you are using this href in link' +
          ' tags or in calls to ReactDOM.preload() or ReactDOM.preinit() and either make the Resource types agree or' +
          ' update the hrefs to be distinct for different Resource types.',
        latestWarningName,
        href,
        originalWarningName,
      );
    } else {
      let missingProps = null;
      let extraProps = null;
      let differentProps = null;
      if (originalProps.media != null && latestProps.media == null) {
        missingProps = missingProps || {};
        missingProps.media = originalProps.media;
      }

      for (const propName in latestProps) {
        const propValue = latestProps[propName];
        const originalValue = originalProps[propName];

        if (propValue != null && propValue !== originalValue) {
          if (originalValue == null) {
            extraProps = extraProps || {};
            extraProps[propName] = propValue;
          } else {
            differentProps = differentProps || {};
            differentProps[propName] = {
              original: originalValue,
              latest: propValue,
            };
          }
        }
      }

      if (missingProps || extraProps || differentProps) {
        warnDifferentProps(
          href,
          'href',
          originalWarningName,
          latestWarningName,
          extraProps,
          missingProps,
          differentProps,
        );
      }
    }
  }
}

export function validateStyleResourceDifference(
  originalProps: any,
  latestProps: any,
) {
  if (__DEV__) {
    const {href} = originalProps;
    // eslint-disable-next-line no-labels
    const originalWarningName = getResourceNameForWarning(
      'style',
      originalProps,
      false,
    );
    const latestWarningName = getResourceNameForWarning(
      'style',
      latestProps,
      false,
    );
    let missingProps = null;
    let extraProps = null;
    let differentProps = null;
    if (originalProps.media != null && latestProps.media == null) {
      missingProps = missingProps || {};
      missingProps.media = originalProps.media;
    }

    for (let propName in latestProps) {
      const propValue = latestProps[propName];
      const originalValue = originalProps[propName];

      if (propValue != null && propValue !== originalValue) {
        propName = propName === 'data-precedence' ? 'precedence' : propName;
        if (originalValue == null) {
          extraProps = extraProps || {};
          extraProps[propName] = propValue;
        } else {
          differentProps = differentProps || {};
          differentProps[propName] = {
            original: originalValue,
            latest: propValue,
          };
        }
      }
    }

    if (missingProps || extraProps || differentProps) {
      warnDifferentProps(
        href,
        'href',
        originalWarningName,
        latestWarningName,
        extraProps,
        missingProps,
        differentProps,
      );
    }
  }
}

export function validateScriptResourceDifference(
  originalProps: any,
  latestProps: any,
) {
  if (__DEV__) {
    const {src} = originalProps;
    // eslint-disable-next-line no-labels
    const originalWarningName = getResourceNameForWarning(
      'script',
      originalProps,
      false,
    );
    const latestWarningName = getResourceNameForWarning(
      'script',
      latestProps,
      false,
    );
    let extraProps = null;
    let differentProps = null;

    for (const propName in latestProps) {
      const propValue = latestProps[propName];
      const originalValue = originalProps[propName];

      if (propValue != null && propValue !== originalValue) {
        if (originalValue == null) {
          extraProps = extraProps || {};
          extraProps[propName] = propValue;
        } else {
          differentProps = differentProps || {};
          differentProps[propName] = {
            original: originalValue,
            latest: propValue,
          };
        }
      }
    }

    if (extraProps || differentProps) {
      warnDifferentProps(
        src,
        'src',
        originalWarningName,
        latestWarningName,
        extraProps,
        null,
        differentProps,
      );
    }
  }
}

export function validateStyleAndHintProps(
  preloadProps: any,
  styleProps: any,
  implicitPreload: boolean,
) {
  if (__DEV__) {
    const {href} = preloadProps;

    const originalWarningName = getResourceNameForWarning(
      'preload',
      preloadProps,
      implicitPreload,
    );
    const latestWarningName = getResourceNameForWarning(
      'style',
      styleProps,
      false,
    );

    if (preloadProps.as !== 'style') {
      console.error(
        'While creating a %s for href "%s" a %s for this same href was found. When preloading a stylesheet the' +
          ' "as" prop must be of type "style". This most likely ocurred by rendering a preload link with an incorrect' +
          ' "as" prop or by calling ReactDOM.preload with an incorrect "as" option.',
        latestWarningName,
        href,
        originalWarningName,
      );
    }

    let missingProps = null;
    let extraProps = null;
    let differentProps = null;

    for (const propName in styleProps) {
      const styleValue = styleProps[propName];
      const preloadValue = preloadProps[propName];
      switch (propName) {
        // Check for difference on specific props that cross over or influence
        // the relationship between the preload and stylesheet
        case 'crossOrigin':
        case 'referrerPolicy':
        case 'media':
        case 'title': {
          if (
            preloadValue !== styleValue &&
            !(preloadValue == null && styleValue == null)
          ) {
            if (styleValue == null) {
              missingProps = missingProps || {};
              missingProps[propName] = preloadValue;
            } else if (preloadValue == null) {
              extraProps = extraProps || {};
              extraProps[propName] = styleValue;
            } else {
              differentProps = differentProps || {};
              differentProps[propName] = {
                original: preloadValue,
                latest: styleValue,
              };
            }
          }
        }
      }
    }

    if (missingProps || extraProps || differentProps) {
      warnDifferentProps(
        href,
        'href',
        originalWarningName,
        latestWarningName,
        extraProps,
        missingProps,
        differentProps,
      );
    }
  }
}

export function validateScriptAndHintProps(
  preloadProps: any,
  scriptProps: any,
  implicitPreload: boolean,
) {
  if (__DEV__) {
    const {href} = preloadProps;

    const originalWarningName = getResourceNameForWarning(
      'preload',
      preloadProps,
      implicitPreload,
    );
    const latestWarningName = getResourceNameForWarning(
      'script',
      scriptProps,
      false,
    );

    if (preloadProps.as !== 'script') {
      console.error(
        'While creating a %s for href "%s" a %s for this same url was found. When preloading a script the' +
          ' "as" prop must be of type "script". This most likely ocurred by rendering a preload link with an incorrect' +
          ' "as" prop or by calling ReactDOM.preload with an incorrect "as" option.',
        latestWarningName,
        href,
        originalWarningName,
      );
    }

    let missingProps = null;
    let extraProps = null;
    let differentProps = null;

    for (const propName in scriptProps) {
      const scriptValue = scriptProps[propName];
      const preloadValue = preloadProps[propName];
      switch (propName) {
        // Check for difference on specific props that cross over or influence
        // the relationship between the preload and stylesheet
        case 'crossOrigin':
        case 'referrerPolicy':
        case 'integrity': {
          if (
            preloadValue !== scriptValue &&
            !(preloadValue == null && scriptValue == null)
          ) {
            if (scriptValue == null) {
              missingProps = missingProps || {};
              missingProps[propName] = preloadValue;
            } else if (preloadValue == null) {
              extraProps = extraProps || {};
              extraProps[propName] = scriptValue;
            } else {
              differentProps = differentProps || {};
              differentProps[propName] = {
                original: preloadValue,
                latest: scriptValue,
              };
            }
          }
        }
      }
    }

    if (missingProps || extraProps || differentProps) {
      warnDifferentProps(
        href,
        'href',
        originalWarningName,
        latestWarningName,
        extraProps,
        missingProps,
        differentProps,
      );
    }
  }
}

function warnDifferentProps(
  url: string,
  urlPropKey: string,
  originalName: string,
  latestName: string,
  extraProps: ?{[string]: any},
  missingProps: ?{[string]: any},
  differentProps: ?{[string]: {original: any, latest: any}},
): void {
  if (__DEV__) {
    const juxtaposedNameStatement =
      latestName === originalName
        ? 'an earlier instance of this Resource'
        : `a ${originalName} with the same ${urlPropKey}`;

    let comparisonStatement = '';
    if (missingProps !== null && typeof missingProps === 'object') {
      for (const propName in missingProps) {
        comparisonStatement += `\n  ${propName}: missing or null in latest props, "${missingProps[propName]}" in original props`;
      }
    }
    if (extraProps !== null && typeof extraProps === 'object') {
      for (const propName in extraProps) {
        comparisonStatement += `\n  ${propName}: "${extraProps[propName]}" in latest props, missing or null in original props`;
      }
    }
    if (differentProps !== null && typeof differentProps === 'object') {
      for (const propName in differentProps) {
        comparisonStatement += `\n  ${propName}: "${differentProps[propName].latest}" in latest props, "${differentProps[propName].original}" in original props`;
      }
    }

    console.error(
      'A %s with %s "%s" has props that disagree with those found on %s. Resources always use the props' +
        ' that were provided the first time they are encountered so any differences will be ignored. Please' +
        ' update Resources that share an %s to have props that agree. The differences are described below.%s',
      latestName,
      urlPropKey,
      url,
      juxtaposedNameStatement,
      urlPropKey,
      comparisonStatement,
    );
  }
}

function getResourceNameForWarning(
  type: string,
  props: Object,
  implicit: boolean,
) {
  if (__DEV__) {
    switch (type) {
      case 'style': {
        return 'style Resource';
      }
      case 'script': {
        return 'script Resource';
      }
      case 'preload': {
        if (implicit) {
          return `preload for a ${props.as} Resource`;
        }
        return `preload Resource (as "${props.as}")`;
      }
    }
  }
  return 'Resource';
}

export function validateURLKeyedUpdatedProps(
  pendingProps: Props,
  currentProps: Props,
  resourceType: 'style' | 'script' | 'href',
  urlPropKey: 'href' | 'src',
): boolean {
  if (__DEV__) {
    // This function should never be called if we don't have /srcs so we don't bother considering
    // Whether they are null or undefined
    if (pendingProps[urlPropKey] === currentProps[urlPropKey]) {
      // If we have the same href/src we need all other props to be the same
      let missingProps;
      let extraProps;
      let differentProps;
      const allProps = Array.from(
        new Set(Object.keys(currentProps).concat(Object.keys(pendingProps))),
      );
      for (let i = 0; i < allProps.length; i++) {
        const propName = allProps[i];
        const pendingValue = pendingProps[propName];
        const currentValue = currentProps[propName];
        if (
          pendingValue !== currentValue &&
          !(pendingValue == null && currentValue == null)
        ) {
          if (pendingValue == null) {
            missingProps = missingProps || {};
            missingProps[propName] = currentValue;
          } else if (currentValue == null) {
            extraProps = extraProps || {};
            extraProps[propName] = pendingValue;
          } else {
            differentProps = differentProps || {};
            differentProps[propName] = {
              original: currentValue,
              latest: pendingValue,
            };
          }
        }
      }
      if (missingProps || extraProps || differentProps) {
        const latestWarningName = getResourceNameForWarning(
          resourceType,
          currentProps,
          false,
        );

        let comparisonStatement = '';
        if (missingProps !== null && typeof missingProps === 'object') {
          for (const propName in missingProps) {
            comparisonStatement += `\n  ${propName}: missing or null in latest props, "${missingProps[propName]}" in original props`;
          }
        }
        if (extraProps !== null && typeof extraProps === 'object') {
          for (const propName in extraProps) {
            comparisonStatement += `\n  ${propName}: "${extraProps[propName]}" in latest props, missing or null in original props`;
          }
        }
        if (differentProps !== null && typeof differentProps === 'object') {
          for (const propName in differentProps) {
            comparisonStatement += `\n  ${propName}: "${differentProps[propName].latest}" in latest props, "${differentProps[propName].original}" in original props`;
          }
        }
        console.error(
          'A %s with %s "%s" recieved new props with different values from the props used' +
            ' when this Resource was first rendered. React will only use the props provided when' +
            ' this resource was first rendered until a new %s is provided. Unlike conventional' +
            ' DOM elements, Resources instances do not have a one to one correspondence with Elements' +
            ' in the DOM and as such, every instance of a Resource for a single Resource identifier' +
            ' (%s) must have props that agree with each other. The differences are described below.%s',
          latestWarningName,
          urlPropKey,
          currentProps[urlPropKey],
          urlPropKey,
          urlPropKey,
          comparisonStatement,
        );
        return true;
      }
    }
  }
  return false;
}

export function validateLinkPropsForStyleResource(props: Props): boolean {
  if (__DEV__) {
    // This should only be called when we know we are opting into Resource semantics (i.e. precedence is not null)
    const {href, onLoad, onError, disabled} = props;
    const allProps = ['onLoad', 'onError', 'disabled'];
    const includedProps = [];
    if (onLoad) includedProps.push('onLoad');
    if (onError) includedProps.push('onError');
    if (disabled != null) includedProps.push('disabled');

    const allPropsUnionPhrase = propNamesListJoin(allProps, 'or');
    let includedPropsPhrase = propNamesListJoin(includedProps, 'and');
    includedPropsPhrase += includedProps.length === 1 ? ' prop' : ' props';

    if (includedProps.length) {
      console.error(
        'A link (rel="stylesheet") element with href "%s" has the precedence prop but also included the %s.' +
          ' When using %s React will opt out of Resource behavior. If you meant for this' +
          ' element to be treated as a Resource remove the %s. Otherwise remove the precedence prop.',
        href,
        includedPropsPhrase,
        allPropsUnionPhrase,
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

export function validateLinkPropsForPreloadResource(linkProps: any) {
  if (__DEV__) {
    const {href, as} = linkProps;
    if (as === 'font') {
      const name = getResourceNameForWarning('preload', linkProps, false);
      if (!hasOwnProperty.call(linkProps, 'crossOrigin')) {
        console.error(
          'A %s with href "%s" did not specify the crossOrigin prop. Font preloads must always use' +
            ' anonymouse CORS mode. To fix add an empty string, "anonymous", or any other string' +
            ' value except "use-credentials" for the crossOrigin prop of all font preloads.',
          name,
          href,
        );
      } else if (linkProps.crossOrigin === 'use-credentials') {
        console.error(
          'A %s with href "%s" specified a crossOrigin value of "use-credentials". Font preloads must always use' +
            ' anonymouse CORS mode. To fix use an empty string, "anonymous", or any other string' +
            ' value except "use-credentials" for the crossOrigin prop of all font preloads.',
          name,
          href,
        );
      }
    }
  }
}

export function validatePreloadArguments(href: mixed, options: mixed) {
  if (__DEV__) {
    if (!href || typeof href !== 'string') {
      const typeOfArg = getValueDescriptorExpectingObjectForWarning(href);
      console.error(
        'ReactDOM.preload() expected the first argument to be a string representing an href but found %s instead.',
        typeOfArg,
      );
    } else if (typeof options !== 'object' || options === null) {
      const typeOfArg = getValueDescriptorExpectingObjectForWarning(options);
      console.error(
        'ReactDOM.preload() expected the second argument to be an options argument containing at least an "as" property' +
          ' specifying the Resource type. It found %s instead. The href for the preload call where this warning originated is "%s".',
        typeOfArg,
        href,
      );
    } else {
      const as = options.as;
      switch (as) {
        // Font specific validation of options
        case 'font': {
          if (options.crossOrigin === 'use-credentials') {
            console.error(
              'ReactDOM.preload() was called with an "as" type of "font" and with a "crossOrigin" option of "use-credentials".' +
                ' Fonts preloading must use crossOrigin "anonymous" to be functional. Please update your font preload to omit' +
                ' the crossOrigin option or change it to any other value than "use-credentials" (Browsers default all other values' +
                ' to anonymous mode). The href for the preload call where this warning originated is "%s"',
              href,
            );
          }
          break;
        }
        case 'script':
        case 'style': {
          break;
        }

        // We have an invalid as type and need to warn
        default: {
          const typeOfAs = getValueDescriptorExpectingEnumForWarning(as);
          console.error(
            'ReactDOM.preload() expected a valid "as" type in the options (second) argument but found %s instead.' +
              ' Please use one of the following valid values instead: %s. The href for the preload call where this' +
              ' warning originated is "%s".',
            typeOfAs,
            '"style", "font", or "script"',
            href,
          );
        }
      }
    }
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

function getValueDescriptorExpectingObjectForWarning(thing: any): string {
  return thing === null
    ? 'null'
    : thing === undefined
    ? 'undefined'
    : thing === ''
    ? 'an empty string'
    : `something with type "${typeof thing}"`;
}

function getValueDescriptorExpectingEnumForWarning(thing: any): string {
  return thing === null
    ? 'null'
    : thing === undefined
    ? 'undefined'
    : thing === ''
    ? 'an empty string'
    : typeof thing === 'string'
    ? JSON.stringify(thing)
    : `something with type "${typeof thing}"`;
}
