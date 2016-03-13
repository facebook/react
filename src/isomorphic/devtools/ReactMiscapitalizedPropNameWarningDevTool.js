/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactMiscapitalizedPropNameWarningDevTool
 */

'use strict';

var warning = require('warning');

if (__DEV__) {

  var warnedProperties = {};

  var warnMiscapitalizedPropName = function(
                                     componentName,
                                     allPropNames,
                                     missingPropName
                                   ) {
    var missingPropNameLowerCase = missingPropName.toLowerCase();
    var incorrectlyCapitalizedPropName;

    for (var propName of allPropNames) {
      if (propName !== missingPropName &&
         propName.toLowerCase() === missingPropNameLowerCase) {
        incorrectlyCapitalizedPropName = propName;
      }
    }

    if (incorrectlyCapitalizedPropName) {
      if (warnedProperties[incorrectlyCapitalizedPropName]) {
        return;
      }
      warnedProperties[incorrectlyCapitalizedPropName] = true;

      warning(
        false,
        'Did you miscapitalize %s as %s in %s?',
        missingPropName,
        incorrectlyCapitalizedPropName,
        componentName
      );
    }

  };
}

var ReactMiscapitalizedPropNameWarningDevTool = {
  onCreateChainableTypeChecker(componentName, props, propName) {
    if (props[propName] == null) {
      warnMiscapitalizedPropName(componentName, Object.keys(props), propName);
    }
  },
};

module.exports = ReactMiscapitalizedPropNameWarningDevTool;
