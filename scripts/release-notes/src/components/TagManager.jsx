/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useState} from 'react';

export default function TagManager({tags, onTagsChange}) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const addTag = () => {
    if (!newName.trim()) return;
    const id = 'tag_' + Date.now();
    onTagsChange([
      ...tags,
      {id, name: newName.trim(), color: newColor, isFeature: false},
    ]);
    setNewName('');
  };

  const deleteTag = id => {
    onTagsChange(tags.filter(t => t.id !== id));
  };

  const startEdit = tag => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const saveEdit = id => {
    onTagsChange(
      tags.map(t => (t.id === id ? {...t, name: editName.trim()} : t))
    );
    setEditingId(null);
  };

  const changeColor = (id, color) => {
    onTagsChange(tags.map(t => (t.id === id ? {...t, color} : t)));
  };

  const toggleFeature = id => {
    onTagsChange(
      tags.map(t => (t.id === id ? {...t, isFeature: !t.isFeature} : t))
    );
  };

  return (
    <div>
      {tags.map(tag => (
        <div key={tag.id} className="manager-row">
          <input
            type="color"
            value={tag.color}
            onChange={e => changeColor(tag.id, e.target.value)}
          />
          {editingId === tag.id ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => saveEdit(tag.id)}
              onKeyDown={e => e.key === 'Enter' && saveEdit(tag.id)}
              autoFocus
            />
          ) : (
            <span onClick={() => startEdit(tag)} style={{cursor: 'pointer'}}>
              {tag.name}
            </span>
          )}
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={tag.isFeature || false}
              onChange={() => toggleFeature(tag.id)}
            />
            Feature group
          </label>
          <button className="delete-btn" onClick={() => deleteTag(tag.id)}>
            x
          </button>
        </div>
      ))}
      <div className="manager-row">
        <input
          type="color"
          value={newColor}
          onChange={e => setNewColor(e.target.value)}
        />
        <input
          type="text"
          value={newName}
          placeholder="New tag name..."
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
        />
        <button className="toolbar-btn" onClick={addTag}>
          Add
        </button>
      </div>
    </div>
  );
}
