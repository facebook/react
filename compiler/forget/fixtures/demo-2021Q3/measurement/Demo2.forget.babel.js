/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
import React, { createContext, useRef, useReducer, useContext } from "react";
import "./styles.css";
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
const initialStore = {
  left: undefined,
  right: undefined,
};

const reducer = (state, action) => {
  switch (action.tag) {
    case "left":
      return { ...state, left: action.payload };

    case "right":
      return { ...state, right: action.payload };

    default:
      return state;
  }
};

const BinaryContext = /*#__PURE__*/ createContext(initialStore);

function Input(props) {
  let $ = useMemoCache(2);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_value = c_props && prevProps.value !== props.value;
  let c_onChange = c_props && prevProps.onChange !== props.onChange;
  return c_value || c_onChange
    ? ($[1] = /*#__PURE__*/ _jsx("input", {
        className: "Search",
        placeholder: "...",
        value: props.value,
        onChange: props.onChange,
      }))
    : $[1];
}

function Left() {
  let $ = useMemoCache(9);
  const [{ left }, dispatch] = useContext(BinaryContext);
  let c_dispatch = $[2] !== dispatch;
  if (c_dispatch) $[2] = dispatch;
  let c_left = $[1] !== left;
  if (c_left) $[1] = left;
  const rerenderCount = useRef(0);
  return c_left || c_dispatch
    ? ($[8] = /*#__PURE__*/ _jsxs("div", {
        className: "column Demo2",
        children: [
          c_left || c_dispatch
            ? ($[5] = /*#__PURE__*/ _jsxs("header", {
                className: "Header row",
                children: [
                  /*#__PURE__*/ _jsx("div", {
                    className: "Icon",
                    children: "\u269B\uFE0F",
                  }),
                  c_left || c_dispatch
                    ? ($[4] = /*#__PURE__*/ _jsx(Input, {
                        value: left,
                        onChange: c_dispatch
                          ? ($[3] = (e) =>
                              dispatch({
                                tag: "left",
                                payload: e.target.value,
                              }))
                          : $[3],
                      }))
                    : $[4],
                ],
              }))
            : $[5],
          c_left
            ? ($[7] = /*#__PURE__*/ _jsxs("div", {
                className: "Feed",
                children: [
                  /*#__PURE__*/ _jsx("h3", {
                    children: rerenderCount.current++,
                  }),
                  c_left
                    ? ($[6] = /*#__PURE__*/ _jsx("div", {
                        className: "FeedItem",
                        children: left,
                      }))
                    : $[6],
                ],
              }))
            : $[7],
        ],
      }))
    : $[8];
}

function Right() {
  let $ = useMemoCache(9);
  const [{ right }, dispatch] = useContext(BinaryContext);
  let c_dispatch = $[2] !== dispatch;
  if (c_dispatch) $[2] = dispatch;
  let c_right = $[1] !== right;
  if (c_right) $[1] = right;
  const rerenderCount = useRef(0);
  return c_right || c_dispatch
    ? ($[8] = /*#__PURE__*/ _jsxs("div", {
        className: "column Demo2",
        children: [
          c_right || c_dispatch
            ? ($[5] = /*#__PURE__*/ _jsxs("header", {
                className: "Header row",
                children: [
                  /*#__PURE__*/ _jsx("div", {
                    className: "Icon",
                    children: "\u269B\uFE0F",
                  }),
                  c_right || c_dispatch
                    ? ($[4] = /*#__PURE__*/ _jsx(Input, {
                        value: right,
                        onChange: c_dispatch
                          ? ($[3] = (e) =>
                              dispatch({
                                tag: "right",
                                payload: e.target.value,
                              }))
                          : $[3],
                      }))
                    : $[4],
                ],
              }))
            : $[5],
          c_right
            ? ($[7] = /*#__PURE__*/ _jsxs("div", {
                className: "Feed",
                children: [
                  /*#__PURE__*/ _jsx("h3", {
                    children: rerenderCount.current++,
                  }),
                  c_right
                    ? ($[6] = /*#__PURE__*/ _jsx("div", {
                        className: "FeedItem",
                        children: right,
                      }))
                    : $[6],
                ],
              }))
            : $[7],
        ],
      }))
    : $[8];
}

export default function Demo2() {
  let $ = useMemoCache(4);
  const [state, dispatch] = useReducer(reducer, initialStore);
  let c_state = $[1] !== state;
  if (c_state) $[1] = state;
  const store = c_state ? ($[2] = [state, dispatch]) : $[2];
  return c_state
    ? ($[3] = /*#__PURE__*/ _jsx(BinaryContext.Provider, {
        value: store,
        children: /*#__PURE__*/ _jsxs("div", {
          className: "App",
          children: [
            /*#__PURE__*/ _jsx("h2", {
              children: "Demo2 - Context",
            }),
            /*#__PURE__*/ _jsxs("div", {
              className: "row",
              children: [
                /*#__PURE__*/ _jsx(Left, {}),
                /*#__PURE__*/ _jsx(Right, {}),
              ],
            }),
          ],
        }),
      }))
    : $[3];
}
