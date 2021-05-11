import getUpdated from "../utils/getUpdated";
import getFiltered from "../utils/getFiltered";
import initialTodos from "../utils/InitialTodos";
import ColorPicker from "../utils/ColorPicker";
import CountBadge from "../utils/CountBadge";
import React, { useState, useRef } from "react";
import Select from "../utils/Select";
import Todo from "./Todo";
import AddTodo from "./AddTodo";

function TodoList({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);
  const handleChange = todo => setTodos(todos => getUpdated(todos, todo));
  const filtered = getFiltered(todos, visibility);

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

export default function BlazingTodoList() {
  const [themeColor, setThemeColor] = useState("#045975");
  const [visibility, setVisibility] = useState("all");

  const bgGradient = `linear-gradient(
    209.21deg,
    rgb(8, 126, 164) 13.57%,
    ${themeColor} 98.38%
  )`;

  return (
    <div className="column Neo">
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
    </div>
  );
}
