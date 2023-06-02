/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef } from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
export function FeedItem({ data, onClick }) {
  const rerenderCount = useRef(0);
  return /*#__PURE__*/ _jsx("a", {
    href: `./item/${data.value}`,
    className: "FeedItem",
    onClick: onClick,
    children: rerenderCount.current++,
  });
}
export function Feed({ items }) {
  const rerenderCount = useRef(0);

  const onClick = (e) => {
    e.preventDefault();
    alert(e.target.href);
  };

  return /*#__PURE__*/ _jsxs("div", {
    className: "Feed",
    children: [
      /*#__PURE__*/ _jsx("h3", {
        children: rerenderCount.current++,
      }),
      items.map((item, index) =>
        /*#__PURE__*/ _jsx(
          FeedItem,
          {
            data: item,
            onClick: onClick,
          },
          index
        )
      ),
    ],
  });
}
