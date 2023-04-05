/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
import getUpdated from "../utils/getUpdated";
import getFiltered from "../utils/getFiltered";
import initialTodos from "../utils/InitialTodos";
import ColorPicker from "../utils/ColorPicker";
import CountBadge from "../utils/CountBadge";
import React, { useState, useRef } from "react";
import Select from "../utils/Select";
import Todo from "./Todo";
import AddTodo from "./AddTodo";

function TodoList({
  visibility,
  themeColor
}) {
  let $ = useMemoCache(8);
  let c_visibility = $[0] !== visibility;
  if (c_visibility) $[0] = visibility;
  let c_themeColor = $[1] !== themeColor;
  if (c_themeColor) $[1] = themeColor;
  const [todos, setTodos] = useState(initialTodos);
  let c_todos = $[2] !== todos;
  if (c_todos) $[2] = todos;

  const handleChange = $[3] || ($[3] = todo => setTodos(todos => getUpdated(todos, todo)));

  const filtered = c_todos || c_visibility ? $[4] = getFiltered(todos, visibility) : $[4];
  return c_todos || c_visibility || c_themeColor ? $[7] = <div>
      {c_todos || c_visibility ? $[5] = <ul>
        {filtered.map(todo => <Todo key={todo.id} todo={todo} onChange={handleChange} />)}
      </ul> : $[5]}
      {c_themeColor ? $[6] = <AddTodo setTodos={setTodos} themeColor={themeColor} /> : $[6]}
    </div> : $[7];
}

export default function BlazingTodoList() {
  let $ = useMemoCache(14);
  const [themeColor, setThemeColor] = useState("#045975");
  let c_themeColor = $[0] !== themeColor;
  if (c_themeColor) $[0] = themeColor;
  const [visibility, setVisibility] = useState("all");
  let c_visibility = $[1] !== visibility;
  if (c_visibility) $[1] = visibility;
  const bgGradient = c_themeColor ? $[2] = `linear-gradient(
    209.21deg,
    rgb(8, 126, 164) 13.57%,
    ${themeColor} 98.38%
  )` : $[2];
  return c_themeColor || c_visibility ? $[13] = <div className="column Neo">
      {c_themeColor || c_visibility ? $[12] = <div className="TodoListApp" style={c_themeColor ? $[3] = {
      background: bgGradient
    } : $[3]}>
        <div className="FilterCountBanner">
          <code>getFiltered()</code> was called
          <CountBadge />
          times
        </div>
        {c_themeColor || c_visibility ? $[10] = <header>
          {c_themeColor ? $[5] = <ColorPicker value={themeColor} onChange={$[4] || ($[4] = e => setThemeColor(e.target.value))} /> : $[5]}
          {c_visibility ? $[9] = <div className="VisibilityFilter">
            {c_visibility ? $[8] = <Select value={visibility} options={$[6] || ($[6] = [{
            value: "all",
            label: "All"
          }, {
            value: "active",
            label: "Active"
          }, {
            value: "completed",
            label: "Completed"
          }])} onChange={$[7] || ($[7] = value => setVisibility(value))} /> : $[8]}
          </div> : $[9]}
        </header> : $[10]}
        {c_visibility || c_themeColor ? $[11] = <TodoList visibility={visibility} themeColor={themeColor} /> : $[11]}
      </div> : $[12]}
    </div> : $[13];
}
