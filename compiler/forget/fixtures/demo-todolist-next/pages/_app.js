/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "../styles/normalize.css";
import "../styles/styles.css";

// Monkeypatch useMemoCache
import React from "react";
import { useMemoCache } from "../utils/useMemoCache";
React.useMemoCache = useMemoCache;

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
