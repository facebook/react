/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
  const [todos, setTodos] = useState(initialTodos);
  const handleChange = todo => setTodos(todos => getUpdated(todos, todo));

  return (
    <div>
      {todos.map(todo => (
        <Todo key={todo.id} todo={todo} onChange={handleChange} />
      ))}
      <AddTodo setTodos={setTodos} />
    </div>
  );
}

export default function App() {
  return (
    <div className="TodoListApp">
      <TodoList />
    </div>
  );
}
