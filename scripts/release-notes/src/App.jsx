/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useCallback, useEffect, useState} from 'react';
import {fetchState, saveState} from './api';
import commitData from '../data/commits.json';
import CommitTable from './components/CommitTable';
import TagManager from './components/TagManager';
import ReleaseNotes from './components/ReleaseNotes';
import stateData from '../data/state.json';

const DEFAULT_STATE = {
  includedCommits: {},
  reviewedCommits: {},
  customTags: [],
  tagAssignments: {},
};

export {DEFAULT_STATE};

export default function App() {
  const {commits, lastRelease} = commitData;
  const [state, setState] = useState(() => ({...DEFAULT_STATE, ...stateData}));
  const [showTagManager, setShowTagManager] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const updateState = newState => {
    setState(newState);
    saveState(newState);
  };

  const handleTagsChange = useCallback(
    newTags => {
      if (!state) return;
      const tagIds = new Set(newTags.map(t => t.id));
      const cleanedAssignments = {};
      for (const [hash, ids] of Object.entries(state.tagAssignments)) {
        const filtered = ids.filter(id => tagIds.has(id));
        if (filtered.length > 0) {
          cleanedAssignments[hash] = filtered;
        }
      }
      updateState({
        ...state,
        customTags: newTags,
        tagAssignments: cleanedAssignments,
      });
    },
    [state, updateState]
  );

  useEffect(() => {
    if (!showTagManager) return;
    const handleEscape = e => {
      if (e.key === 'Escape') setShowTagManager(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTagManager]);

  const unreviewed = commits.filter(c => !state.reviewedCommits[c.hash]).length;

  return (
    <div>
      <div className="app-header">
        <h1>
          React commits since {lastRelease} ({commits.length} commits,{' '}
          {unreviewed} unreviewed)
        </h1>
        <div className="header-controls">
          <button
            className="toolbar-btn"
            onClick={() => setShowTagManager(!showTagManager)}>
            Manage Tags
          </button>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? 'Hide Release Notes' : 'Show Release Notes'}
          </button>
        </div>
      </div>
      <div className={`layout ${showSidebar ? '' : 'layout-full'}`}>
        <div>
          <CommitTable
            commits={commits}
            state={state}
            onStateChange={updateState}
          />
        </div>
        {showSidebar && (
          <div className="release-notes-panel">
            <ReleaseNotes
              commits={commits}
              state={state}
              lastRelease={lastRelease}
            />
          </div>
        )}
      </div>
      {showTagManager && (
        <div
          className="modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setShowTagManager(false);
          }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Manage Tags</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowTagManager(false)}>
                &times;
              </button>
            </div>
            <TagManager
              tags={state.customTags}
              onTagsChange={handleTagsChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
