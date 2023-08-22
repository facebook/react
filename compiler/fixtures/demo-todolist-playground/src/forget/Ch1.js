/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
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
  let $ = useMemoCache(4);
  const [tasks, setTasks] = useState(initialTasks);
  let c_tasks = $[1] !== tasks;
  if (c_tasks) $[1] = tasks;

  const onChangeTask = $[2] || ($[2] = task => setTasks(ts => ts.map(t => t.id === task.id ? task : t)));

  return c_tasks ? $[3] = <div>
      <AddTask setTasks={setTasks} />
      {tasks.map(task => <Task key={task.id} task={task} onChange={onChangeTask} />)}
    </div> : $[3];
}

export default TaskBoard;

function Task(props) {
  let $ = useMemoCache(7);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_task = c_props && prevProps.task !== props.task;
  let c_onChange = c_props && prevProps.onChange !== props.onChange;
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  let c_isEditing = $[1] !== isEditing;
  if (c_isEditing) $[1] = isEditing;
  const taskContent = c_isEditing || c_task || c_onChange ? $[2] = isEditing ? <>
      <input value={props.task.text} onChange={e => {
      props.onChange({ ...props.task,
        text: e.target.value
      });
    }} />
      <button onClick={() => setIsEditing(false)}>Save</button>
    </> : <>
      {props.task.text}
      <button onClick={() => setIsEditing(true)}>Edit</button>
    </> : $[2];
  return c_isEditing || c_task || c_onChange ? $[6] = <li>
      {c_isEditing || c_task || c_onChange ? $[5] = <label>
        {c_task || c_onChange ? $[4] = <input type="checkbox" checked={props.task.done} onChange={c_onChange || c_task ? $[3] = e => {
        props.onChange({ ...props.task,
          done: e.target.checked
        });
      } : $[3]} /> : $[4]}
        {taskContent}
        {count.current++}
      </label> : $[5]}
    </li> : $[6];
}

let nextId = 3;
const defaultTask = "Code bugs";
const initialTasks = [{
  id: 0,
  text: "Buy milk",
  done: true
}, {
  id: 1,
  text: "Eat tacos",
  done: false
}, {
  id: 2,
  text: "Brew tea",
  done: false
}];

function AddTask(props) {
  let $ = useMemoCache(7);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_setTasks = c_props && prevProps.setTasks !== props.setTasks;
  const [text, setText] = useState(defaultTask);
  let c_text = $[1] !== text;
  if (c_text) $[1] = text;
  const handleAddTask = c_setTasks ? $[2] = text => {
    props.setTasks(ts => [...ts, {
      id: nextId++,
      text: text,
      done: false
    }]);
  } : $[2];
  return <>
      {c_text ? $[4] = <input placeholder="Add task" value={text} onChange={$[3] || ($[3] = e => setText(e.target.value))} /> : $[4]}
      {c_text || c_setTasks ? $[6] = <button onClick={c_text || c_setTasks ? $[5] = () => {
      setText(defaultTask);
      handleAddTask(text);
    } : $[5]}>
        Add
      </button> : $[6]}
    </>;
}
