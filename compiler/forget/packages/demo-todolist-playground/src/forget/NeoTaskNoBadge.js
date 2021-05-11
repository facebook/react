import { useMemoCache } from "./useMemoCache";
import React, { useState, useRef } from "react";
import CountBadge from "../Components/CountBadge";
/**
 *  Until Forget supports default props...
 */

export default function Todo(props) {
  let $ = useMemoCache(6);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_todo = c_props && prevProps.todo !== props.todo;
  let c_onChange = c_props && prevProps.onChange !== props.onChange;
  const inputRef = useRef(null);
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  let c_isEditing = $[1] !== isEditing;
  if (c_isEditing) $[1] = isEditing;
  const onSave = c_onChange || c_todo ? $[2] = e => {
    e.preventDefault();
    setIsEditing(false);
    props.onChange({ ...props.todo,
      text: inputRef.current.value
    });
  } : $[2];
  const todoBody = c_isEditing || c_todo || c_onChange ? $[3] = isEditing ? <form value={props.todo.text} onSubmit={onSave} onBlur={onSave}>
      <input ref={inputRef} defaultValue={props.todo.text} autoFocus />
    </form> : <div className={"TodoBody" + (props.todo.done ? " done" : "")} onClick={() => setIsEditing(true)}>
      {props.todo.text}
    </div> : $[3];
  const checkBox = c_isEditing || c_todo || c_onChange ? $[4] = !isEditing && <button className={props.todo.done ? "Checkbox done" : "Checkbox"} onClick={e => {
    e.target.blur();
    props.onChange({ ...props.todo,
      done: !props.todo.done
    });
  }}></button> : $[4];
  return c_isEditing || c_todo || c_onChange ? $[5] = <li className="Todo">
      {checkBox}
      {todoBody}
      <div className="tail"></div>
    </li> : $[5];
}
