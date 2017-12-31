/* @flow */
declare var document: WeexDocument;

import { warn } from 'core/util/index'

export const RECYCLE_LIST_MARKER = '@inRecycleList'

// Register the component hook to weex native render engine.
// The hook will be triggered by native, not javascript.
export function registerComponentHook (
  componentId: string,
  type: string, // hook type, could be "lifecycle" or "instance"
  hook: string, // hook name
  fn: Function
) {
  if (!document || !document.taskCenter) {
    warn(`Can't find available "document" or "taskCenter".`)
    return
  }
  if (typeof document.taskCenter.registerHook === 'function') {
    return document.taskCenter.registerHook(componentId, type, hook, fn)
  }
  warn(`Failed to register component hook "${type}@${hook}#${componentId}".`)
}

// Updates the state of the component to weex native render engine.
export function updateComponentData (
  componentId: string,
  newData: Object | void,
  callback?: Function
) {
  if (!document || !document.taskCenter) {
    warn(`Can't find available "document" or "taskCenter".`)
    return
  }
  if (typeof document.taskCenter.updateData === 'function') {
    return document.taskCenter.updateData(componentId, newData, callback)
  }
  warn(`Failed to update component data (${componentId}).`)
}
