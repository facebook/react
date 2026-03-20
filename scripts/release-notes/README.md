# Release Notes Generator

Tool for generating release notes.

## Setup

```sh
cd scripts/release-notes
yarn install
```

## Usage

### 1. Generate commit data

```sh
yarn gen-data -v <version>
```

This exports all commits since the given git tag to `data/commits.json`. It also resolves GitHub usernames for each commit author via the GitHub API (requires `gh` CLI to be authenticated).

Example:
```sh
yarn gen-data -v 19.1.0
```

### 2. Run the app

```sh
yarn dev
```

### 3. Triage commits

- **Include/Reviewed checkboxes** — mark commits to include in the release notes or mark as reviewed (reviewed-only commits fade out)
- **Tags** — assign custom tags to group related commits together
- **Filters** — filter the table by text search, reviewed status, category, or tag

## State

Triage state (selections, tags, assignments) is saved to `state.json` automatically. This is gitignored. Regenerating commit data does not affect saved state.
