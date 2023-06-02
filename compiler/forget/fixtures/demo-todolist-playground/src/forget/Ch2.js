/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
import React, { useState, useRef } from "react";
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
 * - also, you need to make sure the `getFilteredTasks` is stable as well...
 */

export default FilterableTaskBoard;

function FilterableTaskBoard() {
  let $ = useMemoCache(6);
  const count = useRef(0);
  const countRef = useRef(null);
  const [visibility, setVisibility] = useState("all");
  let c_visibility = $[1] !== visibility;
  if (c_visibility) $[1] = visibility;
  const getFilteredTasks = c_visibility ? $[2] = tasks => {
    // Gosh I'm really coding against React here.
    // Invoke in next tick so DOM commits have been made...
    // otherwise we'll miss the update from the initial render.
    // Use `useState` here will cause infinite rendering loop.
    count.current++;
    queueMicrotask(() => countRef.current.textContent = count.current);

    switch (visibility) {
      case "all":
        return tasks;

      case "active":
        return tasks.filter(t => !t.done);

      case "completed":
        return tasks.filter(t => t.done);
    }
  } : $[2];
  return <>
      {c_visibility ? $[4] = <select size="3" value={visibility} onChange={$[3] || ($[3] = e => setVisibility(e.target.value))}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select> : $[4]}
      <span ref={countRef}>{count.current}</span>
      {c_visibility ? $[5] = <TaskBoard getFilteredTasks={getFilteredTasks} /> : $[5]}
    </>;
}

const TaskBoard = props => {
  let $ = useMemoCache(5);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_getFilteredTasks = c_props && prevProps.getFilteredTasks !== props.getFilteredTasks;
  const [tasks, setTasks] = useState(initialTasks);
  let c_tasks = $[1] !== tasks;
  if (c_tasks) $[1] = tasks;

  const onChangeTask = $[2] || ($[2] = task => setTasks(ts => ts.map(t => t.id === task.id ? task : t)));

  const filtered = c_getFilteredTasks || c_tasks ? $[3] = props.getFilteredTasks(tasks) : $[3];
  return c_getFilteredTasks || c_tasks ? $[4] = <div>
      <AddTask setTasks={setTasks} />
      {filtered.map(task => <Task key={task.id} task={task} onChange={onChangeTask} />)}
    </div> : $[4];
};

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
