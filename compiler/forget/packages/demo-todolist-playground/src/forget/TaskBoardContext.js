/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
import { createContext, useContext, useReducer } from "react";
const TasksContext = createContext(null);
const TasksDispatchContext = createContext(null);
export function TasksProvider(props) {
  let $ = useMemoCache(4);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_children = c_props && prevProps.children !== props.children;
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  let c_tasks = $[1] !== tasks;
  if (c_tasks) $[1] = tasks;
  return c_tasks || c_children ? $[3] = <TasksContext.Provider value={tasks}>
      {c_children ? $[2] = <TasksDispatchContext.Provider value={dispatch}>
        {props.children}
      </TasksDispatchContext.Provider> : $[2]}
    </TasksContext.Provider> : $[3];
}
export function useTasks() {
  let $ = useMemoCache(1);
  return useContext(TasksContext);
}
export function useTasksDispatch() {
  let $ = useMemoCache(1);
  return useContext(TasksDispatchContext);
}

function tasksReducer(tasks, action) {
  switch (action.type) {
    case "added":
      {
        return [...tasks, {
          id: action.id,
          text: action.text,
          done: false
        }];
      }

    case "changed":
      {
        return tasks.map(t => {
          if (t.id === action.task.id) {
            return action.task;
          } else {
            return t;
          }
        });
      }

    case "deleted":
      {
        return tasks.filter(t => t.id !== action.id);
      }

    default:
      {
        throw Error("Unknown action: " + action.type);
      }
  }
}

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
