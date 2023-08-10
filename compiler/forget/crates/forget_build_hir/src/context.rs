use std::collections::HashSet;

use forget_estree::IntoFunction;
use forget_hir::Environment;
use forget_semantic_analysis::{DeclarationId, ScopeView};

pub(crate) fn get_context_identifiers<T: IntoFunction>(
    env: &Environment,
    node: &T,
) -> Vec<DeclarationId> {
    let function_scope = env.scope(node.function()).unwrap();
    println!(
        "get_context_identifiers for function scope {:?}",
        function_scope.id()
    );
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
            println!(
                "skip {}${:?}",
                reference.declaration().name(),
                reference.declaration().id()
            );
            continue;
        }
        let declaration_scope = reference.declaration().scope();
        if !declaration_scope.is_descendant_of(scope) {
            println!(
                "free variable: not descendant {}${:?}",
                reference.declaration().name(),
                reference.declaration().id()
            );
            free.push(reference.declaration().id())
        } else {
            println!(
                "local variable: descendant {}${:?} scope={:?}",
                reference.declaration().name(),
                reference.declaration().id(),
                reference.declaration().scope().id()
            );
        }
    }
    for child in scope.children() {
        populate_free_variable_references(free, seen, child);
    }
}
