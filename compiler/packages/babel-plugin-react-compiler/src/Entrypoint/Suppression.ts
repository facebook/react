/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/core';
import * as t from '@babel/types';
import {
  CompilerDiagnostic,
  CompilerError,
  CompilerSuggestionOperation,
  ErrorCategory,
  ErrorSeverity,
} from '../CompilerError';
import {assertExhaustive} from '../Utils/utils';
import {GeneratedSource} from '../HIR';

/**
 * Captures the start and end range of a pair of eslint-disable ... eslint-enable comments. In the
 * case of a CommentLine or a relevant Flow suppression, both the disable and enable point to the
 * same comment.
 *
 * The enable comment can be missing in the case where only a disable block is present, ie the rest
 * of the file has potential React violations.
 */
export type SuppressionRange =
  | {
      kind: 'single-line';
      source: SuppressionSource;
      comment: t.Comment;
    }
  | {
      kind: 'multi-line';
      source: SuppressionSource;
      disableComment: t.Comment;
      enableComment: t.Comment | null;
    };

export type SingleLineSuppressionRange = Extract<
  SuppressionRange,
  {kind: 'single-line'}
>;

type SuppressionSource = 'Eslint' | 'Flow';

/**
 * An suppression affects a function if:
 *   1. The suppression is within the function's body; or
 *   2. The suppression wraps the function
 */
export function filterSuppressionsThatAffectNode<T extends SuppressionRange>(
  suppressionRanges: Array<T>,
  node: NodePath,
): Array<T> {
  const suppressionsInScope: Array<T> = [];
  const fnNode = node.node;
  for (const suppressionRange of suppressionRanges) {
    const enableComment =
      suppressionRange.kind === 'single-line'
        ? suppressionRange.comment
        : suppressionRange.enableComment;
    const disableComment =
      suppressionRange.kind === 'single-line'
        ? suppressionRange.comment
        : suppressionRange.disableComment;
    if (
      disableComment.start == null ||
      fnNode.start == null ||
      fnNode.end == null
    ) {
      continue;
    }
    // The suppression is within the function
    if (
      disableComment.start > fnNode.start &&
      // If there is no matching enable, the rest of the file has potential violations
      (enableComment === null ||
        (enableComment.end != null && enableComment.end < fnNode.end))
    ) {
      suppressionsInScope.push(suppressionRange);
    }

    // The suppression wraps the function
    if (
      disableComment.start < fnNode.start &&
      // If there is no matching enable, the rest of the file has potential violations
      (enableComment === null ||
        (enableComment.end != null && enableComment.end > fnNode.end))
    ) {
      suppressionsInScope.push(suppressionRange);
    }
  }
  return suppressionsInScope;
}

export function findProgramSuppressions(
  programComments: Array<t.Comment>,
  ruleNames: Array<string>,
  flowSuppressions: boolean,
): Array<SuppressionRange> {
  const suppressionRanges: Array<SuppressionRange> = [];
  let suppression: SuppressionRange | null = null;

  const rulePattern = `(${ruleNames.join('|')})`;
  const disableNextLinePattern = new RegExp(
    `eslint-disable-next-line ${rulePattern}`,
  );
  const disablePattern = new RegExp(`eslint-disable ${rulePattern}`);
  const enablePattern = new RegExp(`eslint-enable ${rulePattern}`);
  const flowSuppressionPattern = new RegExp(
    '\\$(FlowFixMe\\w*|FlowExpectedError|FlowIssue)\\[react\\-rule',
  );

  for (const comment of programComments) {
    if (comment.start == null || comment.end == null) {
      continue;
    }

    if (
      /*
       * If we're already within a CommentBlock, we should not restart the range prematurely for a
       * CommentLine within the block.
       */
      suppression == null &&
      disableNextLinePattern.test(comment.value)
    ) {
      suppression = {
        kind: 'single-line',
        comment,
        source: 'Eslint',
      };
    }

    if (
      flowSuppressions &&
      suppression == null &&
      flowSuppressionPattern.test(comment.value)
    ) {
      suppression = {
        kind: 'single-line',
        comment,
        source: 'Flow',
      };
    }

    if (disablePattern.test(comment.value)) {
      suppression = {
        kind: 'multi-line',
        disableComment: comment,
        enableComment: null,
        source: 'Eslint',
      };
    }

    if (
      enablePattern.test(comment.value) &&
      suppression != null &&
      suppression.kind === 'multi-line' &&
      suppression.source === 'Eslint'
    ) {
      suppression.enableComment = comment;
    }

    if (suppression != null) {
      suppressionRanges.push(suppression);
      suppression = null;
    }
  }
  return suppressionRanges;
}

export function suppressionsToCompilerError(
  suppressionRanges: Array<SuppressionRange>,
): CompilerError {
  CompilerError.invariant(suppressionRanges.length !== 0, {
    reason: `Expected at least suppression comment source range`,
    loc: GeneratedSource,
  });
  const error = new CompilerError();
  for (const suppressionRange of suppressionRanges) {
    const disableComment =
      suppressionRange.kind === 'single-line'
        ? suppressionRange.comment
        : suppressionRange.disableComment;
    if (disableComment.start == null || disableComment.end == null) {
      continue;
    }
    let reason, suggestion;
    switch (suppressionRange.source) {
      case 'Eslint':
        reason =
          'React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled';
        suggestion =
          'Remove the ESLint suppression and address the React error';
        break;
      case 'Flow':
        reason =
          'React Compiler has skipped optimizing this component because one or more React rule violations were reported by Flow';
        suggestion = 'Remove the Flow suppression and address the React error';
        break;
      default:
        assertExhaustive(
          suppressionRange.source,
          'Unhandled suppression source',
        );
    }
    error.pushDiagnostic(
      CompilerDiagnostic.create({
        reason: reason,
        description: `React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. Found suppression \`${disableComment.value.trim()}\``,
        severity: ErrorSeverity.InvalidReact,
        category: ErrorCategory.Suppression,
        suggestions: [
          {
            description: suggestion,
            range: [disableComment.start, disableComment.end],
            op: CompilerSuggestionOperation.Remove,
          },
        ],
      }).withDetail({
        kind: 'error',
        loc: disableComment.loc ?? null,
        message: 'Found React rule suppression',
      }),
    );
  }
  return error;
}
