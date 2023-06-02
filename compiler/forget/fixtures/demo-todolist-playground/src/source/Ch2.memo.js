/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef, useCallback, useMemo } from "react";

/**
 * Ch2 TaskBoard with VisibilityFilter
 *
 * Motivation:
 * Add computation that need `useMemo` and props
 *
 * Now, the <TaskBoard /> contains:
 * - props
 * - useState
 * - useCallback
 * - useMemo
 * - React.memo(<Child />)
 *
 * Now, the <TaskBoard /> itself needs to be `React.memo` as well to prevent
 * from Parent being re-rendered.
 * - also, we need to make sure the `getFilteredTasks` is stable as well...
 */

export default function FilterableTaskBoard() {
  const count = useRef(0);
  const countRef = useRef(null);
  const [visibility, setVisibility] = useState("all");
  const getFilteredTasks = useCallback(
    tasks => {
      // Gosh I'm really coding against React here.
      // Invoke in next tick so DOM commits have been made...
      // otherwise we'll miss the update from the initial render.
      // Use `useState` here will cause infinite rendering loop.
      count.current++;
      queueMicrotask(() => (countRef.current.textContent = count.current));
      switch (visibility) {
        case "all":
          return tasks;
        case "active":
          return tasks.filter(t => !t.done);
        case "completed":
          return tasks.filter(t => t.done);
      }
    },
    [visibility]
  );

  return (
    <>
      <select
        size="3"
        value={visibility}
        onChange={e => setVisibility(e.target.value)}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
      <span ref={countRef}>{count.current}</span>
      <TaskBoard getFilteredTasks={getFilteredTasks} />
    </>
  );
}

// const Task = React.memo(({ task, onChange }) => { ... });

const TaskBoard = React.memo(({ getFilteredTasks }) => {
  const [tasks, setTasks] = useState(initialTasks);
  const onChangeTask = useCallback(
    task => setTasks(ts => ts.map(t => (t.id === task.id ? task : t))),
    []
  );
  const filtered = useMemo(
    () => getFilteredTasks(tasks),
    [getFilteredTasks, tasks]
  );
  return (
    <div>
      <AddTask setTasks={setTasks} />
      {filtered.map(task => (
        <Task key={task.id} task={task} onChange={onChangeTask} />
      ))}
    </div>
  );
});

// In <TaskBoard />'s parents:
// const getFilteredTasks = useCallback(() => {...}, [visibility]);
// <TaskBoard getFilteredTasks={getFilteredTasks} />

const Task = React.memo(({ task, onChange }) => {
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
});

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
