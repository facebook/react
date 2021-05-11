import React, { useState, useRef } from "react";
import getUpdated from "./getUpdated";
import initialTodos from "./initialTodos";
import Todo from "./NeoTodo";
import AddTodo from "./NeoAddTodo";
import CountBadge from "../Components/CountBadge";
import Select from "../Components/Select";

/**
 * Neo2 TodoList with Filter
 *
 * Motivation:
 * Add props and computations.
 */

function TodoList({ getFiltered }) {
  const [todos, setTodos] = useState(initialTodos);
  const handleChange = todo => setTodos(todos => getUpdated(todos, todo));
  const filtered = getFiltered(todos);

  return (
    <div>
      {filtered.map(todo => (
        <Todo key={todo.id} todo={todo} onChange={handleChange} />
      ))}
      <AddTodo setTodos={setTodos} />
    </div>
  );
}

export default function App() {
  const [visibility, setVisibility] = useState("all");
  const count = useRef(0);
  const countRef = useRef(null);

  const getFiltered = todos => {
    count.current++;
    queueMicrotask(() => (countRef.current.textContent = count.current));
    switch (visibility) {
      case "all":
        return todos;
      case "active":
        return todos.filter(t => !t.done);
      case "completed":
        return todos.filter(t => t.done);
    }
  };

  return (
    <div className="TodoListApp">
      <header>
        <div class="VisibilityFilter">
          <Select
            value={visibility}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
            ]}
            onChange={value => setVisibility(value)}
          />
          <div className="tail">
            <CountBadge ref={countRef} count={count.current} />
          </div>
        </div>
      </header>
      <TodoList getFiltered={getFiltered} />
    </div>
  );
}
