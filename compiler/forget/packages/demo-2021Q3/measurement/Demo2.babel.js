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

function Input({ value, onChange }) {
  return /*#__PURE__*/ _jsx("input", {
    className: "Search",
    placeholder: "...",
    value: value,
    onChange: onChange,
  });
}

function Left() {
  const [{ left }, dispatch] = useContext(BinaryContext);
  const rerenderCount = useRef(0);
  return /*#__PURE__*/ _jsxs("div", {
    className: "column Demo2",
    children: [
      /*#__PURE__*/ _jsxs("header", {
        className: "Header row",
        children: [
          /*#__PURE__*/ _jsx("div", {
            className: "Icon",
            children: "\u269B\uFE0F",
          }),
          /*#__PURE__*/ _jsx(Input, {
            value: left,
            onChange: (e) =>
              dispatch({
                tag: "left",
                payload: e.target.value,
              }),
          }),
        ],
      }),
      /*#__PURE__*/ _jsxs("div", {
        className: "Feed",
        children: [
          /*#__PURE__*/ _jsx("h3", {
            children: rerenderCount.current++,
          }),
          /*#__PURE__*/ _jsx("div", {
            className: "FeedItem",
            children: left,
          }),
        ],
      }),
    ],
  });
}

function Right() {
  const [{ right }, dispatch] = useContext(BinaryContext);
  const rerenderCount = useRef(0);
  return /*#__PURE__*/ _jsxs("div", {
    className: "column Demo2",
    children: [
      /*#__PURE__*/ _jsxs("header", {
        className: "Header row",
        children: [
          /*#__PURE__*/ _jsx("div", {
            className: "Icon",
            children: "\u269B\uFE0F",
          }),
          /*#__PURE__*/ _jsx(Input, {
            value: right,
            onChange: (e) =>
              dispatch({
                tag: "right",
                payload: e.target.value,
              }),
          }),
        ],
      }),
      /*#__PURE__*/ _jsxs("div", {
        className: "Feed",
        children: [
          /*#__PURE__*/ _jsx("h3", {
            children: rerenderCount.current++,
          }),
          /*#__PURE__*/ _jsx("div", {
            className: "FeedItem",
            children: right,
          }),
        ],
      }),
    ],
  });
}

export default function Demo2() {
  const [state, dispatch] = useReducer(reducer, initialStore);
  const store = [state, dispatch];
  return /*#__PURE__*/ _jsx(BinaryContext.Provider, {
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
  });
}
