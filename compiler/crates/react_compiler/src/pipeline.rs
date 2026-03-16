use react_compiler_ast::{File, scope::ScopeInfo};
use react_compiler_lowering::lower;
use react_compiler_hir::environment::Environment;
use react_compiler_diagnostics::CompilerError;

pub fn run_pipeline(
    target_pass: &str,
    ast: &File,
    scope: &ScopeInfo,
    env: &mut Environment,
) -> Result<String, CompilerError> {
    let hir = lower(ast, scope, env)?;
    if target_pass == "HIR" {
        if env.has_errors() {
            return Ok(crate::debug_print::format_errors(env.errors()));
        }
        return Ok(crate::debug_print::debug_hir(&hir, env));
    }

    // HIR Phase passes — sequential if/return pattern
    // pruneMaybeThrows(&mut hir, env);  // TODO: implement
    if target_pass == "PruneMaybeThrows" {
        todo!("pruneMaybeThrows not yet implemented");
    }

    // dropManualMemoization(&mut hir, env);  // TODO: implement
    if target_pass == "DropManualMemoization" {
        todo!("dropManualMemoization not yet implemented");
    }

    // inlineIIFEs(&mut hir, env);  // TODO: implement
    if target_pass == "InlineIIFEs" {
        todo!("inlineIIFEs not yet implemented");
    }

    // mergeConsecutiveBlocks(&mut hir, env);  // TODO: implement
    if target_pass == "MergeConsecutiveBlocks" {
        todo!("mergeConsecutiveBlocks not yet implemented");
    }

    // enterSSA(&mut hir, env);  // TODO: implement
    if target_pass == "SSA" {
        todo!("enterSSA not yet implemented");
    }

    // eliminateRedundantPhi(&mut hir, env);  // TODO: implement
    if target_pass == "EliminateRedundantPhi" {
        todo!("eliminateRedundantPhi not yet implemented");
    }

    // constantPropagation(&mut hir, env);  // TODO: implement
    if target_pass == "ConstantPropagation" {
        todo!("constantPropagation not yet implemented");
    }

    // inferTypes(&mut hir, env);  // TODO: implement
    if target_pass == "InferTypes" {
        todo!("inferTypes not yet implemented");
    }

    // optimizePropsMethodCalls(&mut hir, env);  // TODO: implement
    if target_pass == "OptimizePropsMethodCalls" {
        todo!("optimizePropsMethodCalls not yet implemented");
    }

    // analyseFunctions(&mut hir, env);  // TODO: implement
    if target_pass == "AnalyseFunctions" {
        todo!("analyseFunctions not yet implemented");
    }

    // inferMutationAliasingEffects(&mut hir, env);  // TODO: implement
    if target_pass == "InferMutationAliasingEffects" {
        todo!("inferMutationAliasingEffects not yet implemented");
    }

    // optimizeForSSR(&mut hir, env);  // TODO: implement
    if target_pass == "OptimizeForSSR" {
        todo!("optimizeForSSR not yet implemented");
    }

    // deadCodeElimination(&mut hir, env);  // TODO: implement
    if target_pass == "DeadCodeElimination" {
        todo!("deadCodeElimination not yet implemented");
    }

    // pruneMaybeThrows(&mut hir, env);  // TODO: implement (second call)
    if target_pass == "PruneMaybeThrows2" {
        todo!("pruneMaybeThrows (second call) not yet implemented");
    }

    // inferMutationAliasingRanges(&mut hir, env);  // TODO: implement
    if target_pass == "InferMutationAliasingRanges" {
        todo!("inferMutationAliasingRanges not yet implemented");
    }

    // inferReactivePlaces(&mut hir, env);  // TODO: implement
    if target_pass == "InferReactivePlaces" {
        todo!("inferReactivePlaces not yet implemented");
    }

    // rewriteInstructionKinds(&mut hir, env);  // TODO: implement
    if target_pass == "RewriteInstructionKinds" {
        todo!("rewriteInstructionKinds not yet implemented");
    }

    // inferReactiveScopeVariables(&mut hir, env);  // TODO: implement
    if target_pass == "InferReactiveScopeVariables" {
        todo!("inferReactiveScopeVariables not yet implemented");
    }

    // memoizeFbtOperands(&mut hir, env);  // TODO: implement
    if target_pass == "MemoizeFbtOperands" {
        todo!("memoizeFbtOperands not yet implemented");
    }

    // nameAnonymousFunctions(&mut hir, env);  // TODO: implement
    if target_pass == "NameAnonymousFunctions" {
        todo!("nameAnonymousFunctions not yet implemented");
    }

    // outlineFunctions(&mut hir, env);  // TODO: implement
    if target_pass == "OutlineFunctions" {
        todo!("outlineFunctions not yet implemented");
    }

    // alignMethodCallScopes(&mut hir, env);  // TODO: implement
    if target_pass == "AlignMethodCallScopes" {
        todo!("alignMethodCallScopes not yet implemented");
    }

    // alignObjectMethodScopes(&mut hir, env);  // TODO: implement
    if target_pass == "AlignObjectMethodScopes" {
        todo!("alignObjectMethodScopes not yet implemented");
    }

    // pruneUnusedLabelsHIR(&mut hir, env);  // TODO: implement
    if target_pass == "PruneUnusedLabelsHIR" {
        todo!("pruneUnusedLabelsHIR not yet implemented");
    }

    // alignReactiveScopesToBlockScopes(&mut hir, env);  // TODO: implement
    if target_pass == "AlignReactiveScopesToBlockScopes" {
        todo!("alignReactiveScopesToBlockScopes not yet implemented");
    }

    // mergeOverlappingReactiveScopes(&mut hir, env);  // TODO: implement
    if target_pass == "MergeOverlappingReactiveScopes" {
        todo!("mergeOverlappingReactiveScopes not yet implemented");
    }

    // buildReactiveScopeTerminals(&mut hir, env);  // TODO: implement
    if target_pass == "BuildReactiveScopeTerminals" {
        todo!("buildReactiveScopeTerminals not yet implemented");
    }

    // flattenReactiveLoops(&mut hir, env);  // TODO: implement
    if target_pass == "FlattenReactiveLoops" {
        todo!("flattenReactiveLoops not yet implemented");
    }

    // flattenScopesWithHooksOrUse(&mut hir, env);  // TODO: implement
    if target_pass == "FlattenScopesWithHooksOrUse" {
        todo!("flattenScopesWithHooksOrUse not yet implemented");
    }

    // propagateScopeDependencies(&mut hir, env);  // TODO: implement
    if target_pass == "PropagateScopeDependencies" {
        todo!("propagateScopeDependencies not yet implemented");
    }

    // Reactive Phase passes

    // buildReactiveFunction(&mut hir, env);  // TODO: implement
    if target_pass == "BuildReactiveFunction" {
        todo!("buildReactiveFunction not yet implemented");
    }

    // pruneUnusedLabels(&mut hir, env);  // TODO: implement
    if target_pass == "PruneUnusedLabels" {
        todo!("pruneUnusedLabels not yet implemented");
    }

    // pruneNonEscapingScopes(&mut hir, env);  // TODO: implement
    if target_pass == "PruneNonEscapingScopes" {
        todo!("pruneNonEscapingScopes not yet implemented");
    }

    // pruneNonReactiveDependencies(&mut hir, env);  // TODO: implement
    if target_pass == "PruneNonReactiveDependencies" {
        todo!("pruneNonReactiveDependencies not yet implemented");
    }

    // pruneUnusedScopes(&mut hir, env);  // TODO: implement
    if target_pass == "PruneUnusedScopes" {
        todo!("pruneUnusedScopes not yet implemented");
    }

    // mergeReactiveScopesThatInvalidateTogether(&mut hir, env);  // TODO: implement
    if target_pass == "MergeReactiveScopesThatInvalidateTogether" {
        todo!("mergeReactiveScopesThatInvalidateTogether not yet implemented");
    }

    // pruneAlwaysInvalidatingScopes(&mut hir, env);  // TODO: implement
    if target_pass == "PruneAlwaysInvalidatingScopes" {
        todo!("pruneAlwaysInvalidatingScopes not yet implemented");
    }

    // propagateEarlyReturns(&mut hir, env);  // TODO: implement
    if target_pass == "PropagateEarlyReturns" {
        todo!("propagateEarlyReturns not yet implemented");
    }

    // pruneUnusedLValues(&mut hir, env);  // TODO: implement
    if target_pass == "PruneUnusedLValues" {
        todo!("pruneUnusedLValues not yet implemented");
    }

    // promoteUsedTemporaries(&mut hir, env);  // TODO: implement
    if target_pass == "PromoteUsedTemporaries" {
        todo!("promoteUsedTemporaries not yet implemented");
    }

    // extractScopeDeclarationsFromDestructuring(&mut hir, env);  // TODO: implement
    if target_pass == "ExtractScopeDeclarationsFromDestructuring" {
        todo!("extractScopeDeclarationsFromDestructuring not yet implemented");
    }

    // stabilizeBlockIds(&mut hir, env);  // TODO: implement
    if target_pass == "StabilizeBlockIds" {
        todo!("stabilizeBlockIds not yet implemented");
    }

    // renameVariables(&mut hir, env);  // TODO: implement
    if target_pass == "RenameVariables" {
        todo!("renameVariables not yet implemented");
    }

    // pruneHoistedContexts(&mut hir, env);  // TODO: implement
    if target_pass == "PruneHoistedContexts" {
        todo!("pruneHoistedContexts not yet implemented");
    }

    // codegen(&mut hir, env);  // TODO: implement
    if target_pass == "Codegen" {
        todo!("codegen not yet implemented");
    }

    todo!("Unknown pass: '{}'", target_pass)
}
