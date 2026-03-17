use std::collections::{HashMap, HashSet};

use react_compiler_diagnostics::{
    CompilerDiagnostic, CompilerDiagnosticDetail, CompilerError, ErrorCategory, SourceLocation,
};
use react_compiler_hir::{
    ArrayElement, FunctionId, HirFunction, IdentifierId, InstructionValue, JsxAttribute, JsxTag,
    ManualMemoDependencyRoot, ParamPattern, PlaceOrSpread, Place, ReturnVariant, Terminal,
};
use react_compiler_hir::environment::Environment;

/// Validates useMemo() usage patterns.
///
/// Port of ValidateUseMemo.ts
pub fn validate_use_memo(func: &HirFunction, env: &mut Environment) {
    validate_use_memo_impl(func, &env.functions, &mut env.errors);
}

/// Information about a FunctionExpression needed for validation.
struct FuncExprInfo {
    func_id: FunctionId,
    loc: Option<SourceLocation>,
}

fn validate_use_memo_impl(
    func: &HirFunction,
    functions: &[HirFunction],
    errors: &mut CompilerError,
) {
    let mut void_memo_errors = CompilerError::new();
    let mut use_memos: HashSet<IdentifierId> = HashSet::new();
    let mut react_ids: HashSet<IdentifierId> = HashSet::new();
    let mut func_exprs: HashMap<IdentifierId, FuncExprInfo> = HashMap::new();
    let mut unused_use_memos: HashMap<IdentifierId, SourceLocation> = HashMap::new();

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            let lvalue = &instr.lvalue;
            let value = &instr.value;

            // Remove used operands from unused_use_memos
            if !unused_use_memos.is_empty() {
                for operand_id in each_instruction_value_operand_ids(value) {
                    unused_use_memos.remove(&operand_id);
                }
            }

            match value {
                InstructionValue::LoadGlobal { binding, .. } => {
                    let name = binding.name();
                    if name == "useMemo" {
                        use_memos.insert(lvalue.identifier);
                    } else if name == "React" {
                        react_ids.insert(lvalue.identifier);
                    }
                }
                InstructionValue::PropertyLoad {
                    object, property, ..
                } => {
                    if react_ids.contains(&object.identifier) {
                        if let react_compiler_hir::PropertyLiteral::String(prop_name) = property {
                            if prop_name == "useMemo" {
                                use_memos.insert(lvalue.identifier);
                            }
                        }
                    }
                }
                InstructionValue::FunctionExpression { lowered_func, loc, .. } => {
                    func_exprs.insert(
                        lvalue.identifier,
                        FuncExprInfo {
                            func_id: lowered_func.func,
                            loc: *loc,
                        },
                    );
                }
                InstructionValue::CallExpression { callee, args, .. } => {
                    handle_possible_use_memo_call(
                        func,
                        functions,
                        errors,
                        &mut void_memo_errors,
                        &use_memos,
                        &func_exprs,
                        &mut unused_use_memos,
                        callee,
                        args,
                        lvalue,
                    );
                }
                InstructionValue::MethodCall {
                    property, args, ..
                } => {
                    handle_possible_use_memo_call(
                        func,
                        functions,
                        errors,
                        &mut void_memo_errors,
                        &use_memos,
                        &func_exprs,
                        &mut unused_use_memos,
                        property,
                        args,
                        lvalue,
                    );
                }
                _ => {}
            }
        }

        // Check terminal operands for unused_use_memos
        if !unused_use_memos.is_empty() {
            for operand_id in each_terminal_operand_ids(&block.terminal) {
                unused_use_memos.remove(&operand_id);
            }
        }
    }

    // Report unused useMemo results
    if !unused_use_memos.is_empty() {
        for loc in unused_use_memos.values() {
            void_memo_errors.push_diagnostic(
                CompilerDiagnostic::new(
                    ErrorCategory::VoidUseMemo,
                    "useMemo() result is unused",
                    Some(
                        "This useMemo() value is unused. useMemo() is for computing and caching values, not for arbitrary side effects"
                            .to_string(),
                    ),
                )
                .with_detail(CompilerDiagnosticDetail::Error {
                    loc: Some(*loc),
                    message: Some("useMemo() result is unused".to_string()),
                }),
            );
        }
    }

    // In the TS, void memo errors are logged via env.logErrors() for telemetry
    // but NOT accumulated as compilation errors. Since the Rust port doesn't have
    // a logger yet, we drop them (matching the no-logger behavior in TS).
    let _ = void_memo_errors;
}

#[allow(clippy::too_many_arguments)]
fn handle_possible_use_memo_call(
    _func: &HirFunction,
    functions: &[HirFunction],
    errors: &mut CompilerError,
    void_memo_errors: &mut CompilerError,
    use_memos: &HashSet<IdentifierId>,
    func_exprs: &HashMap<IdentifierId, FuncExprInfo>,
    unused_use_memos: &mut HashMap<IdentifierId, SourceLocation>,
    callee: &Place,
    args: &[PlaceOrSpread],
    lvalue: &Place,
) {
    let is_use_memo = use_memos.contains(&callee.identifier);
    if !is_use_memo || args.is_empty() {
        return;
    }

    let first_arg = match &args[0] {
        PlaceOrSpread::Place(place) => place,
        PlaceOrSpread::Spread(_) => return,
    };

    let body_info = match func_exprs.get(&first_arg.identifier) {
        Some(info) => info,
        None => return,
    };

    let body_func = &functions[body_info.func_id.0 as usize];

    // Validate no parameters
    if !body_func.params.is_empty() {
        let first_param = &body_func.params[0];
        let loc = match first_param {
            ParamPattern::Place(place) => place.loc,
            ParamPattern::Spread(spread) => spread.place.loc,
        };
        errors.push_diagnostic(
            CompilerDiagnostic::new(
                ErrorCategory::UseMemo,
                "useMemo() callbacks may not accept parameters",
                Some(
                    "useMemo() callbacks are called by React to cache calculations across re-renders. They should not take parameters. Instead, directly reference the props, state, or local variables needed for the computation"
                        .to_string(),
                ),
            )
            .with_detail(CompilerDiagnosticDetail::Error {
                loc,
                message: Some("Callbacks with parameters are not supported".to_string()),
            }),
        );
    }

    // Validate not async or generator
    if body_func.is_async || body_func.generator {
        errors.push_diagnostic(
            CompilerDiagnostic::new(
                ErrorCategory::UseMemo,
                "useMemo() callbacks may not be async or generator functions",
                Some(
                    "useMemo() callbacks are called once and must synchronously return a value"
                        .to_string(),
                ),
            )
            .with_detail(CompilerDiagnosticDetail::Error {
                loc: body_info.loc,
                message: Some("Async and generator functions are not supported".to_string()),
            }),
        );
    }

    // Validate no context variable assignment
    validate_no_context_variable_assignment(body_func, functions, errors);

    // TODO: Gate behind env.config.validateNoVoidUseMemo when config is ported
    if !has_non_void_return(body_func) {
        void_memo_errors.push_diagnostic(
            CompilerDiagnostic::new(
                ErrorCategory::VoidUseMemo,
                "useMemo() callbacks must return a value",
                Some(
                    "This useMemo() callback doesn't return a value. useMemo() is for computing and caching values, not for arbitrary side effects"
                        .to_string(),
                ),
            )
            .with_detail(CompilerDiagnosticDetail::Error {
                loc: body_info.loc,
                message: Some("useMemo() callbacks must return a value".to_string()),
            }),
        );
    } else if let Some(callee_loc) = callee.loc {
        unused_use_memos.insert(lvalue.identifier, callee_loc);
    }
}

fn validate_no_context_variable_assignment(
    func: &HirFunction,
    _functions: &[HirFunction],
    errors: &mut CompilerError,
) {
    let context: HashSet<IdentifierId> =
        func.context.iter().map(|place| place.identifier).collect();

    for (_block_id, block) in &func.body.blocks {
        for &instr_id in &block.instructions {
            let instr = &func.instructions[instr_id.0 as usize];
            if let InstructionValue::StoreContext { lvalue, .. } = &instr.value {
                if context.contains(&lvalue.place.identifier) {
                    errors.push_diagnostic(
                        CompilerDiagnostic::new(
                            ErrorCategory::UseMemo,
                            "useMemo() callbacks may not reassign variables declared outside of the callback",
                            Some(
                                "useMemo() callbacks must be pure functions and cannot reassign variables defined outside of the callback function"
                                    .to_string(),
                            ),
                        )
                        .with_detail(CompilerDiagnosticDetail::Error {
                            loc: lvalue.place.loc,
                            message: Some("Cannot reassign variable".to_string()),
                        }),
                    );
                }
            }
        }
    }
}

fn has_non_void_return(func: &HirFunction) -> bool {
    for (_block_id, block) in &func.body.blocks {
        if let Terminal::Return { return_variant, .. } = &block.terminal {
            if matches!(return_variant, ReturnVariant::Explicit | ReturnVariant::Implicit) {
                return true;
            }
        }
    }
    false
}

/// Collect all operand IdentifierIds from an InstructionValue.
fn each_instruction_value_operand_ids(value: &InstructionValue) -> Vec<IdentifierId> {
    let mut ids = Vec::new();
    match value {
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            ids.push(place.identifier);
        }
        InstructionValue::StoreLocal { value: val, .. }
        | InstructionValue::StoreContext { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::Destructure { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            ids.push(left.identifier);
            ids.push(right.identifier);
        }
        InstructionValue::UnaryExpression { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::CallExpression { callee, args, .. } => {
            ids.push(callee.identifier);
            collect_place_or_spread_ids(args, &mut ids);
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            ids.push(receiver.identifier);
            ids.push(property.identifier);
            collect_place_or_spread_ids(args, &mut ids);
        }
        InstructionValue::NewExpression { callee, args, .. } => {
            ids.push(callee.identifier);
            collect_place_or_spread_ids(args, &mut ids);
        }
        InstructionValue::PropertyLoad { object, .. } => {
            ids.push(object.identifier);
        }
        InstructionValue::PropertyStore { object, value: val, .. } => {
            ids.push(object.identifier);
            ids.push(val.identifier);
        }
        InstructionValue::PropertyDelete { object, .. } => {
            ids.push(object.identifier);
        }
        InstructionValue::ComputedLoad {
            object, property, ..
        } => {
            ids.push(object.identifier);
            ids.push(property.identifier);
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value: val,
            ..
        } => {
            ids.push(object.identifier);
            ids.push(property.identifier);
            ids.push(val.identifier);
        }
        InstructionValue::ComputedDelete {
            object, property, ..
        } => {
            ids.push(object.identifier);
            ids.push(property.identifier);
        }
        InstructionValue::TypeCastExpression { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            ids.push(tag.identifier);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for place in subexprs {
                ids.push(place.identifier);
            }
        }
        InstructionValue::Await { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::GetIterator { collection, .. } => {
            ids.push(collection.identifier);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            ids.push(iterator.identifier);
            ids.push(collection.identifier);
        }
        InstructionValue::NextPropertyOf { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::PostfixUpdate { value: val, .. }
        | InstructionValue::PrefixUpdate { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::StoreGlobal { value: val, .. } => {
            ids.push(val.identifier);
        }
        InstructionValue::JsxExpression {
            tag, props, children, ..
        } => {
            match tag {
                JsxTag::Place(place) => ids.push(place.identifier),
                JsxTag::Builtin(_) => {}
            }
            for attr in props {
                match attr {
                    JsxAttribute::SpreadAttribute { argument } => ids.push(argument.identifier),
                    JsxAttribute::Attribute { place, .. } => ids.push(place.identifier),
                }
            }
            if let Some(children) = children {
                for child in children {
                    ids.push(child.identifier);
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for child in children {
                ids.push(child.identifier);
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        ids.push(p.place.identifier);
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } = &p.key {
                            ids.push(name.identifier);
                        }
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        ids.push(s.place.identifier);
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for elem in elements {
                match elem {
                    ArrayElement::Place(place) => ids.push(place.identifier),
                    ArrayElement::Spread(spread) => ids.push(spread.place.identifier),
                    ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            ids.push(decl.identifier);
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps {
                    if let ManualMemoDependencyRoot::NamedLocal { value, .. } = &dep.root {
                        ids.push(value.identifier);
                    }
                }
            }
        }
        // These have no operands
        InstructionValue::DeclareLocal { .. }
        | InstructionValue::DeclareContext { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::JSXText { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::UnsupportedNode { .. } => {}
    }
    ids
}

fn collect_place_or_spread_ids(args: &[PlaceOrSpread], ids: &mut Vec<IdentifierId>) {
    for arg in args {
        match arg {
            PlaceOrSpread::Place(place) => ids.push(place.identifier),
            PlaceOrSpread::Spread(spread) => ids.push(spread.place.identifier),
        }
    }
}

/// Collect all operand IdentifierIds from a Terminal.
fn each_terminal_operand_ids(terminal: &Terminal) -> Vec<IdentifierId> {
    let mut ids = Vec::new();
    match terminal {
        Terminal::Throw { value, .. } => {
            ids.push(value.identifier);
        }
        Terminal::Return { value, .. } => {
            ids.push(value.identifier);
        }
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
            ids.push(test.identifier);
        }
        Terminal::Switch { test, cases, .. } => {
            ids.push(test.identifier);
            for case in cases {
                if let Some(test_place) = &case.test {
                    ids.push(test_place.identifier);
                }
            }
        }
        Terminal::Try { handler_binding, .. } => {
            if let Some(binding) = handler_binding {
                ids.push(binding.identifier);
            }
        }
        // Terminals with no operand places
        Terminal::Unsupported { .. }
        | Terminal::Unreachable { .. }
        | Terminal::Goto { .. }
        | Terminal::DoWhile { .. }
        | Terminal::While { .. }
        | Terminal::For { .. }
        | Terminal::ForOf { .. }
        | Terminal::ForIn { .. }
        | Terminal::Logical { .. }
        | Terminal::Ternary { .. }
        | Terminal::Optional { .. }
        | Terminal::Label { .. }
        | Terminal::Sequence { .. }
        | Terminal::MaybeThrow { .. }
        | Terminal::Scope { .. }
        | Terminal::PrunedScope { .. } => {}
    }
    ids
}
