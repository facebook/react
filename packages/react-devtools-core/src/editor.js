/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {existsSync} from 'fs';
import {basename, join, isAbsolute} from 'path';
import {execSync, spawn} from 'child_process';
import {parse} from 'shell-quote';

// Characters that cmd.exe interprets as shell operators, enabling OS command
// injection (CWE-78) when user-controlled strings are passed via /C.
const SHELL_METACHARACTERS_RE = /[;&|`$<>()\n\r]/;

function isTerminalEditor(editor: string): boolean {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true;
    default:
      return false;
  }
}

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
const COMMON_EDITORS = {
  '/Applications/Atom.app/Contents/MacOS/Atom': 'atom',
  '/Applications/Atom Beta.app/Contents/MacOS/Atom Beta':
    '/Applications/Atom Beta.app/Contents/MacOS/Atom Beta',
  '/Applications/Sublime Text.app/Contents/MacOS/Sublime Text':
    '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
  '/Applications/Sublime Text 2.app/Contents/MacOS/Sublime Text 2':
    '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
  '/Applications/Visual Studio Code.app/Contents/MacOS/Electron': 'code',
};

function getArgumentsForLineNumber(
  editor: string,
  filePath: string,
  lineNumber: number,
): Array<string> {
  switch (basename(editor)) {
    case 'vim':
    case 'mvim':
      return [filePath, '+' + lineNumber];
    case 'atom':
    case 'Atom':
    case 'Atom Beta':
    case 'subl':
    case 'sublime':
    case 'wstorm':
    case 'appcode':
    case 'charm':
    case 'idea':
      return [filePath + ':' + lineNumber];
    case 'joe':
    case 'emacs':
    case 'emacsclient':
      return ['+' + lineNumber, filePath];
    case 'rmate':
    case 'mate':
    case 'mine':
      return ['--line', lineNumber + '', filePath];
    case 'code':
      return ['-g', filePath + ':' + lineNumber];
    default:
      // For all others, drop the lineNumber until we have
      // a mapping above, since providing the lineNumber incorrectly
      // can result in errors or confusing behavior.
      return [filePath];
  }
}

function guessEditor(): Array<string> {
  // Explicit config always wins
  if (process.env.REACT_EDITOR) {
    return parse(process.env.REACT_EDITOR);
  }

  // Using `ps x` on OSX we can find out which editor is currently running.
  // Potentially we could use similar technique for Windows and Linux
  if (process.platform === 'darwin') {
    try {
      const output = execSync('ps x').toString();
      const processNames = Object.keys(COMMON_EDITORS);
      for (let i = 0; i < processNames.length; i++) {
        const processName = processNames[i];
        if (output.indexOf(processName) !== -1) {
          return [COMMON_EDITORS[processName]];
        }
      }
    } catch (error) {
      // Ignore...
    }
  }

  // Last resort, use old-school env vars.
  // Parse via shell-quote (same as REACT_EDITOR) so the value is split on
  // spaces but shell metacharacters are not expanded into a shell command.
  if (process.env.VISUAL) {
    return parse(process.env.VISUAL);
  } else if (process.env.EDITOR) {
    return parse(process.env.EDITOR);
  }

  return [];
}

let childProcess = null;

export function getValidFilePath(
  maybeRelativePath: string,
  absoluteProjectRoots: Array<string>,
): string | null {
  // We use relative paths at Facebook with deterministic builds.
  // This is why our internal tooling calls React DevTools with absoluteProjectRoots.
  // If the filename is absolute then we don't need to care about this.

  // Reject paths containing shell metacharacters to prevent CWE-78 OS Command
  // Injection. On Windows, file paths are passed through cmd.exe which
  // interprets characters like &, |, ; as shell operators.
  if (SHELL_METACHARACTERS_RE.test(maybeRelativePath)) {
    return null;
  }

  if (isAbsolute(maybeRelativePath)) {
    if (existsSync(maybeRelativePath)) {
      return maybeRelativePath;
    }
  } else {
    for (let i = 0; i < absoluteProjectRoots.length; i++) {
      const projectRoot = absoluteProjectRoots[i];
      const joinedPath = join(projectRoot, maybeRelativePath);
      if (existsSync(joinedPath)) {
        return joinedPath;
      }
    }
  }

  return null;
}

export function doesFilePathExist(
  maybeRelativePath: string,
  absoluteProjectRoots: Array<string>,
): boolean {
  return getValidFilePath(maybeRelativePath, absoluteProjectRoots) !== null;
}

export function launchEditor(
  maybeRelativePath: string,
  lineNumber: number,
  absoluteProjectRoots: Array<string>,
) {
  const filePath = getValidFilePath(maybeRelativePath, absoluteProjectRoots);
  if (filePath === null) {
    return;
  }

  // Sanitize lineNumber to prevent malicious use on win32
  // via: https://github.com/nodejs/node/blob/c3bb4b1aa5e907d489619fb43d233c3336bfc03d/lib/child_process.js#L333
  if (lineNumber && isNaN(lineNumber)) {
    return;
  }

  const [editor, ...destructuredArgs] = guessEditor();
  if (!editor) {
    return;
  }

  // Reject editor binaries containing shell metacharacters to prevent CWE-78.
  // On Windows the editor string is passed to cmd.exe /C which would interpret
  // operators like & and | as command separators.
  if (SHELL_METACHARACTERS_RE.test(editor)) {
    return;
  }

  let args = destructuredArgs;

  if (lineNumber) {
    args = args.concat(getArgumentsForLineNumber(editor, filePath, lineNumber));
  } else {
    args.push(filePath);
  }

  if (childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    childProcess.kill('SIGKILL');
  }

  if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.
    childProcess = spawn('cmd.exe', ['/C', editor].concat(args), {
      stdio: 'inherit',
    });
  } else {
    childProcess = spawn(editor, args, {stdio: 'inherit'});
  }
  childProcess.on('error', function () {});
  // $FlowFixMe[incompatible-use] found when upgrading Flow
  childProcess.on('exit', function () {
    childProcess = null;
  });
}
