/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
import React, { useState, useRef, useEffect } from "react";
import getUpdated from "./getUpdated";
import getFiltered from "./getFiltered";
import initialTodos from "./initialTodos";
import Todo from "./NeoTodo";
import AddTodo from "./NeoAddTodoThemable";
import ColorPicker from "../Components/ColorPicker";
import CountBadge from "../Components/CountBadge";
import Select from "../Components/Select";
/**
 * Neo3 TodoList with Filter and ColorPicker
 *
 * Motivation:
 * Add props and and demo that such computations may need `useMemo`.
 */

function TodoList(props) {
  let $ = useMemoCache(7);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_visibility = c_props && prevProps.visibility !== props.visibility;
  let c_themeColor = c_props && prevProps.themeColor !== props.themeColor;
  const [todos, setTodos] = useState(initialTodos);
  let c_todos = $[1] !== todos;
  if (c_todos) $[1] = todos;

  const handleChange = $[2] || ($[2] = todo => setTodos(todos => getUpdated(todos, todo)));

  const filtered = c_todos || c_visibility ? $[3] = getFiltered(todos, props.visibility) : $[3];
  return c_todos || c_visibility || c_themeColor ? $[6] = <div>
      {c_todos || c_visibility ? $[4] = <ul>
        {filtered.map(todo => <Todo key={todo.id} todo={todo} onChange={handleChange} />)}
      </ul> : $[4]}
      {c_themeColor ? $[5] = <AddTodo setTodos={setTodos} themeColor={props.themeColor} /> : $[5]}
    </div> : $[6];
}

export default function BlazingTodoList() {
  let $ = useMemoCache(14);
  const [themeColor, setThemeColor] = useState("#045975");
  let c_themeColor = $[1] !== themeColor;
  if (c_themeColor) $[1] = themeColor;
  const [visibility, setVisibility] = useState("all");
  let c_visibility = $[2] !== visibility;
  if (c_visibility) $[2] = visibility;
  const bgGradient = c_themeColor ? $[3] = `linear-gradient(
    209.21deg,
    ${primaryColor} 13.57%,
    ${themeColor} 98.38%
  )` : $[3];
  return c_themeColor || c_visibility ? $[13] = <div className="TodoListApp" style={c_themeColor ? $[4] = {
    background: bgGradient
  } : $[4]}>
      <div className="FilterCountBanner">
        <code>getFiltered()</code> was called
        <CountBadge />
        times
      </div>
      {c_themeColor || c_visibility ? $[11] = <header>
        {c_themeColor ? $[6] = <ColorPicker value={themeColor} onChange={$[5] || ($[5] = e => setThemeColor(e.target.value))} /> : $[6]}
        {c_visibility ? $[10] = <div className="VisibilityFilter">
          {c_visibility ? $[9] = <Select value={visibility} options={$[7] || ($[7] = [{
          value: "all",
          label: "All"
        }, {
          value: "active",
          label: "Active"
        }, {
          value: "completed",
          label: "Completed"
        }])} onChange={$[8] || ($[8] = value => setVisibility(value))} /> : $[9]}
        </div> : $[10]}
      </header> : $[11]}
      {c_visibility || c_themeColor ? $[12] = <TodoList visibility={visibility} themeColor={themeColor} /> : $[12]}
    </div> : $[13];
}
const primaryColor = "rgb(8, 126, 164)";
