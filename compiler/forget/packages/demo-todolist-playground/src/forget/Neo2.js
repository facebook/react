import { useMemoCache } from "./useMemoCache";
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

function TodoList(props) {
  let $ = useMemoCache(5);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_getFiltered = c_props && prevProps.getFiltered !== props.getFiltered;
  const [todos, setTodos] = useState(initialTodos);
  let c_todos = $[1] !== todos;
  if (c_todos) $[1] = todos;

  const handleChange = $[2] || ($[2] = todo => setTodos(todos => getUpdated(todos, todo)));

  const filtered = c_getFiltered || c_todos ? $[3] = props.getFiltered(todos) : $[3];
  return c_getFiltered || c_todos ? $[4] = <div>
      {filtered.map(todo => <Todo key={todo.id} todo={todo} onChange={handleChange} />)}
      <AddTodo setTodos={setTodos} />
    </div> : $[4];
}

export default function App() {
  let $ = useMemoCache(10);
  const [visibility, setVisibility] = useState("all");
  let c_visibility = $[1] !== visibility;
  if (c_visibility) $[1] = visibility;
  const count = useRef(0);
  const countRef = useRef(null);
  const getFiltered = c_visibility ? $[2] = todos => {
    count.current++;
    queueMicrotask(() => countRef.current.textContent = count.current);

    switch (visibility) {
      case "all":
        return todos;

      case "active":
        return todos.filter(t => !t.done);

      case "completed":
        return todos.filter(t => t.done);
    }
  } : $[2];
  return c_visibility ? $[9] = <div className="TodoListApp">
      {c_visibility ? $[7] = <header>
        {c_visibility ? $[6] = <div class="VisibilityFilter">
          {c_visibility ? $[5] = <Select value={visibility} options={$[3] || ($[3] = [{
          value: "all",
          label: "All"
        }, {
          value: "active",
          label: "Active"
        }, {
          value: "completed",
          label: "Completed"
        }])} onChange={$[4] || ($[4] = value => setVisibility(value))} /> : $[5]}
          <div className="tail">
            <CountBadge ref={countRef} count={count.current} />
          </div>
        </div> : $[6]}
      </header> : $[7]}
      {c_visibility ? $[8] = <TodoList getFiltered={getFiltered} /> : $[8]}
    </div> : $[9];
}
