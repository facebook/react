/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useState} from 'react';

const GITHUB_URL = 'https://github.com';
const REPO_URL = `${GITHUB_URL}/facebook/react`;

function extractPR(summary) {
  const match = summary.match(/#(\d+)/);
  return match ? match[1] : null;
}

function cleanSummary(summary) {
  // Strip trailing PR reference like "(#12345)" since the suffix handles it
  return summary.replace(/\s*\(#\d+\)\s*$/, '');
}

function authorRef(commit) {
  if (commit.github) {
    return `[@${commit.github}](${GITHUB_URL}/${commit.github})`;
  }
  return `@${commit.author}`;
}

function commitSuffix(commit) {
  const pr = extractPR(commit.summary);
  if (pr) {
    return `(${authorRef(commit)} [#${pr}](${REPO_URL}/pull/${pr}))`;
  }
  return `(${authorRef(commit)} [${commit.hash}](${REPO_URL}/commit/${commit.fullHash}))`;
}

function groupSuffix(tagCommits) {
  const authors = new Map();
  const refs = [];
  tagCommits.forEach(commit => {
    const ref = authorRef(commit);
    const key = commit.github || commit.author;
    if (!authors.has(key)) {
      authors.set(key, ref);
    }
    const pr = extractPR(commit.summary);
    if (pr) {
      refs.push(`[#${pr}](${REPO_URL}/pull/${pr})`);
    } else {
      refs.push(`[${commit.hash}](${REPO_URL}/commit/${commit.fullHash})`);
    }
  });
  const authorList = Array.from(authors.values()).join(', ');
  const refList = refs.join(', ');
  return `(${authorList}: ${refList})`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function markdownToHtml(md) {
  return md
    .split('\n')
    .map(line => {
      // Headings
      if (line.startsWith('### '))
        return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (line.startsWith('## '))
        return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      // List items
      if (line.startsWith('- ')) {
        let content = escapeHtml(line.slice(2));
        // Links: [text](url)
        content = content.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank">$1</a>'
        );
        // Bold
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        return `<li>${content}</li>`;
      }
      if (line.trim() === '') return '';
      // Links and bold in plain text
      let content = escapeHtml(line);
      content = content.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank">$1</a>'
      );
      content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // Inline code
      content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
      return `<p>${content}</p>`;
    })
    .join('\n');
}

export default function ReleaseNotes({commits, state, lastRelease}) {
  const [viewMode, setViewMode] = useState('raw');

  const {includedCommits, customTags, tagAssignments} = state;

  // Build tag groups
  const tagGroups = new Map();
  customTags.forEach(t => tagGroups.set(t.id, {tag: t, commits: []}));

  const untagged = [];

  commits.forEach(commit => {
    if (!includedCommits[commit.hash]) return;

    const commitTagIds = tagAssignments[commit.hash] || [];
    const firstTagId = commitTagIds.find(id => tagGroups.has(id));
    if (firstTagId) {
      tagGroups.get(firstTagId).commits.push(commit);
    } else {
      untagged.push(commit);
    }
  });

  // Generate markdown
  const lines = [];
  lines.push(`## React ${lastRelease}\n`);

  // Tag sections
  const activeTags = Array.from(tagGroups.values()).filter(
    g => g.commits.length > 0
  );
  activeTags.forEach(({tag, commits: tagCommits}) => {
    lines.push(`### ${tag.name}\n`);
    if (tag.isFeature) {
      lines.push(
        `- [${tag.name}] <insert-description> ${groupSuffix(tagCommits)}`
      );
    } else {
      tagCommits.forEach(commit => {
        lines.push(`- ${cleanSummary(commit.summary)} ${commitSuffix(commit)}`);
      });
    }
    lines.push('');
  });

  // Untagged
  if (untagged.length > 0) {
    lines.push(`### Other changes\n`);
    untagged.forEach(commit => {
      lines.push(`- ${cleanSummary(commit.summary)} ${commitSuffix(commit)}`);
    });
  }

  const markdown = lines.join('\n');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
  };

  return (
    <div>
      <div className="release-notes-header">
        <button className="copy-btn" onClick={copyToClipboard}>
          Copy to clipboard
        </button>
        <div className="view-toggle">
          <button
            className={viewMode === 'raw' ? 'active' : ''}
            onClick={() => setViewMode('raw')}>
            Raw
          </button>
          <button
            className={viewMode === 'preview' ? 'active' : ''}
            onClick={() => setViewMode('preview')}>
            Preview
          </button>
        </div>
      </div>
      {viewMode === 'raw' ? (
        <pre>{markdown}</pre>
      ) : (
        <div
          className="markdown-preview"
          dangerouslySetInnerHTML={{__html: markdownToHtml(markdown)}}
        />
      )}
    </div>
  );
}
