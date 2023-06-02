/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef, useCallback, useMemo } from "react";
import getUpdated from "./getUpdated";
import getFiltered from "./getFiltered";
import initialTodos from "./initialTodos";
import UnmemoizedTodo from "./NeoTodo";
import AddTodo from "./NeoAddTodoThemable";
import ColorPicker from "../Components/ColorPicker";
import CountBadge from "../Components/CountBadge";
import Select from "../Components/Select";

/**
 * Neo3 TodoList with Filter and ColorPicker (half memoized)
 * - with Neo1.memo.js part unchanged to keep the flow
 *
 * Motivation:
 * Add props and and demo that such computations may need `useMemo`.
 */

const Todo = React.memo(UnmemoizedTodo);

function TodoList({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);
  const handleChange = useCallback(
    todo => setTodos(todos => getUpdated(todos, todo)),
    []
  );
  const filtered = useMemo(
    () => getFiltered(todos, visibility),
    [todos, visibility]
  );

  return (
    <div>
      <ul>
        {filtered.map(todo => (
          <Todo key={todo.id} todo={todo} onChange={handleChange} />
        ))}
      </ul>
      <AddTodo setTodos={setTodos} themeColor={themeColor} />
    </div>
  );
}

function BlazingTodoList() {
  const [visibility, setVisibility] = useState("all");
  const [themeColor, setThemeColor] = useState("#045975");
  return <TodoList visibility={visibility} themeColor={themeColor} />;
}

// https://twitter.com/acdlite/status/974390255393505280
// https://twitter.com/sugarpirate_/status/1449067040459956227

export default function BlazingTodoListForReal() {
  const [themeColor, setThemeColor] = useState("#045975");
  const [visibility, setVisibility] = useState("all");

  const bgGradient = `linear-gradient(
    209.21deg,
    ${primaryColor} 13.57%,
    ${themeColor} 98.38%
  )`;

  return (
    <div className="TodoListApp" style={{ background: bgGradient }}>
      <div className="FilterCountBanner">
        <code>getFiltered()</code> was called
        <CountBadge />
        times
      </div>
      <header>
        <ColorPicker
          value={themeColor}
          onChange={e => setThemeColor(e.target.value)}
        />
        <div className="VisibilityFilter">
          <Select
            value={visibility}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
            ]}
            onChange={value => setVisibility(value)}
          />
        </div>
      </header>
      <TodoList visibility={visibility} themeColor={themeColor} />
    </div>
  );
}

const primaryColor = "rgb(8, 126, 164)";
