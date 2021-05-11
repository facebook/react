import { useMemoCache } from "./useMemoCache";
import React, { useState } from "react";
export default function AddTodo({
  setTodos,
  themeColor = "#045975"
}) {
  let $ = useMemoCache(13);
  let c_setTodos = $[0] !== setTodos;
  if (c_setTodos) $[0] = setTodos;
  let c_themeColor = $[1] !== themeColor;
  if (c_themeColor) $[1] = themeColor;
  const [text, setText] = useState(defaultTodo);
  let c_text = $[2] !== text;
  if (c_text) $[2] = text;
  const handleAddTodo = c_setTodos ? $[3] = text => {
    setTodos(ts => [...ts, {
      id: nextId++,
      text: text,
      done: false
    }]);
  } : $[3];
  const bgGradient = c_themeColor ? $[4] = `linear-gradient(
    209.21deg,
    ${themeColor}22 0%,
    ${themeColor}ee 100%
  )` : $[4];
  return c_text || c_setTodos || c_themeColor ? $[12] = <div className="AddTodo">
      {c_text || c_setTodos || c_themeColor ? $[11] = <form onSubmit={c_text || c_setTodos ? $[5] = e => {
      e.preventDefault();
      setText(defaultTodo);
      handleAddTodo(text.trim() === "" ? fallbackTodo : text);
    } : $[5]}>
        {c_text ? $[7] = <input placeholder="Add todo" value={text} onChange={$[6] || ($[6] = e => setText(e.target.value))} /> : $[7]}
        {c_themeColor ? $[10] = <div className="tail">
          {c_themeColor ? $[9] = <button type="submit" style={c_themeColor ? $[8] = {
          background: bgGradient
        } : $[8]}>
            Add
          </button> : $[9]}
        </div> : $[10]}
      </form> : $[11]}
    </div> : $[12];
}
let nextId = 3;
const defaultTodo = "";
const fallbackTodo = "oops";
