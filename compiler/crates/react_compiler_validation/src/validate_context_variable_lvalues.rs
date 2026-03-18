use std::collections::HashMap;

use react_compiler_diagnostics::{
    CompilerDiagnostic, CompilerDiagnosticDetail, CompilerError, ErrorCategory,
};
use react_compiler_hir::{
    ArrayPatternElement, FunctionId, HirFunction, IdentifierId, InstructionValue, ObjectPropertyOrSpread,
    Pattern, Place,
};
use react_compiler_hir::environment::Environment;

/// Variable reference kind: local, context, or destructure.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum VarRefKind {
    Local,
    Context,
    Destructure,
}

impl std::fmt::Display for VarRefKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VarRefKind::Local => write!(f, "local"),
            VarRefKind::Context => write!(f, "context"),
            VarRefKind::Destructure => write!(f, "destructure"),
        }
    }
}

type IdentifierKinds = HashMap<IdentifierId, (Place, VarRefKind)>;

/// Validates that context variable lvalues are used consistently.
///
/// Port of ValidateContextVariableLValues.ts
pub fn validate_context_variable_lvalues(
    func: &HirFunction,
    env: &mut Environment,
) -> Result<(), CompilerDiagnostic> {
    validate_context_variable_lvalues_with_errors(func, &env.functions, &mut env.errors)
}

/// Like [`validate_context_variable_lvalues`], but writes diagnostics into the
/// provided `errors` instead of `env.errors`. Useful when the caller wants to
/// discard the diagnostics (e.g. when lowering is incomplete).
pub fn validate_context_variable_lvalues_with_errors(
    func: &HirFunction,
    functions: &[HirFunction],
    errors: &mut CompilerError,
) -> Result<(), CompilerDiagnostic> {
    let mut identifier_kinds: IdentifierKinds = HashMap::new();
    validate_context_variable_lvalues_impl(func, &mut identifier_kinds, functions, errors)
}

fn validate_context_variable_lvalues_impl(
    func: &HirFunction,
    identifier_kinds: &mut IdentifierKinds,
    functions: &[HirFunction],
    errors: &mut CompilerError,
) -> Result<(), CompilerDiagnostic> {
    let mut inner_function_ids: Vec<FunctionId> = Vec::new();

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            let value = &instr.value;

            match value {
                InstructionValue::DeclareContext { lvalue, .. }
                | InstructionValue::StoreContext { lvalue, .. } => {
                    visit(identifier_kinds, &lvalue.place, VarRefKind::Context, errors)?;
                }
                InstructionValue::LoadContext { place, .. } => {
                    visit(identifier_kinds, place, VarRefKind::Context, errors)?;
                }
                InstructionValue::StoreLocal { lvalue, .. }
                | InstructionValue::DeclareLocal { lvalue, .. } => {
                    visit(identifier_kinds, &lvalue.place, VarRefKind::Local, errors)?;
                }
                InstructionValue::LoadLocal { place, .. } => {
                    visit(identifier_kinds, place, VarRefKind::Local, errors)?;
                }
                InstructionValue::PostfixUpdate { lvalue, .. }
                | InstructionValue::PrefixUpdate { lvalue, .. } => {
                    visit(identifier_kinds, lvalue, VarRefKind::Local, errors)?;
                }
                InstructionValue::Destructure { lvalue, .. } => {
                    for place in each_pattern_operand(&lvalue.pattern) {
                        visit(identifier_kinds, place, VarRefKind::Destructure, errors)?;
                    }
                }
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => {
                    inner_function_ids.push(lowered_func.func);
                }
                _ => {
                    // All lvalue-bearing instruction kinds are handled above.
                    // The default case is a no-op for current variants.
                }
            }
        }
    }

    // Process inner functions after the block loop to avoid borrow conflicts
    for func_id in inner_function_ids {
        let inner_func = &functions[func_id.0 as usize];
        validate_context_variable_lvalues_impl(inner_func, identifier_kinds, functions, errors)?;
    }

    Ok(())
}

/// Iterate all Place references in a destructuring pattern.
fn each_pattern_operand(pattern: &Pattern) -> Vec<&Place> {
    let mut places = Vec::new();
    collect_pattern_operands(pattern, &mut places);
    places
}

fn collect_pattern_operands<'a>(pattern: &'a Pattern, places: &mut Vec<&'a Place>) {
    match pattern {
        Pattern::Array(array_pattern) => {
            for item in &array_pattern.items {
                match item {
                    ArrayPatternElement::Place(place) => places.push(place),
                    ArrayPatternElement::Spread(spread) => places.push(&spread.place),
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(object_pattern) => {
            for prop in &object_pattern.properties {
                match prop {
                    ObjectPropertyOrSpread::Property(prop) => places.push(&prop.place),
                    ObjectPropertyOrSpread::Spread(spread) => places.push(&spread.place),
                }
            }
        }
    }
}

fn visit(
    identifiers: &mut IdentifierKinds,
    place: &Place,
    kind: VarRefKind,
    errors: &mut CompilerError,
) -> Result<(), CompilerDiagnostic> {
    if let Some((prev_place, prev_kind)) = identifiers.get(&place.identifier) {
        let was_context = *prev_kind == VarRefKind::Context;
        let is_context = kind == VarRefKind::Context;
        if was_context != is_context {
            if *prev_kind == VarRefKind::Destructure || kind == VarRefKind::Destructure {
                let loc = if kind == VarRefKind::Destructure {
                    place.loc
                } else {
                    prev_place.loc
                };
                errors.push_diagnostic(
                    CompilerDiagnostic::new(
                        ErrorCategory::Todo,
                        "Support destructuring of context variables",
                        None,
                    )
                    .with_detail(CompilerDiagnosticDetail::Error {
                        loc,
                        message: None,
                    }),
                );
                return Ok(());
            }
            return Err(CompilerDiagnostic::new(
                ErrorCategory::Invariant,
                "Expected all references to a variable to be consistently local or context references",
                Some(format!(
                    "Identifier ${} is referenced as a {} variable, but was previously referenced as a {} variable",
                    place.identifier.0, kind, prev_kind
                )),
            )
            .with_detail(CompilerDiagnosticDetail::Error {
                loc: place.loc,
                message: Some(format!("this is {}", prev_kind)),
            }));
        }
    }
    identifiers.insert(place.identifier, (place.clone(), kind));
    Ok(())
}
