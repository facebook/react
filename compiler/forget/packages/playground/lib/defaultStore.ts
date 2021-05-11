/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { Store } from "./stores";
import { createInputFile } from "./stores";
import { createCompilerFlags } from "babel-plugin-react-forget";

// Entry point to rendering Preview.
const _app = `\
import { createRoot } from "react-dom/client";
import Home from "./index";

// Persist the root in the global scope.
let root = globalThis.Forget$PlaygroundRoot;
if (!root) {
  root = createRoot(document.getElementById("app"));
  globalThis.Forget$PlaygroundRoot = root;
}

root.render(<Home />);
`;

// TODO: Add banner similar to the one in Preview to aid the user
// instead of using the comment below.
const index = `\
import { useState } from "react";
import "./styles.css";
import Task from "./Task";
import AddTask from "./AddTask";

const initialTasks = [
  { id: 0, text: "Buy milk", done: true },
  { id: 1, text: "Eat tacos", done: false },
  { id: 2, text: "Brew tea", done: false },
];

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

// Default export a React component to render in the Preview.
export default TaskBoard;
`;

const task = `\
import { useState, useRef } from "react";

export default function Task({ task, onChange }) {
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);

  let taskContent;
  if (isEditing) {
    taskContent = (
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
    )
  } else {
    taskContent = (
      <>
        {task.text}
        <button onClick={() => setIsEditing(true)}>Edit</button>
      </>
    )
  }

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
}`;

const addTask = `\
import { useState } from "react";

const defaultTask = "Code bugs";
let nextId = 3;

export default function AddTask({ setTasks }) {
  const [text, setText] = useState(defaultTask);
  const handleAddTask = (text) => {
    setTasks((ts) => [
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
        onChange={(e) => setText(e.target.value)}
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
`;

const styles = `\
* {
  box-sizing: border-box;
}

body {
  font-family: "Optimistic Display App", sans-serif;
  margin: 20px;
  padding: 0;
}

h1 {
  margin-top: 0;
  font-size: 22px;
}

h2 {
  margin-top: 0;
  font-size: 20px;
}

h3 {
  margin-top: 0;
  font-size: 18px;
}

h4 {
  margin-top: 0;
  font-size: 16px;
}

h5 {
  margin-top: 0;
  font-size: 14px;
}

h6 {
  margin-top: 0;
  font-size: 12px;
}

ul {
  padding-left: 20px;
}

button { margin: 5px; }
li { list-style-type: none; }
ul, li { margin: 0; padding: 0; }
`;

const defaultFiles: Store["files"] = [
  // Hidden tab.
  createInputFile("_app.js", _app),
  createInputFile("index.js", index),
  createInputFile("Task.js", task),
  createInputFile("AddTask.js", addTask),
  createInputFile("styles.css", styles),
];

export const defaultStore: Store = {
  files: defaultFiles,
  selectedFileId: "index.js",
  compilerFlags: createCompilerFlags(),
};

const minimalIndex = `\
export default function MyApp() {
  return <div>Hello World</div>;
}
`;

export const minimalStore: Store = {
  files: [
    createInputFile("_app.js", _app),
    createInputFile("index.js", minimalIndex),
  ],
  selectedFileId: "index.js",
  compilerFlags: createCompilerFlags(),
};

export const emptyStore: Store = {
  files: [createInputFile("_app.js", _app)],
  selectedFileId: "_app.js",
  compilerFlags: createCompilerFlags(),
};
