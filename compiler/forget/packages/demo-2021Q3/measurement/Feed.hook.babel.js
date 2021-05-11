import React, { useRef, useCallback } from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";

function FeedItem({ data, onClick }) {
  const rerenderCount = useRef(0);
  return /*#__PURE__*/ _jsx("a", {
    href: `./item/${data.value}`,
    className: "FeedItem",
    onClick: onClick,
    children: rerenderCount.current++,
  });
}

const FeedItemMemoized = /*#__PURE__*/ React.memo(FeedItem);
export const Feed = /*#__PURE__*/ React.memo(({ items }) => {
  const rerenderCount = useRef(0);
  const onClick = useCallback((e) => {
    e.preventDefault();
    alert(e.target.href);
  }, []);
  return /*#__PURE__*/ _jsxs("div", {
    className: "Feed",
    children: [
      /*#__PURE__*/ _jsx("h3", {
        children: rerenderCount.current++,
      }),
      items.map((item, index) =>
        /*#__PURE__*/ _jsx(
          FeedItemMemoized,
          {
            data: item,
            onClick: onClick,
          },
          index
        )
      ),
    ],
  });
});
