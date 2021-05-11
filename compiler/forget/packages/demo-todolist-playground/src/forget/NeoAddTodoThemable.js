import { useMemoCache } from "./useMemoCache";
import React, { useState } from "react";
export default function AddTodo(props) {
  let $ = useMemoCache(12);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_setTodos = c_props && prevProps.setTodos !== props.setTodos;
  let c_themeColor = c_props && prevProps.themeColor !== props.themeColor;
  const [text, setText] = useState(defaultTodo);
  let c_text = $[1] !== text;
  if (c_text) $[1] = text;
  const handleAddTodo = c_setTodos ? $[2] = text => {
    props.setTodos(ts => [...ts, {
      id: nextId++,
      text: text,
      done: false
    }]);
  } : $[2];
  const bgGradient = c_themeColor ? $[3] = `linear-gradient(
    209.21deg,
    ${props.themeColor}22 0%,
    ${props.themeColor}ee 100%
  )` : $[3];
  return c_text || c_setTodos || c_themeColor ? $[11] = <div className="AddTodo">
      {c_text || c_setTodos || c_themeColor ? $[10] = <form onSubmit={c_text || c_setTodos ? $[4] = e => {
      e.preventDefault();
      setText(defaultTodo);
      handleAddTodo(text.trim() === "" ? fallbackTodo : text);
    } : $[4]}>
        {c_text ? $[6] = <input placeholder="Add todo" value={text} onChange={$[5] || ($[5] = e => setText(e.target.value))} /> : $[6]}
        {c_themeColor ? $[9] = <div className="tail">
          {c_themeColor ? $[8] = <button type="submit" style={c_themeColor ? $[7] = {
          background: bgGradient
        } : $[7]}>
            Add
          </button> : $[8]}
        </div> : $[9]}
      </form> : $[10]}
    </div> : $[11];
}
let nextId = 3;
const defaultTodo = "";
const fallbackTodo = "oops";
