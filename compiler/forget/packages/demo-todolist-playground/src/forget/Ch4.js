import { useMemoCache } from "./useMemoCache";
import React, { useState, useRef } from "react";
import { TasksProvider, useTasks, useTasksDispatch } from "./TaskBoardContext";
/**
 * Ch4 TaskBoard use custom hooks
 *
 * Motivation:
 * encapsulate context and reducer as custom hooks.
 */

export default function FilterableTaskBoardUsingCustomHooks() {
  let $ = useMemoCache(7);
  const count = useRef(0);
  const [visibility, setVisibility] = useState("all");
  let c_visibility = $[1] !== visibility;
  if (c_visibility) $[1] = visibility;
  const getFilteredTasks = c_visibility ? $[2] = tasks => {
    count.current++;

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
      {c_visibility ? $[6] = <TasksProvider>
        {c_visibility ? $[5] = <TaskBoard getFilteredTasks={getFilteredTasks} /> : $[5]}
      </TasksProvider> : $[6]}
    </>;
}

function TaskBoard(props) {
  let $ = useMemoCache(4);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_getFilteredTasks = c_props && prevProps.getFilteredTasks !== props.getFilteredTasks;
  const tasks = useTasks();
  let c_tasks = $[1] !== tasks;
  if (c_tasks) $[1] = tasks;
  const filtered = c_getFilteredTasks || c_tasks ? $[2] = props.getFilteredTasks(tasks) : $[2];
  return c_getFilteredTasks || c_tasks ? $[3] = <div>
      <AddTask />
      {filtered.map(task => <Task key={task.id} task={task} />)}
    </div> : $[3];
}

function Task(props) {
  let $ = useMemoCache(8);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_task = c_props && prevProps.task !== props.task;
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  let c_isEditing = $[1] !== isEditing;
  if (c_isEditing) $[1] = isEditing;
  const dispatch = useTasksDispatch();
  let c_dispatch = $[2] !== dispatch;
  if (c_dispatch) $[2] = dispatch;
  const taskContent = c_isEditing || c_task || c_dispatch ? $[3] = isEditing ? <>
      <input value={props.task.text} onChange={e => {
      dispatch({
        type: "changed",
        task: { ...props.task,
          text: e.target.value
        }
      });
    }} />
      <button onClick={() => setIsEditing(false)}>Save</button>
    </> : <>
      {props.task.text}
      <button onClick={() => setIsEditing(true)}>Edit</button>
    </> : $[3];
  return c_isEditing || c_task || c_dispatch ? $[7] = <li>
      {c_isEditing || c_task || c_dispatch ? $[6] = <label>
        {c_task || c_dispatch ? $[5] = <input type="checkbox" checked={props.task.done} onChange={c_dispatch || c_task ? $[4] = e => {
        dispatch({
          type: "changed",
          task: { ...props.task,
            done: e.target.checked
          }
        });
      } : $[4]} /> : $[5]}
        {taskContent}
        {count.current++}
      </label> : $[6]}
    </li> : $[7];
}

let nextId = 3;
const defaultTask = "Code bugs";

function AddTask() {
  let $ = useMemoCache(7);
  const dispatch = useTasksDispatch();
  let c_dispatch = $[1] !== dispatch;
  if (c_dispatch) $[1] = dispatch;
  const [text, setText] = useState(defaultTask);
  let c_text = $[2] !== text;
  if (c_text) $[2] = text;
  return <>
      {c_text ? $[4] = <input placeholder="Add task" value={text} onChange={$[3] || ($[3] = e => setText(e.target.value))} /> : $[4]}
      {c_dispatch || c_text ? $[6] = <button onClick={c_dispatch || c_text ? $[5] = () => {
      setText(defaultTask);
      dispatch({
        type: "added",
        id: nextId++,
        text: text
      });
    } : $[5]}>
        Add
      </button> : $[6]}
    </>;
}
