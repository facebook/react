/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {default as analyseFunctions} from './AnalyseFunctions';
export {dropManualMemoization} from './DropManualMemoization';
export {inferMutableRanges} from './InferMutableRanges';
export {inferReactivePlaces} from './InferReactivePlaces';
export {default as inferReferenceEffects} from './InferReferenceEffects';
export {inlineImmediatelyInvokedFunctionExpressions} from './InlineImmediatelyInvokedFunctionExpressions';
