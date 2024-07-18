/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import watcher from '@parcel/watcher';
import path from 'path';
import ts from 'typescript';
import {FILTER_FILENAME, FIXTURES_PATH} from './constants';
import {TestFilter, readTestFilter} from './fixture-utils';

export function watchSrc(
  onStart: () => void,
  onComplete: (isSuccess: boolean) => void,
): ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> {
  const configPath = ts.findConfigFile(
    /*searchPath*/ './',
    ts.sys.fileExists,
    'tsconfig.json',
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }
  const createProgram = ts.createSemanticDiagnosticsBuilderProgram;
  const host = ts.createWatchCompilerHost(
    configPath,
    ts.convertCompilerOptionsFromJson(
      {module: 'commonjs', outDir: 'dist', sourceMap: true},
      '.',
    ).options,
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
  const origPostProgramCreate = host.afterProgramCreate;
  host.afterProgramCreate = program => {
    origPostProgramCreate!(program);

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

function subscribeFilterFile(
  state: RunnerState,
  onChange: (state: RunnerState) => void,
) {
  watcher.subscribe(process.cwd(), async (err, events) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else if (
      events.findIndex(event => event.path.includes(FILTER_FILENAME)) !== -1
    ) {
      if (state.mode.filter) {
        state.filter = await readTestFilter();
        state.mode.action = RunnerAction.Test;
        onChange(state);
      }
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
    isSuccess => {
      // Bump the compiler version after a build finishes
      // and re-run tests
      if (isSuccess) {
        state.compilerVersion++;
      }
      state.isCompilerBuildValid = isSuccess;
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
    if (key.name === 'u') {
      // u => update fixtures
      state.mode.action = RunnerAction.Update;
    } else if (key.name === 'q') {
      process.exit(0);
    } else if (key.name === 'f') {
      state.mode.filter = !state.mode.filter;
      state.filter = state.mode.filter ? await readTestFilter() : null;
      state.mode.action = RunnerAction.Test;
    } else {
      // any other key re-runs tests
      state.mode.action = RunnerAction.Test;
    }
    onChange(state);
  });
}

export async function makeWatchRunner(
  onChange: (state: RunnerState) => void,
  filterMode: boolean,
): Promise<void> {
  const state = {
    compilerVersion: 0,
    isCompilerBuildValid: false,
    lastUpdate: -1,
    mode: {
      action: RunnerAction.Test,
      filter: filterMode,
    },
    filter: filterMode ? await readTestFilter() : null,
  };

  subscribeTsc(state, onChange);
  subscribeFixtures(state, onChange);
  subscribeKeyEvents(state, onChange);
  subscribeFilterFile(state, onChange);
}
