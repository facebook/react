/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
import React, { useState, useRef } from "react";
import getUpdated from "./getUpdated";
import initialTodos from "./initialTodos";
import Todo from "./NeoTodoNoBadge";
import AddTodo from "./NeoAddTodo";
/**
 * Neo0 Minimal TodoList (without Badge)
 *
 * Motivation:
 * Start with just `useState` (state var) and _pass things done_.
 */

function TodoList() {
  let $ = useMemoCache(4);
  const [todos, setTodos] = useState(initialTodos);
  let c_todos = $[1] !== todos;
  if (c_todos) $[1] = todos;

  const handleChange = $[2] || ($[2] = todo => setTodos(todos => getUpdated(todos, todo)));

  return c_todos ? $[3] = <div>
      {todos.map(todo => <Todo key={todo.id} todo={todo} onChange={handleChange} />)}
      <AddTodo setTodos={setTodos} />
    </div> : $[3];
}

export default function App() {
  let $ = useMemoCache(1);
  return <div className="TodoListApp">
      <TodoList />
    </div>;
}
