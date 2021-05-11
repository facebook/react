import React, { useState, useRef } from "react";

/**
 * Ch1 Minimal TaskBoard
 *
 * Motivation:
 * We want to start with just `useState` and _pass things done_.
 *
 * Inspired by
 * - Rich Harris's https://rethinking-reactivity.surge.sh/#slide=18
 * - https://beta.reactjs.org/learn/extracting-state-logic-into-a-reducer
 *   - before we extract event handler to reducer.
 * - https://immerjs.github.io/immer/example-setstate
 *
 * Now, the <TaskBoard /> contains:
 * - useState
 * - useCallback
 * - React.memo(<Child />)
 */

function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const onChangeTask = task =>
    setTasks(ts => ts.map(t => (t.id === task.id ? task : t)));

  return (
    <div>
      <AddTask setTasks={setTasks} />
      {tasks.map(task => (
        <Task key={task.id} task={task} onChange={onChangeTask} />
      ))}
    </div>
  );
}

export default TaskBoard;

function Task({ task, onChange }) {
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  const taskContent = isEditing ? (
    <>
      <input
        value={task.text}
        onChange={e => {
          onChange({
            ...task,
            text: e.target.value,
          });
        }}
      />
      <button onClick={() => setIsEditing(false)}>Save</button>
    </>
  ) : (
    <>
      {task.text}
      <button onClick={() => setIsEditing(true)}>Edit</button>
    </>
  );
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={task.done}
          onChange={e => {
            onChange({
              ...task,
              done: e.target.checked,
            });
          }}
        />
        {taskContent}
        {count.current++}
      </label>
    </li>
  );
}

let nextId = 3;
const defaultTask = "Code bugs";
const initialTasks = [
  { id: 0, text: "Buy milk", done: true },
  { id: 1, text: "Eat tacos", done: false },
  { id: 2, text: "Brew tea", done: false },
];

function AddTask({ setTasks }) {
  const [text, setText] = useState(defaultTask);
  const handleAddTask = text => {
    setTasks(ts => [
      ...ts,
      {
        id: nextId++,
        text: text,
        done: false,
      },
    ]);
  };

  return (
    <>
      <input
        placeholder="Add task"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        onClick={() => {
          setText(defaultTask);
          handleAddTask(text);
        }}
      >
        Add
      </button>
    </>
  );
}
