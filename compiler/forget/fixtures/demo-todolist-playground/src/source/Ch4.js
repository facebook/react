/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef } from "react";
import { TasksProvider, useTasks, useTasksDispatch } from "./TaskBoardContext";

/**
 * Ch4 TaskBoard use custom hooks
 *
 * Motivation:
 * encapsulate context and reducer as custom hooks.
 */

export default function FilterableTaskBoardUsingCustomHooks() {
  const count = useRef(0);
  const [visibility, setVisibility] = useState("all");
  const getFilteredTasks = tasks => {
    count.current++;
    switch (visibility) {
      case "all":
        return tasks;
      case "active":
        return tasks.filter(t => !t.done);
      case "completed":
        return tasks.filter(t => t.done);
    }
  };

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
      <TasksProvider>
        <TaskBoard getFilteredTasks={getFilteredTasks} />
      </TasksProvider>
    </>
  );
}

function TaskBoard({ getFilteredTasks }) {
  const tasks = useTasks();
  const filtered = getFilteredTasks(tasks);

  return (
    <div>
      <AddTask />
      {filtered.map(task => (
        <Task key={task.id} task={task} />
      ))}
    </div>
  );
}

function Task({ task }) {
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useTasksDispatch();
  const taskContent = isEditing ? (
    <>
      <input
        value={task.text}
        onChange={e => {
          dispatch({
            type: "changed",
            task: {
              ...task,
              text: e.target.value,
            },
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
            dispatch({
              type: "changed",
              task: {
                ...task,
                done: e.target.checked,
              },
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

function AddTask() {
  const dispatch = useTasksDispatch();
  const [text, setText] = useState(defaultTask);

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
          dispatch({
            type: "added",
            id: nextId++,
            text: text,
          });
        }}
      >
        Add
      </button>
    </>
  );
}
