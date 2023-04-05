/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache"; 
import React, { createContext, useRef, useReducer, useContext } from "react";
import "./styles.css";
const initialStore = {
  left: undefined,
  right: undefined
};

const reducer = (state, action) => {
  switch (action.tag) {
    case "left":
      return { ...state,
        left: action.payload
      };

    case "right":
      return { ...state,
        right: action.payload
      };

    default:
      return state;
  }
};

const BinaryContext = createContext(initialStore);

function Input(props) {
  let $ = useMemoCache(2);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_value = c_props && prevProps.value !== props.value;
  let c_onChange = c_props && prevProps.onChange !== props.onChange;
  return c_value || c_onChange ? $[1] = <input className="Search" placeholder="..." value={props.value} onChange={props.onChange} /> : $[1];
}

function Left() {
  let $ = useMemoCache(9);
  const [{
    left
  }, dispatch] = useContext(BinaryContext);
  let c_dispatch = $[2] !== dispatch;
  if (c_dispatch) $[2] = dispatch;
  let c_left = $[1] !== left;
  if (c_left) $[1] = left;
  const rerenderCount = useRef(0);
  return c_left || c_dispatch ? $[8] = <div className="column Demo2">
      {c_left || c_dispatch ? $[5] = <header className="Header row">
        <div className="Icon">⚛️</div>
        {c_left || c_dispatch ? $[4] = <Input value={left} onChange={c_dispatch ? $[3] = e => dispatch({
        tag: "left",
        payload: e.target.value
      }) : $[3]} /> : $[4]}
      </header> : $[5]}
      {c_left ? $[7] = <div className="Feed">
        <h3>{rerenderCount.current++}</h3>
        {c_left ? $[6] = <div className="FeedItem">{left}</div> : $[6]}
      </div> : $[7]}
    </div> : $[8];
}

function Right() {
  let $ = useMemoCache(9);
  const [{
    right
  }, dispatch] = useContext(BinaryContext);
  let c_dispatch = $[2] !== dispatch;
  if (c_dispatch) $[2] = dispatch;
  let c_right = $[1] !== right;
  if (c_right) $[1] = right;
  const rerenderCount = useRef(0);
  return c_right || c_dispatch ? $[8] = <div className="column Demo2">
      {c_right || c_dispatch ? $[5] = <header className="Header row">
        <div className="Icon">⚛️</div>
        {c_right || c_dispatch ? $[4] = <Input value={right} onChange={c_dispatch ? $[3] = e => dispatch({
        tag: "right",
        payload: e.target.value
      }) : $[3]} /> : $[4]}
      </header> : $[5]}
      {c_right ? $[7] = <div className="Feed">
        <h3>{rerenderCount.current++}</h3>
        {c_right ? $[6] = <div className="FeedItem">{right}</div> : $[6]}
      </div> : $[7]}
    </div> : $[8];
}

export default function Demo2() {
  let $ = useMemoCache(4);
  const [state, dispatch] = useReducer(reducer, initialStore);
  let c_state = $[1] !== state;
  if (c_state) $[1] = state;
  const store = c_state ? $[2] = [state, dispatch] : $[2]; // const store = React.useMemo(() => [state, dispatch], [state]);

  return c_state ? $[3] = <BinaryContext.Provider value={store}>
      <div className="App">
        <h2>Demo2 - Context</h2>
        <div className="row">
          <Left />
          <Right />
        </div>
      </div>
    </BinaryContext.Provider> : $[3];
}
