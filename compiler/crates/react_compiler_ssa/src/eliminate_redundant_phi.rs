use std::collections::{HashMap, HashSet};

use react_compiler_hir::environment::Environment;
use react_compiler_hir::*;

use crate::enter_ssa::placeholder_function;

// =============================================================================
// Helper: rewrite_place
// =============================================================================

fn rewrite_place(place: &mut Place, rewrites: &HashMap<IdentifierId, IdentifierId>) {
    if let Some(&rewrite) = rewrites.get(&place.identifier) {
        place.identifier = rewrite;
    }
}

// =============================================================================
// Helper: rewrite_pattern_lvalues
// =============================================================================

fn rewrite_pattern_lvalues(
    pattern: &mut Pattern,
    rewrites: &HashMap<IdentifierId, IdentifierId>,
) {
    match pattern {
        Pattern::Array(arr) => {
            for item in arr.items.iter_mut() {
                match item {
                    ArrayPatternElement::Place(p) => rewrite_place(p, rewrites),
                    ArrayPatternElement::Spread(s) => rewrite_place(&mut s.place, rewrites),
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(obj) => {
            for prop in obj.properties.iter_mut() {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => rewrite_place(&mut p.place, rewrites),
                    ObjectPropertyOrSpread::Spread(s) => rewrite_place(&mut s.place, rewrites),
                }
            }
        }
    }
}

// =============================================================================
// Helper: rewrite_instruction_lvalues
// =============================================================================

/// Rewrites ALL lvalue places in an instruction, including:
/// - instr.lvalue (the instruction's main lvalue)
/// - DeclareLocal/StoreLocal lvalue.place
/// - DeclareContext/StoreContext lvalue.place (unlike map_instruction_lvalues in enter_ssa)
/// - Destructure pattern places
/// - PrefixUpdate/PostfixUpdate lvalue
fn rewrite_instruction_lvalues(
    instr: &mut Instruction,
    rewrites: &HashMap<IdentifierId, IdentifierId>,
) {
    match &mut instr.value {
        InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::StoreLocal { lvalue, .. } => {
            rewrite_place(&mut lvalue.place, rewrites);
        }
        InstructionValue::DeclareContext { lvalue, .. }
        | InstructionValue::StoreContext { lvalue, .. } => {
            rewrite_place(&mut lvalue.place, rewrites);
        }
        InstructionValue::Destructure { lvalue, .. } => {
            rewrite_pattern_lvalues(&mut lvalue.pattern, rewrites);
        }
        InstructionValue::PostfixUpdate { lvalue, .. }
        | InstructionValue::PrefixUpdate { lvalue, .. } => {
            rewrite_place(lvalue, rewrites);
        }
        InstructionValue::BinaryExpression { .. }
        | InstructionValue::PropertyLoad { .. }
        | InstructionValue::PropertyDelete { .. }
        | InstructionValue::PropertyStore { .. }
        | InstructionValue::ComputedLoad { .. }
        | InstructionValue::ComputedDelete { .. }
        | InstructionValue::ComputedStore { .. }
        | InstructionValue::LoadLocal { .. }
        | InstructionValue::LoadContext { .. }
        | InstructionValue::StoreGlobal { .. }
        | InstructionValue::NewExpression { .. }
        | InstructionValue::CallExpression { .. }
        | InstructionValue::MethodCall { .. }
        | InstructionValue::UnaryExpression { .. }
        | InstructionValue::JsxExpression { .. }
        | InstructionValue::ObjectExpression { .. }
        | InstructionValue::ArrayExpression { .. }
        | InstructionValue::JsxFragment { .. }
        | InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. }
        | InstructionValue::TaggedTemplateExpression { .. }
        | InstructionValue::TypeCastExpression { .. }
        | InstructionValue::TemplateLiteral { .. }
        | InstructionValue::Await { .. }
        | InstructionValue::GetIterator { .. }
        | InstructionValue::IteratorNext { .. }
        | InstructionValue::NextPropertyOf { .. }
        | InstructionValue::StartMemoize { .. }
        | InstructionValue::FinishMemoize { .. }
        | InstructionValue::Debugger { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::UnsupportedNode { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::JSXText { .. } => {}
    }
    rewrite_place(&mut instr.lvalue, rewrites);
}

// =============================================================================
// Helper: rewrite_instruction_operands
// =============================================================================

/// Rewrites all operand (read) Places in an instruction value.
/// For FunctionExpression/ObjectMethod, context is handled separately
/// in the main loop (not here).
fn rewrite_instruction_operands(
    instr: &mut Instruction,
    rewrites: &HashMap<IdentifierId, IdentifierId>,
) {
    match &mut instr.value {
        InstructionValue::BinaryExpression { left, right, .. } => {
            rewrite_place(left, rewrites);
            rewrite_place(right, rewrites);
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::PropertyDelete { object, .. } => {
            rewrite_place(object, rewrites);
        }
        InstructionValue::PropertyStore { object, value, .. } => {
            rewrite_place(object, rewrites);
            rewrite_place(value, rewrites);
        }
        InstructionValue::ComputedLoad {
            object, property, ..
        }
        | InstructionValue::ComputedDelete {
            object, property, ..
        } => {
            rewrite_place(object, rewrites);
            rewrite_place(property, rewrites);
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value,
            ..
        } => {
            rewrite_place(object, rewrites);
            rewrite_place(property, rewrites);
            rewrite_place(value, rewrites);
        }
        InstructionValue::DeclareContext { .. } | InstructionValue::DeclareLocal { .. } => {}
        InstructionValue::LoadLocal { place, .. }
        | InstructionValue::LoadContext { place, .. } => {
            rewrite_place(place, rewrites);
        }
        InstructionValue::StoreLocal { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::StoreContext { lvalue, value, .. } => {
            rewrite_place(&mut lvalue.place, rewrites);
            rewrite_place(value, rewrites);
        }
        InstructionValue::StoreGlobal { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::Destructure { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::NewExpression { callee, args, .. }
        | InstructionValue::CallExpression { callee, args, .. } => {
            rewrite_place(callee, rewrites);
            for arg in args.iter_mut() {
                match arg {
                    PlaceOrSpread::Place(p) => rewrite_place(p, rewrites),
                    PlaceOrSpread::Spread(s) => rewrite_place(&mut s.place, rewrites),
                }
            }
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            rewrite_place(receiver, rewrites);
            rewrite_place(property, rewrites);
            for arg in args.iter_mut() {
                match arg {
                    PlaceOrSpread::Place(p) => rewrite_place(p, rewrites),
                    PlaceOrSpread::Spread(s) => rewrite_place(&mut s.place, rewrites),
                }
            }
        }
        InstructionValue::UnaryExpression { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::JsxExpression {
            tag,
            props,
            children,
            ..
        } => {
            if let JsxTag::Place(p) = tag {
                rewrite_place(p, rewrites);
            }
            for attr in props.iter_mut() {
                match attr {
                    JsxAttribute::SpreadAttribute { argument } => {
                        rewrite_place(argument, rewrites)
                    }
                    JsxAttribute::Attribute { place, .. } => rewrite_place(place, rewrites),
                }
            }
            if let Some(children) = children {
                for child in children.iter_mut() {
                    rewrite_place(child, rewrites);
                }
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties.iter_mut() {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => {
                        if let ObjectPropertyKey::Computed { name } = &mut p.key {
                            rewrite_place(name, rewrites);
                        }
                        rewrite_place(&mut p.place, rewrites);
                    }
                    ObjectPropertyOrSpread::Spread(s) => {
                        rewrite_place(&mut s.place, rewrites);
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for elem in elements.iter_mut() {
                match elem {
                    ArrayElement::Place(p) => rewrite_place(p, rewrites),
                    ArrayElement::Spread(s) => rewrite_place(&mut s.place, rewrites),
                    ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for child in children.iter_mut() {
                rewrite_place(child, rewrites);
            }
        }
        InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. } => {
            // Context places are handled separately in the main loop
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            rewrite_place(tag, rewrites);
        }
        InstructionValue::TypeCastExpression { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for expr in subexprs.iter_mut() {
                rewrite_place(expr, rewrites);
            }
        }
        InstructionValue::Await { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::GetIterator { collection, .. } => {
            rewrite_place(collection, rewrites);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            rewrite_place(iterator, rewrites);
            rewrite_place(collection, rewrites);
        }
        InstructionValue::NextPropertyOf { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::PostfixUpdate { value, .. }
        | InstructionValue::PrefixUpdate { value, .. } => {
            rewrite_place(value, rewrites);
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps.iter_mut() {
                    if let ManualMemoDependencyRoot::NamedLocal { value, .. } = &mut dep.root {
                        rewrite_place(value, rewrites);
                    }
                }
            }
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            rewrite_place(decl, rewrites);
        }
        InstructionValue::Debugger { .. }
        | InstructionValue::RegExpLiteral { .. }
        | InstructionValue::MetaProperty { .. }
        | InstructionValue::LoadGlobal { .. }
        | InstructionValue::UnsupportedNode { .. }
        | InstructionValue::Primitive { .. }
        | InstructionValue::JSXText { .. } => {}
    }
}

// =============================================================================
// Helper: rewrite_terminal_operands
// =============================================================================

fn rewrite_terminal_operands(
    terminal: &mut Terminal,
    rewrites: &HashMap<IdentifierId, IdentifierId>,
) {
    match terminal {
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
            rewrite_place(test, rewrites);
        }
        Terminal::Switch { test, cases, .. } => {
            rewrite_place(test, rewrites);
            for case in cases.iter_mut() {
                if let Some(t) = &mut case.test {
                    rewrite_place(t, rewrites);
                }
            }
        }
        Terminal::Return { value, .. } | Terminal::Throw { value, .. } => {
            rewrite_place(value, rewrites);
        }
        Terminal::Try {
            handler_binding, ..
        } => {
            if let Some(binding) = handler_binding {
                rewrite_place(binding, rewrites);
            }
        }
        Terminal::Goto { .. }
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
        | Terminal::PrunedScope { .. }
        | Terminal::Unreachable { .. }
        | Terminal::Unsupported { .. } => {}
    }
}

// =============================================================================
// Public entry point
// =============================================================================

pub fn eliminate_redundant_phi(func: &mut HirFunction, env: &mut Environment) {
    let mut rewrites: HashMap<IdentifierId, IdentifierId> = HashMap::new();
    eliminate_redundant_phi_impl(func, env, &mut rewrites);
}

// =============================================================================
// Inner implementation
// =============================================================================

fn eliminate_redundant_phi_impl(
    func: &mut HirFunction,
    env: &mut Environment,
    rewrites: &mut HashMap<IdentifierId, IdentifierId>,
) {
    let ir = &mut func.body;

    let mut has_back_edge = false;
    let mut visited: HashSet<BlockId> = HashSet::new();

    let mut size;
    loop {
        size = rewrites.len();

        let block_ids: Vec<BlockId> = ir.blocks.keys().copied().collect();
        for block_id in &block_ids {
            let block_id = *block_id;

            if !has_back_edge {
                let block = ir.blocks.get(&block_id).unwrap();
                for pred_id in &block.preds {
                    if !visited.contains(pred_id) {
                        has_back_edge = true;
                    }
                }
            }
            visited.insert(block_id);

            // Find any redundant phis: rewrite operands, identify redundant phis, remove them
            let block = ir.blocks.get_mut(&block_id).unwrap();

            // Rewrite phi operands
            for phi in block.phis.iter_mut() {
                for (_, operand) in phi.operands.iter_mut() {
                    rewrite_place(operand, rewrites);
                }
            }

            // Identify redundant phis
            let mut phis_to_remove: Vec<usize> = Vec::new();
            for (idx, phi) in block.phis.iter().enumerate() {
                let mut same: Option<IdentifierId> = None;
                let mut is_redundant = true;
                for (_, operand) in &phi.operands {
                    if (same.is_some() && operand.identifier == same.unwrap())
                        || operand.identifier == phi.place.identifier
                    {
                        continue;
                    } else if same.is_some() {
                        is_redundant = false;
                        break;
                    } else {
                        same = Some(operand.identifier);
                    }
                }
                if is_redundant {
                    let same = same.expect("Expected phis to be non-empty");
                    rewrites.insert(phi.place.identifier, same);
                    phis_to_remove.push(idx);
                }
            }

            // Remove redundant phis in reverse order to preserve indices
            for idx in phis_to_remove.into_iter().rev() {
                block.phis.remove(idx);
            }

            // Rewrite instructions
            let instruction_ids: Vec<InstructionId> = ir
                .blocks
                .get(&block_id)
                .unwrap()
                .instructions
                .clone();

            for instr_id in &instruction_ids {
                let instr_idx = instr_id.0 as usize;
                let instr = &mut func.instructions[instr_idx];

                rewrite_instruction_lvalues(instr, rewrites);
                rewrite_instruction_operands(instr, rewrites);

                // Handle FunctionExpression/ObjectMethod context and recursion
                let func_expr_id = match &instr.value {
                    InstructionValue::FunctionExpression { lowered_func, .. }
                    | InstructionValue::ObjectMethod { lowered_func, .. } => {
                        Some(lowered_func.func)
                    }
                    _ => None,
                };

                if let Some(fid) = func_expr_id {
                    // Rewrite context places
                    let context =
                        &mut env.functions[fid.0 as usize].context;
                    for place in context.iter_mut() {
                        rewrite_place(place, rewrites);
                    }

                    // Take inner function out, process it, put it back
                    let mut inner_func = std::mem::replace(
                        &mut env.functions[fid.0 as usize],
                        placeholder_function(),
                    );

                    eliminate_redundant_phi_impl(&mut inner_func, env, rewrites);

                    env.functions[fid.0 as usize] = inner_func;
                }
            }

            // Rewrite terminal operands
            let terminal = &mut ir.blocks.get_mut(&block_id).unwrap().terminal;
            rewrite_terminal_operands(terminal, rewrites);
        }

        if !(rewrites.len() > size && has_back_edge) {
            break;
        }
    }
}
