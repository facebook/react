use std::collections::HashSet;

use forget_estree::IntoFunction;
use forget_hir::Environment;
use forget_semantic_analysis::{DeclarationId, ScopeView};

pub(crate) fn get_context_identifiers<T: IntoFunction>(
    env: &Environment,
    node: &T,
) -> Vec<DeclarationId> {
    let function_scope = env.scope(node.function()).unwrap();
    let mut free = FreeVariables::default();
    let mut seen = HashSet::new();
    populate_free_variable_references(&mut free, &mut seen, function_scope);
    free
}

type FreeVariables = Vec<DeclarationId>;

fn populate_free_variable_references(
    free: &mut FreeVariables,
    seen: &mut HashSet<DeclarationId>,
    scope: ScopeView<'_>,
) {
    for reference in scope.references() {
        if !seen.insert(reference.declaration().id()) {
            continue;
        }
        let declaration_scope = reference.declaration().scope();
        if !declaration_scope.is_descendant_of(scope) {
            free.push(reference.declaration().id())
        }
    }
    for child in scope.children() {
        populate_free_variable_references(free, seen, child);
    }
}
