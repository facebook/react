/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<0f69eb72393c7fcab2452533eb6bc2df>>
 */

"use strict";
__DEV__ &&
  (function () {
    var React = require("react"),
      didWarnAboutUsingAct = !1;
    exports.act = function (callback) {
      !1 === didWarnAboutUsingAct &&
        ((didWarnAboutUsingAct = !0),
        console.error(
          "`ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info."
        ));
      return React.act(callback);
    };
  })();
