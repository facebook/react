import { useMemoCache } from "./useMemoCache";
import React, { useState, useRef } from "react";
import CountBadge from "../utils/CountBadge";
export default function Todo({
  todo,
  onChange
}) {
  let $ = useMemoCache(7);
  let c_todo = $[0] !== todo;
  if (c_todo) $[0] = todo;
  let c_onChange = $[1] !== onChange;
  if (c_onChange) $[1] = onChange;
  const inputRef = useRef(null);
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  let c_isEditing = $[2] !== isEditing;
  if (c_isEditing) $[2] = isEditing;
  const onSave = c_onChange || c_todo ? $[3] = e => {
    e.preventDefault();
    setIsEditing(false);
    onChange({ ...todo,
      text: inputRef.current.value
    });
  } : $[3];
  const checkBox = c_isEditing || c_todo || c_onChange ? $[4] = !isEditing && <button className={todo.done ? "Checkbox done" : "Checkbox"} onClick={e => {
    e.target.blur();
    onChange({ ...todo,
      done: !todo.done
    });
  }}></button> : $[4];
  const todoBody = c_isEditing || c_todo || c_onChange ? $[5] = isEditing ? <form value={todo.text} onSubmit={onSave} onBlur={onSave}>
      <input ref={inputRef} defaultValue={todo.text} autoFocus />
    </form> : <div className={"TodoBody" + (todo.done ? " done" : "")} onClick={() => setIsEditing(true)}>
      {todo.text}
    </div> : $[5];
  return c_isEditing || c_todo || c_onChange ? $[6] = <li className="Todo">
      {checkBox}
      {todoBody}
      <div className="tail">
        <CountBadge count={count.current++} type={"warning"} rounded />
      </div>
    </li> : $[6];
}
