/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from "react";

// We need this because Forget has bug when props is passed in `undefined`
export default function AddTodo({ setTodos }) {
  const [text, setText] = useState(defaultTodo);
  const handleAddTodo = text => {
    setTodos(ts => [
      ...ts,
      {
        id: nextId++,
        text: text,
        done: false,
      },
    ]);
  };

  return (
    <div className="AddTodo">
      <form
        onSubmit={e => {
          e.preventDefault();
          setText(defaultTodo);
          handleAddTodo(text.trim() === "" ? fallbackTodo : text);
        }}
      >
        <input
          placeholder="Add todo"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="tail">
          <button type="submit">Add</button>
        </div>
      </form>
    </div>
  );
}

let nextId = 3;
const defaultTodo = "";
const fallbackTodo = "oops";
