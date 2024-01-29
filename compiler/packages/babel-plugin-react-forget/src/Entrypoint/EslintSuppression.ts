/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import {
  CompilerError,
  CompilerErrorDetail,
  CompilerSuggestionOperation,
  ErrorSeverity,
} from "../CompilerError";

/**
 * Captures the start and end range of a pair of eslint-disable ... eslint-enable comments. In the
 * case of a CommentLine, both the disable and enable point to the same comment.
 *
 * The enable comment can be missing in the case where only a disable block is present, ie the rest
 * of the file has potential React violations.
 */
export type EslintSuppressionRange = {
  disableComment: t.Comment;
  enableComment: t.Comment | null;
};

/**
 * An eslint suppression affects a function if:
 *   1. The suppression is within the function's body; or
 *   2. The suppression wraps the function
 */
export function filterEslintSuppressionsThatAffectFunction(
  suppressionRanges: Array<EslintSuppressionRange>,
  fn: NodePath<t.Function>
): Array<EslintSuppressionRange> {
  const suppressionsInScope: Array<EslintSuppressionRange> = [];
  const fnNode = fn.node;
  for (const suppressionRange of suppressionRanges) {
    if (
      suppressionRange.disableComment.start == null ||
      fnNode.start == null ||
      fnNode.end == null
    ) {
      continue;
    }
    // The suppression is within the function
    if (
      suppressionRange.disableComment.start > fnNode.start &&
      // If there is no matching enable, the rest of the file has potential violations
      (suppressionRange.enableComment === null ||
        (suppressionRange.enableComment.end != null &&
          suppressionRange.enableComment.end < fnNode.end))
    ) {
      suppressionsInScope.push(suppressionRange);
    }

    // The suppression wraps the function
    if (
      suppressionRange.disableComment.start < fnNode.start &&
      // If there is no matching enable, the rest of the file has potential violations
      (suppressionRange.enableComment === null ||
        (suppressionRange.enableComment.end != null &&
          suppressionRange.enableComment.end > fnNode.end))
    ) {
      suppressionsInScope.push(suppressionRange);
    }
  }
  return suppressionsInScope;
}

export function findProgramEslintSuppressions(
  programComments: Array<t.Comment>,
  ruleNames: Array<string>
): Array<EslintSuppressionRange> {
  const suppressionRanges: Array<EslintSuppressionRange> = [];
  let disableComment: t.Comment | null = null;
  let enableComment: t.Comment | null = null;

  const rulePattern = `(${ruleNames.join("|")})`;
  const disableNextLinePattern = new RegExp(
    `eslint-disable-next-line ${rulePattern}`
  );
  const disablePattern = new RegExp(`eslint-disable ${rulePattern}`);
  const enablePattern = new RegExp(`eslint-enable ${rulePattern}`);

  for (const comment of programComments) {
    if (comment.start == null || comment.end == null) {
      continue;
    }

    if (
      /*
       * If we're already within a CommentBlock, we should not restart the range prematurely for a
       * CommentLine within the block.
       */
      disableComment == null &&
      disableNextLinePattern.test(comment.value)
    ) {
      disableComment = comment;
      enableComment = comment;
    }

    if (disablePattern.test(comment.value)) {
      disableComment = comment;
    }

    if (enablePattern.test(comment.value)) {
      enableComment = comment;
    }

    if (disableComment != null) {
      suppressionRanges.push({
        disableComment: disableComment,
        enableComment: enableComment,
      });
      disableComment = null;
      enableComment = null;
    }
  }
  return suppressionRanges;
}

export function suppressionsToCompilerError(
  suppressionRanges: Array<EslintSuppressionRange>
): CompilerError | null {
  if (suppressionRanges.length === 0) {
    return null;
  }
  const reason =
    "React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior";
  const error = new CompilerError();
  for (const suppressionRange of suppressionRanges) {
    if (
      suppressionRange.disableComment.start == null ||
      suppressionRange.disableComment.end == null
    ) {
      continue;
    }
    error.pushErrorDetail(
      new CompilerErrorDetail({
        reason,
        description: suppressionRange.disableComment.value.trim(),
        severity: ErrorSeverity.InvalidReact,
        loc: suppressionRange.disableComment.loc ?? null,
        suggestions: [
          {
            description: "Remove the eslint disable",
            range: [
              suppressionRange.disableComment.start,
              suppressionRange.disableComment.end,
            ],
            op: CompilerSuggestionOperation.Remove,
          },
        ],
      })
    );
  }
  return error;
}
