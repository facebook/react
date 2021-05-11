import { useMemoCache } from "./useMemoCache";
import React, { useRef } from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
export function FeedItem(props) {
  let $ = useMemoCache(2);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_data = c_props && prevProps.data !== props.data;
  let c_onClick = c_props && prevProps.onClick !== props.onClick;
  const rerenderCount = useRef(0);
  return c_data || c_onClick
    ? ($[1] = /*#__PURE__*/ _jsx("a", {
        href: `./item/${props.data.value}`,
        className: "FeedItem",
        onClick: props.onClick,
        children: rerenderCount.current++,
      }))
    : $[1];
}
export function Feed(props) {
  let $ = useMemoCache(3);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_items = c_props && prevProps.items !== props.items;
  const rerenderCount = useRef(0);

  const onClick =
    $[1] ||
    ($[1] = (e) => {
      e.preventDefault();
      alert(e.target.href);
    });

  return c_items
    ? ($[2] = /*#__PURE__*/ _jsxs("div", {
        className: "Feed",
        children: [
          /*#__PURE__*/ _jsx("h3", {
            children: rerenderCount.current++,
          }),
          props.items.map((item, index) =>
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
      }))
    : $[2];
}
