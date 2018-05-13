// TODO

export const isPrimaryRenderer = $$$hostConfig.isPrimaryRenderer;
export const supportsMutation = $$$hostConfig.supportsMutation;
export const supportsHydration = $$$hostConfig.supportsHydration;
export const supportsPersistence = $$$hostConfig.supportsPersistence;

export function getRootHostContext() {
  return $$$hostConfig.getRootHostContext.apply(this, arguments);
}

export function getChildHostContext() {
  return $$$hostConfig.getChildHostContext.apply(this, arguments);
}

export function getPublicInstance() {
  return $$$hostConfig.getPublicInstance.apply(this, arguments);
}

export function createInstance() {
  return $$$hostConfig.createInstance.apply(this, arguments);
}

export function appendInitialChild() {
  return $$$hostConfig.appendInitialChild.apply(this, arguments);
}

export function finalizeInitialChildren() {
  return $$$hostConfig.finalizeInitialChildren.apply(this, arguments);
}

export function prepareUpdate() {
  return $$$hostConfig.prepareUpdate.apply(this, arguments);
}

export function shouldSetTextContent() {
  return $$$hostConfig.shouldSetTextContent.apply(this, arguments);
}

export function shouldDeprioritizeSubtree() {
  return $$$hostConfig.shouldDeprioritizeSubtree.apply(this, arguments);
}

export function createTextInstance() {
  return $$$hostConfig.createTextInstance.apply(this, arguments);
}

export function scheduleDeferredCallback() {
  return $$$hostConfig.scheduleDeferredCallback.apply(this, arguments);
}

export function cancelDeferredCallback() {
  return $$$hostConfig.cancelDeferredCallback.apply(this, arguments);
}

export function prepareForCommit() {
  return $$$hostConfig.prepareForCommit.apply(this, arguments);
}

export function resetAfterCommit() {
  return $$$hostConfig.resetAfterCommit.apply(this, arguments);
}

export function now() {
  return $$$hostConfig.now.apply(this, arguments);
}

export function commitUpdate() {
  return $$$hostConfig.commitUpdate.apply(this, arguments);
}

export function commitMount() {
  return $$$hostConfig.commitMount.apply(this, arguments);
}

export function commitTextUpdate() {
  return $$$hostConfig.commitTextUpdate.apply(this, arguments);
}

export function resetTextContent() {
  return $$$hostConfig.resetTextContent.apply(this, arguments);
}

export function appendChild() {
  return $$$hostConfig.appendChild.apply(this, arguments);
}

export function appendChildToContainer() {
  return $$$hostConfig.appendChildToContainer.apply(this, arguments);
}

export function insertBefore() {
  return $$$hostConfig.insertBefore.apply(this, arguments);
}

export function insertInContainerBefore() {
  return $$$hostConfig.insertInContainerBefore.apply(this, arguments);
}

export function removeChild() {
  return $$$hostConfig.removeChild.apply(this, arguments);
}

export function removeChildFromContainer() {
  return $$$hostConfig.removeChildFromContainer.apply(this, arguments);
}

export function cloneInstance() {
  return $$$hostConfig.cloneInstance.apply(this, arguments);
}

export function createContainerChildSet() {
  return $$$hostConfig.createContainerChildSet.apply(this, arguments);
}

export function appendChildToContainerChildSet() {
  return $$$hostConfig.appendChildToContainerChildSet.apply(this, arguments);
}

export function finalizeContainerChildren() {
  return $$$hostConfig.finalizeContainerChildren.apply(this, arguments);
}

export function replaceContainerChildren() {
  return $$$hostConfig.replaceContainerChildren.apply(this, arguments);
}

export function canHydrateInstance() {
  return $$$hostConfig.canHydrateInstance.apply(this, arguments);
}

export function canHydrateTextInstance() {
  return $$$hostConfig.canHydrateTextInstance.apply(this, arguments);
}

export function getNextHydratableSibling() {
  return $$$hostConfig.getNextHydratableSibling.apply(this, arguments);
}

export function getFirstHydratableChild() {
  return $$$hostConfig.getFirstHydratableChild.apply(this, arguments);
}

export function hydrateInstance() {
  return $$$hostConfig.hydrateInstance.apply(this, arguments);
}

export function hydrateTextInstance() {
  return $$$hostConfig.hydrateTextInstance.apply(this, arguments);
}

export function didNotMatchHydratedContainerTextInstance() {
  return $$$hostConfig.didNotMatchHydratedContainerTextInstance.apply(this, arguments);
}

export function didNotMatchHydratedTextInstance() {
  return $$$hostConfig.didNotMatchHydratedTextInstance.apply(this, arguments);
}

export function didNotHydrateContainerInstance() {
  return $$$hostConfig.didNotHydrateContainerInstance.apply(this, arguments);
}

export function didNotHydrateInstance() {
  return $$$hostConfig.didNotHydrateInstance.apply(this, arguments);
}

export function didNotFindHydratableContainerInstance() {
  return $$$hostConfig.didNotFindHydratableContainerInstance.apply(this, arguments);
}

export function didNotFindHydratableContainerTextInstance() {
  return $$$hostConfig.didNotFindHydratableContainerTextInstance.apply(this, arguments);
}

export function didNotFindHydratableInstance() {
  return $$$hostConfig.didNotFindHydratableInstance.apply(this, arguments);
}

export function didNotFindHydratableTextInstance() {
  return $$$hostConfig.didNotFindHydratableTextInstance.apply(this, arguments);
}
