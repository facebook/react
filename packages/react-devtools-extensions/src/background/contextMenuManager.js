/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* global chrome */

import {
  executeScriptInMainWorld,
  executeScriptInIsolatedWorld,
} from './executeScript';

const CONTEXT_MENU_ID = 'react-devtools-inspect-element';

// Track inspection state per tab
const inspectionStatePerTab: {[tabId: number]: boolean} = {};

// Create context menu on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Also create on startup in case extension was already installed
chrome.runtime.onStartup?.addListener(() => {
  createContextMenu();
});

function createContextMenu(): void {
  // Remove existing menu item first to avoid duplicates
  chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
    // Access lastError to suppress "Unchecked runtime.lastError" warnings
    void chrome.runtime.lastError;

    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Inspect React Component',
      contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image'],
    });
  });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id != null) {
    toggleInspectionMode(tab.id);
  }
});

async function toggleInspectionMode(tabId: number): Promise<void> {
  const isActive = inspectionStatePerTab[tabId] || false;

  if (isActive) {
    await stopInspectionMode(tabId);
  } else {
    await startInspectionMode(tabId);
  }
}

async function startInspectionMode(tabId: number): Promise<void> {
  try {
    // Phase 1: Inject loading indicator and hook in parallel (no dependencies)
    await Promise.all([
      // Show loading indicator for immediate visual feedback
      executeScriptInMainWorld({
        target: {tabId},
        files: ['build/inspectionLoading.js'],
        injectImmediately: true,
      }),
      // Inject the hook if it doesn't exist (has guard against double installation)
      executeScriptInMainWorld({
        target: {tabId},
        files: ['build/installHook.js'],
        injectImmediately: true,
      }),
    ]);

    // Phase 2: Inject backend and proxy in parallel (backend needs hook, proxy has no deps)
    await Promise.all([
      // Backend script registers Agent/Bridge/initBackend in hook.backends
      executeScriptInMainWorld({
        target: {tabId},
        files: ['build/react_devtools_backend_compact.js'],
        injectImmediately: true,
      }),
      // Proxy script bridges chrome.runtime messages to postMessage
      executeScriptInIsolatedWorld({
        target: {tabId},
        files: ['build/standaloneInspectorProxy.js'],
      }),
    ]);

    // Phase 3: Inject main inspector script (needs hook + backend)
    await executeScriptInMainWorld({
      target: {tabId},
      files: ['build/standaloneInspector.js'],
      injectImmediately: true,
    });

    // Send message to start inspection
    chrome.tabs.sendMessage(tabId, {
      source: 'react-devtools-context-menu',
      type: 'startInspection',
    });

    inspectionStatePerTab[tabId] = true;
    updateContextMenuTitleForTab(tabId);
  } catch (error) {
    console.error('Failed to start React DevTools inspection mode:', error);
  }
}

async function stopInspectionMode(tabId: number): Promise<void> {
  try {
    chrome.tabs.sendMessage(tabId, {
      source: 'react-devtools-context-menu',
      type: 'stopInspection',
    });

    inspectionStatePerTab[tabId] = false;
    updateContextMenuTitleForTab(tabId);
  } catch (error) {
    console.error('Failed to stop React DevTools inspection mode:', error);
  }
}

function updateContextMenuTitleForTab(tabId: number): void {
  const isActive = inspectionStatePerTab[tabId] || false;
  chrome.contextMenus.update(CONTEXT_MENU_ID, {
    title: isActive ? 'Stop Inspecting React' : 'Inspect React Component',
  });
}

async function updateContextMenuForActiveTab(): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab?.id != null) {
      updateContextMenuTitleForTab(activeTab.id);
    }
  } catch {
    // Ignore errors (e.g., no active tab)
  }
}

// Clean up when tab closes
chrome.tabs.onRemoved.addListener(tabId => {
  const wasActive = inspectionStatePerTab[tabId];
  delete inspectionStatePerTab[tabId];
  // Update menu title in case the closed tab was active
  if (wasActive) {
    updateContextMenuForActiveTab();
  }
});

// Reset state when tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' && inspectionStatePerTab[tabId]) {
    // Page is navigating - reset inspection state
    inspectionStatePerTab[tabId] = false;
    updateContextMenuForActiveTab();
  }
});

// Update context menu title when switching tabs
chrome.tabs.onActivated.addListener(activeInfo => {
  updateContextMenuTitleForTab(activeInfo.tabId);
});

// Handle messages from standalone inspector
export function handleStandaloneInspectorMessage(
  message: {type: string, ...},
  sender: {tab?: {id?: number}, ...},
): void {
  const tabId = sender.tab?.id;
  if (tabId == null) {
    return;
  }

  switch (message.type) {
    case 'inspectionStopped': {
      inspectionStatePerTab[tabId] = false;
      updateContextMenuTitleForTab(tabId);
      break;
    }
  }
}
