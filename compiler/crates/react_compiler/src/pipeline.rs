use react_compiler_ast::{File, scope::ScopeInfo};
use crate::lower::lower;
use crate::environment::Environment;

pub fn run_pipeline(
    target_pass: &str,
    ast: File,
    scope: ScopeInfo,
) -> Result<String, String> {
    let mut env = Environment::new();

    let hir = lower(ast, scope, &mut env)?;
    if target_pass == "HIR" {
        return Ok(crate::debug_print::debug_hir(&hir, &env));
    }

    // HIR Phase passes
    match target_pass {
        "PruneMaybeThrows" => todo!("pruneMaybeThrows not yet implemented"),
        "DropManualMemoization" => todo!("dropManualMemoization not yet implemented"),
        "InlineIIFEs" => todo!("inlineIIFEs not yet implemented"),
        "MergeConsecutiveBlocks" => todo!("mergeConsecutiveBlocks not yet implemented"),
        "SSA" => todo!("enterSSA not yet implemented"),
        "EliminateRedundantPhi" => todo!("eliminateRedundantPhi not yet implemented"),
        "ConstantPropagation" => todo!("constantPropagation not yet implemented"),
        "InferTypes" => todo!("inferTypes not yet implemented"),
        "OptimizePropsMethodCalls" => todo!("optimizePropsMethodCalls not yet implemented"),
        "AnalyseFunctions" => todo!("analyseFunctions not yet implemented"),
        "InferMutationAliasingEffects" => todo!("inferMutationAliasingEffects not yet implemented"),
        "OptimizeForSSR" => todo!("optimizeForSSR not yet implemented"),
        "DeadCodeElimination" => todo!("deadCodeElimination not yet implemented"),
        "PruneMaybeThrows2" => todo!("pruneMaybeThrows (second call) not yet implemented"),
        "InferMutationAliasingRanges" => todo!("inferMutationAliasingRanges not yet implemented"),
        "InferReactivePlaces" => todo!("inferReactivePlaces not yet implemented"),
        "RewriteInstructionKinds" => todo!("rewriteInstructionKinds not yet implemented"),
        "InferReactiveScopeVariables" => todo!("inferReactiveScopeVariables not yet implemented"),
        "MemoizeFbtOperands" => todo!("memoizeFbtOperands not yet implemented"),
        "NameAnonymousFunctions" => todo!("nameAnonymousFunctions not yet implemented"),
        "OutlineFunctions" => todo!("outlineFunctions not yet implemented"),
        "AlignMethodCallScopes" => todo!("alignMethodCallScopes not yet implemented"),
        "AlignObjectMethodScopes" => todo!("alignObjectMethodScopes not yet implemented"),
        "PruneUnusedLabelsHIR" => todo!("pruneUnusedLabelsHIR not yet implemented"),
        "AlignReactiveScopesToBlockScopes" => todo!("alignReactiveScopesToBlockScopes not yet implemented"),
        "MergeOverlappingReactiveScopes" => todo!("mergeOverlappingReactiveScopes not yet implemented"),
        "BuildReactiveScopeTerminals" => todo!("buildReactiveScopeTerminals not yet implemented"),
        "FlattenReactiveLoops" => todo!("flattenReactiveLoops not yet implemented"),
        "FlattenScopesWithHooksOrUse" => todo!("flattenScopesWithHooksOrUse not yet implemented"),
        "PropagateScopeDependencies" => todo!("propagateScopeDependencies not yet implemented"),

        // Reactive Phase passes
        "BuildReactiveFunction" => todo!("buildReactiveFunction not yet implemented"),
        "PruneUnusedLabels" => todo!("pruneUnusedLabels not yet implemented"),
        "PruneNonEscapingScopes" => todo!("pruneNonEscapingScopes not yet implemented"),
        "PruneNonReactiveDependencies" => todo!("pruneNonReactiveDependencies not yet implemented"),
        "PruneUnusedScopes" => todo!("pruneUnusedScopes not yet implemented"),
        "MergeReactiveScopesThatInvalidateTogether" => todo!("mergeReactiveScopesThatInvalidateTogether not yet implemented"),
        "PruneAlwaysInvalidatingScopes" => todo!("pruneAlwaysInvalidatingScopes not yet implemented"),
        "PropagateEarlyReturns" => todo!("propagateEarlyReturns not yet implemented"),
        "PruneUnusedLValues" => todo!("pruneUnusedLValues not yet implemented"),
        "PromoteUsedTemporaries" => todo!("promoteUsedTemporaries not yet implemented"),
        "ExtractScopeDeclarationsFromDestructuring" => todo!("extractScopeDeclarationsFromDestructuring not yet implemented"),
        "StabilizeBlockIds" => todo!("stabilizeBlockIds not yet implemented"),
        "RenameVariables" => todo!("renameVariables not yet implemented"),
        "PruneHoistedContexts" => todo!("pruneHoistedContexts not yet implemented"),
        "Codegen" => todo!("codegen not yet implemented"),

        _ => Err(format!("Unknown pass: {}", target_pass)),
    }
}
