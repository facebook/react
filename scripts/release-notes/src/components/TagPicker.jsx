/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function TagPicker({tags, selectedTagIds, onChange}) {
  const toggle = tagId => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (tags.length === 0) return null;

  return (
    <div className="tag-picker">
      {tags.map(tag => (
        <button
          key={tag.id}
          className={`tag-btn ${selectedTagIds.includes(tag.id) ? 'active' : ''}`}
          style={{backgroundColor: tag.color, color: 'black'}}
          onClick={() => toggle(tag.id)}>
          {tag.name}
        </button>
      ))}
    </div>
  );
}
