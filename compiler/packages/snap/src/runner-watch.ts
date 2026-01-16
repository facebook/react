/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import watcher from '@parcel/watcher';
import path from 'path';
import ts from 'typescript';
import {FIXTURES_PATH, PROJECT_ROOT} from './constants';
import {TestFilter} from './fixture-utils';
import {execSync} from 'child_process';

export function watchSrc(
  onStart: () => void,
  onComplete: (isSuccess: boolean) => void,
): ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> {
  const configPath = ts.findConfigFile(
    /*searchPath*/ PROJECT_ROOT,
    ts.sys.fileExists,
    'tsconfig.json',
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }
  const createProgram = ts.createSemanticDiagnosticsBuilderProgram;
  const host = ts.createWatchCompilerHost(
    configPath,
    undefined,
    ts.sys,
    createProgram,
    () => {}, // we manually report errors in afterProgramCreate
    () => {}, // we manually report watch status
  );

  const origCreateProgram = host.createProgram;
  host.createProgram = (rootNames, options, host, oldProgram) => {
    onStart();
    return origCreateProgram(rootNames, options, host, oldProgram);
  };
  host.afterProgramCreate = program => {
    /**
     * Avoid calling original postProgramCreate because it always emits tsc
     * compilation output
     */

    // syntactic diagnostics refer to javascript syntax
    const errors = program
      .getSyntacticDiagnostics()
      .filter(diag => diag.category === ts.DiagnosticCategory.Error);
    // semantic diagnostics refer to typescript semantics
    errors.push(
      ...program
        .getSemanticDiagnostics()
        .filter(diag => diag.category === ts.DiagnosticCategory.Error),
    );

    if (errors.length > 0) {
      for (const diagnostic of errors) {
        let fileLoc: string;
        if (diagnostic.file) {
          // https://github.com/microsoft/TypeScript/blob/ddd5084659c423f4003d2176e12d879b6a5bcf30/src/compiler/program.ts#L663-L674
          const {line, character} = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start!,
          );
          const fileName = path.relative(
            ts.sys.getCurrentDirectory(),
            diagnostic.file.fileName,
          );
          fileLoc = `${fileName}:${line + 1}:${character + 1} - `;
        } else {
          fileLoc = '';
        }
        console.error(
          `${fileLoc}error TS${diagnostic.code}:`,
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        );
      }
      console.error(
        `Compilation failed (${errors.length} ${
          errors.length > 1 ? 'errors' : 'error'
        }).\n`,
      );
    }

    const isSuccess = errors.length === 0;
    onComplete(isSuccess);
  };

  // `createWatchProgram` creates an initial program, watches files, and updates
  // the program over time.
  return ts.createWatchProgram(host);
}

/**
 * Watch mode helpers
 */
export enum RunnerAction {
  Test = 'Test',
  Update = 'Update',
}

type RunnerMode = {
  action: RunnerAction;
  filter: boolean;
};

export type RunnerState = {
  // Monotonically increasing integer to describe the 'version' of the compiler.
  // This is passed to `compile()` when compiling, so that the worker knows when
  // to reset its module cache (compared to using its cached compiler version)
  compilerVersion: number;
  isCompilerBuildValid: boolean;
  // timestamp of the last update
  lastUpdate: number;
  mode: RunnerMode;
  filter: TestFilter | null;
  debug: boolean;
  // Input mode for interactive pattern entry
  inputMode: 'none' | 'pattern';
  inputBuffer: string;
};

function subscribeFixtures(
  state: RunnerState,
  onChange: (state: RunnerState) => void,
) {
  // Watch the fixtures directory for changes
  watcher.subscribe(FIXTURES_PATH, async (err, _events) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    // Try to ignore changes that occurred as a result of our explicitly updating
    // fixtures in update().
    // Currently keeps a timestamp of last known changes, and ignore events that occurred
    // around that timestamp.
    const isRealUpdate = performance.now() - state.lastUpdate > 5000;
    if (isRealUpdate) {
      // Fixtures changed, re-run tests
      state.mode.action = RunnerAction.Test;
      onChange(state);
    }
  });
}

function subscribeTsc(
  state: RunnerState,
  onChange: (state: RunnerState) => void,
) {
  // Run TS in incremental watch mode
  watchSrc(
    function onStart() {
      // Notify the user when compilation starts but don't clear the screen yet
      console.log('\nCompiling...');
    },
    isTypecheckSuccess => {
      let isCompilerBuildValid = false;
      if (isTypecheckSuccess) {
        try {
          execSync('yarn build', {cwd: PROJECT_ROOT});
          console.log('Built compiler successfully with tsup');
          isCompilerBuildValid = true;
        } catch (e) {
          console.warn('Failed to build compiler with tsup:', e);
        }
      }
      // Bump the compiler version after a build finishes
      // and re-run tests
      if (isCompilerBuildValid) {
        state.compilerVersion++;
      }
      state.isCompilerBuildValid = isCompilerBuildValid;
      state.mode.action = RunnerAction.Test;
      onChange(state);
    },
  );
}

function subscribeKeyEvents(
  state: RunnerState,
  onChange: (state: RunnerState) => void,
) {
  process.stdin.on('keypress', async (str, key) => {
    // Handle input mode (pattern entry)
    if (state.inputMode !== 'none') {
      if (key.name === 'return') {
        // Enter pressed - process input
        const pattern = state.inputBuffer.trim();
        state.inputMode = 'none';
        state.inputBuffer = '';
        process.stdout.write('\n');

        if (pattern !== '') {
          // Set the pattern as filter
          state.filter = {paths: [pattern]};
          state.mode.filter = true;
          state.mode.action = RunnerAction.Test;
          onChange(state);
        }
        // If empty, just exit input mode without changes
        return;
      } else if (key.name === 'escape') {
        // Cancel input mode
        state.inputMode = 'none';
        state.inputBuffer = '';
        process.stdout.write(' (cancelled)\n');
        return;
      } else if (key.name === 'backspace') {
        if (state.inputBuffer.length > 0) {
          state.inputBuffer = state.inputBuffer.slice(0, -1);
          // Erase character: backspace, space, backspace
          process.stdout.write('\b \b');
        }
        return;
      } else if (str && !key.ctrl && !key.meta) {
        // Regular character - accumulate and echo
        state.inputBuffer += str;
        process.stdout.write(str);
        return;
      }
      return; // Ignore other keys in input mode
    }

    // Normal mode keypress handling
    if (key.name === 'u') {
      // u => update fixtures
      state.mode.action = RunnerAction.Update;
    } else if (key.name === 'q') {
      process.exit(0);
    } else if (key.name === 'a') {
      // a => exit filter mode and run all tests
      state.mode.filter = false;
      state.filter = null;
      state.mode.action = RunnerAction.Test;
    } else if (key.name === 'd') {
      // d => toggle debug logging
      state.debug = !state.debug;
      state.mode.action = RunnerAction.Test;
    } else if (key.name === 'p') {
      // p => enter pattern input mode
      state.inputMode = 'pattern';
      state.inputBuffer = '';
      process.stdout.write('Pattern: ');
      return; // Don't trigger onChange yet
    } else {
      // any other key re-runs tests
      state.mode.action = RunnerAction.Test;
    }
    onChange(state);
  });
}

export async function makeWatchRunner(
  onChange: (state: RunnerState) => void,
  debugMode: boolean,
  initialPattern?: string,
): Promise<void> {
  // Determine initial filter state
  let filter: TestFilter | null = null;
  let filterEnabled = false;

  if (initialPattern) {
    filter = {paths: [initialPattern]};
    filterEnabled = true;
  }

  const state: RunnerState = {
    compilerVersion: 0,
    isCompilerBuildValid: false,
    lastUpdate: -1,
    mode: {
      action: RunnerAction.Test,
      filter: filterEnabled,
    },
    filter,
    debug: debugMode,
    inputMode: 'none',
    inputBuffer: '',
  };

  subscribeTsc(state, onChange);
  subscribeFixtures(state, onChange);
  subscribeKeyEvents(state, onChange);
}
