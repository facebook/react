import React, { useState, useRef } from "react";
import CountBadge from "../Components/CountBadge";

/**
 *  Until Forget supports default props...
 */
export default function Todo({ todo, onChange }) {
  const inputRef = useRef(null);
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);

  const onSave = e => {
    e.preventDefault();
    setIsEditing(false);
    onChange({
      ...Todo,
      text: inputRef.current.value,
    });
  };

  const TodoBody = isEditing ? (
    <form value={todo.text} onSubmit={onSave} onBlur={onSave}>
      <input ref={inputRef} defaultValue={todo.text} autoFocus />
    </form>
  ) : (
    <div
      className={"TodoBody" + (todo.done ? " done" : "")}
      onClick={() => setIsEditing(true)}
    >
      {todo.text}
    </div>
  );

  const checkBox = !isEditing && (
    <button
      className={todo.done ? "Checkbox done" : "Checkbox"}
      onClick={e => {
        e.target.blur();
        onChange({
          ...todo,
          done: !todo.done,
        });
      }}
    ></button>
  );

  return (
    <li className="Todo">
      {checkBox}
      {TodoBody}
      <div className="tail"></div>
    </li>
  );
}
