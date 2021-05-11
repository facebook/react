import { useMemoCache } from "./useMemoCache";
import React, { createContext, useState, useRef, useContext } from "react";
/**
 * Ch3 TaskBoard use dedicated context.
 *
 * Motivation:
 * Replace `useState` with `useContext`
 */

const TasksContext = createContext(null); // Admittedly, this is a really weird pattern...
// but it save me from copying in the reducer...

const SetTasksContext = createContext(null);
export default function FilterableTaskBoardUsingContext() {
  let $ = useMemoCache(9);
  const count = useRef(0);
  const [visibility, setVisibility] = useState("all");
  let c_visibility = $[1] !== visibility;
  if (c_visibility) $[1] = visibility;
  const [tasks, setTasks] = useState(initialTasks);
  let c_tasks = $[2] !== tasks;
  if (c_tasks) $[2] = tasks;
  const getFilteredTasks = c_visibility ? $[3] = tasks => {
    count.current++;

    switch (visibility) {
      case "all":
        return tasks;

      case "active":
        return tasks.filter(t => !t.done);

      case "completed":
        return tasks.filter(t => t.done);
    }
  } : $[3];
  return <>
      {c_visibility ? $[5] = <select size="3" value={visibility} onChange={$[4] || ($[4] = e => setVisibility(e.target.value))}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select> : $[5]}
      {c_tasks || c_visibility ? $[8] = <SetTasksContext.Provider value={setTasks}>
        {c_tasks || c_visibility ? $[7] = <TasksContext.Provider value={tasks}>
          {c_visibility ? $[6] = <TaskBoard getFilteredTasks={getFilteredTasks} /> : $[6]}
        </TasksContext.Provider> : $[7]}
      </SetTasksContext.Provider> : $[8]}
    </>;
}

function TaskBoard(props) {
  let $ = useMemoCache(4);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_getFilteredTasks = c_props && prevProps.getFilteredTasks !== props.getFilteredTasks;
  const tasks = useContext(TasksContext);
  let c_tasks = $[1] !== tasks;
  if (c_tasks) $[1] = tasks;
  const filtered = c_getFilteredTasks || c_tasks ? $[2] = props.getFilteredTasks(tasks) : $[2];
  return c_getFilteredTasks || c_tasks ? $[3] = <div>
      <AddTask />
      {filtered.map(task => <Task key={task.id} task={task} />)}
    </div> : $[3];
}

function Task(props) {
  let $ = useMemoCache(9);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_task = c_props && prevProps.task !== props.task;
  const setTasks = useContext(SetTasksContext);
  let c_setTasks = $[1] !== setTasks;
  if (c_setTasks) $[1] = setTasks;
  const onChange = c_setTasks ? $[3] = task => setTasks(ts => ts.map(t => t.id === task.id ? task : t)) : $[3];
  const count = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  let c_isEditing = $[2] !== isEditing;
  if (c_isEditing) $[2] = isEditing;
  const taskContent = c_isEditing || c_task || c_setTasks ? $[4] = isEditing ? <>
      <input value={props.task.text} onChange={e => {
      onChange({ ...props.task,
        text: e.target.value
      });
    }} />
      <button onClick={() => setIsEditing(false)}>Save</button>
    </> : <>
      {props.task.text}
      <button onClick={() => setIsEditing(true)}>Edit</button>
    </> : $[4];
  return c_isEditing || c_task || c_setTasks ? $[8] = <li>
      {c_isEditing || c_task || c_setTasks ? $[7] = <label>
        {c_task || c_setTasks ? $[6] = <input type="checkbox" checked={props.task.done} onChange={c_task || c_setTasks ? $[5] = e => {
        onChange({ ...props.task,
          done: e.target.checked
        });
      } : $[5]} /> : $[6]}
        {taskContent}
        {count.current++}
      </label> : $[7]}
    </li> : $[8];
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

function AddTask() {
  let $ = useMemoCache(8);
  const setTasks = useContext(SetTasksContext);
  let c_setTasks = $[1] !== setTasks;
  if (c_setTasks) $[1] = setTasks;
  const [text, setText] = useState(defaultTask);
  let c_text = $[2] !== text;
  if (c_text) $[2] = text;
  const handleAddTask = c_setTasks ? $[3] = text => {
    setTasks(ts => [...ts, {
      id: nextId++,
      text: text,
      done: false
    }]);
  } : $[3];
  return <>
      {c_text ? $[5] = <input placeholder="Add task" value={text} onChange={$[4] || ($[4] = e => setText(e.target.value))} /> : $[5]}
      {c_text || c_setTasks ? $[7] = <button onClick={c_text || c_setTasks ? $[6] = () => {
      setText(defaultTask);
      handleAddTask(text);
    } : $[6]}>
        Add
      </button> : $[7]}
    </>;
}
