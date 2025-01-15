/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<3c95d29bbe505302903a6e0423e2fa77>>
 */

"use strict";
__DEV__ &&
  (function () {
    function error(format) {
      for (
        var _len2 = arguments.length,
          args = Array(1 < _len2 ? _len2 - 1 : 0),
          _key2 = 1;
        _key2 < _len2;
        _key2++
      )
        args[_key2 - 1] = arguments[_key2];
      if (enableRemoveConsolePatches) {
        var _console2;
        (_console2 = console).error.apply(_console2, [format].concat(args));
      } else
        (_len2 = format),
          enableRemoveConsolePatches ||
            (ReactSharedInternals.getCurrentStack &&
              ((_key2 = ReactSharedInternals.getCurrentStack()),
              "" !== _key2 && ((_len2 += "%s"), (args = args.concat([_key2])))),
            args.unshift(_len2),
            Function.prototype.apply.call(console.error, console, args));
    }
    var React = require("react"),
      dynamicFlagsUntyped = require("ReactNativeInternalFeatureFlags"),
      ReactSharedInternals =
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      enableRemoveConsolePatches =
        dynamicFlagsUntyped && dynamicFlagsUntyped.enableRemoveConsolePatches,
      didWarnAboutUsingAct = !1;
    exports.act = function (callback) {
      !1 === didWarnAboutUsingAct &&
        ((didWarnAboutUsingAct = !0),
        error(
          "`ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info."
        ));
      return React.act(callback);
    };
  })();
