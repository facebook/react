/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
import React, { useState } from "react"; // We need this because Forget has bug when props is passed in `undefined`

export default function AddTodo(props) {
  let $ = useMemoCache(8);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_setTodos = c_props && prevProps.setTodos !== props.setTodos;
  const [text, setText] = useState(defaultTodo);
  let c_text = $[1] !== text;
  if (c_text) $[1] = text;
  const handleAddTodo = c_setTodos ? $[2] = text => {
    props.setTodos(ts => [...ts, {
      id: nextId++,
      text: text,
      done: false
    }]);
  } : $[2];
  return c_text || c_setTodos ? $[7] = <div className="AddTodo">
      {c_text || c_setTodos ? $[6] = <form onSubmit={c_text || c_setTodos ? $[3] = e => {
      e.preventDefault();
      setText(defaultTodo);
      handleAddTodo(text.trim() === "" ? fallbackTodo : text);
    } : $[3]}>
        {c_text ? $[5] = <input placeholder="Add todo" value={text} onChange={$[4] || ($[4] = e => setText(e.target.value))} /> : $[5]}
        <div className="tail">
          <button type="submit">Add</button>
        </div>
      </form> : $[6]}
    </div> : $[7];
}
let nextId = 3;
const defaultTodo = "";
const fallbackTodo = "oops";
