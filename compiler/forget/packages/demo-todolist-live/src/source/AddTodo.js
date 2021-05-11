import React, { useState } from "react";

export default function AddTodo({ setTodos, themeColor = "#045975" }) {
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

  const bgGradient = `linear-gradient(
    209.21deg,
    ${themeColor}22 0%,
    ${themeColor}ee 100%
  )`;

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
          <button type="submit" style={{ background: bgGradient }}>
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

let nextId = 3;
const defaultTodo = "";
const fallbackTodo = "oops";
