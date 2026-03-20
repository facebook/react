// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Aligns reactive scope boundaries to block scope boundaries in the HIR.
//!
//! Ported from TypeScript `src/ReactiveScopes/AlignReactiveScopesToBlockScopesHIR.ts`.
//!
//! This is the 2nd of 4 passes that determine how to break a function into
//! discrete reactive scopes (independently memoizable units of code):
//! 1. InferReactiveScopeVariables (on HIR) determines operands that mutate
//!    together and assigns them a unique reactive scope.
//! 2. AlignReactiveScopesToBlockScopes (this pass) aligns reactive scopes
//!    to block scopes.
//! 3. MergeOverlappingReactiveScopes ensures scopes do not overlap.
//! 4. BuildReactiveBlocks groups the statements for each scope.
//!
//! Prior inference passes assign a reactive scope to each operand, but the
//! ranges of these scopes are based on specific instructions at arbitrary
//! points in the control-flow graph. However, to codegen blocks around the
//! instructions in each scope, the scopes must be aligned to block-scope
//! boundaries — we can't memoize half of a loop!

use std::collections::{HashMap, HashSet};

use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    BlockId, BlockKind, EvaluationOrder, HirFunction, IdentifierId, InstructionValue,
    MutableRange, ScopeId, Terminal,
};

// =============================================================================
// Local helper: terminal_fallthrough
// =============================================================================

/// Return the fallthrough block of a terminal, if any.
/// Duplicated from react_compiler_lowering to avoid a crate dependency.
fn terminal_fallthrough(terminal: &Terminal) -> Option<BlockId> {
    match terminal {
        Terminal::If { fallthrough, .. }
        | Terminal::Branch { fallthrough, .. }
        | Terminal::Switch { fallthrough, .. }
        | Terminal::DoWhile { fallthrough, .. }
        | Terminal::While { fallthrough, .. }
        | Terminal::For { fallthrough, .. }
        | Terminal::ForOf { fallthrough, .. }
        | Terminal::ForIn { fallthrough, .. }
        | Terminal::Logical { fallthrough, .. }
        | Terminal::Ternary { fallthrough, .. }
        | Terminal::Optional { fallthrough, .. }
        | Terminal::Label { fallthrough, .. }
        | Terminal::Sequence { fallthrough, .. }
        | Terminal::Try { fallthrough, .. }
        | Terminal::Scope { fallthrough, .. }
        | Terminal::PrunedScope { fallthrough, .. } => Some(*fallthrough),

        Terminal::Goto { .. }
        | Terminal::Return { .. }
        | Terminal::Throw { .. }
        | Terminal::MaybeThrow { .. }
        | Terminal::Unreachable { .. }
        | Terminal::Unsupported { .. } => None,
    }
}

// =============================================================================
// ValueBlockNode — stores the valueRange for scope alignment in value blocks
// =============================================================================

/// Tracks the value range for a value block. The `children` field from the TS
/// implementation is only used for debug output and is omitted here.
#[derive(Clone)]
struct ValueBlockNode {
    value_range: MutableRange,
}

// =============================================================================
// Helper: get all block IDs referenced by a terminal (successors + fallthrough)
// =============================================================================

/// Returns all block IDs referenced by a terminal, including both direct
/// successors and fallthrough. Mirrors TS `mapTerminalSuccessors` visiting pattern.
fn all_terminal_block_ids(terminal: &Terminal) -> Vec<BlockId> {
    match terminal {
        Terminal::Goto { block, .. } => vec![*block],
        Terminal::If {
            consequent,
            alternate,
            fallthrough,
            ..
        } => vec![*consequent, *alternate, *fallthrough],
        Terminal::Branch {
            consequent,
            alternate,
            fallthrough,
            ..
        } => vec![*consequent, *alternate, *fallthrough],
        Terminal::Switch {
            cases, fallthrough, ..
        } => {
            let mut ids: Vec<BlockId> = cases.iter().map(|c| c.block).collect();
            ids.push(*fallthrough);
            ids
        }
        Terminal::DoWhile {
            loop_block,
            test,
            fallthrough,
            ..
        } => vec![*loop_block, *test, *fallthrough],
        Terminal::While {
            test,
            loop_block,
            fallthrough,
            ..
        } => vec![*test, *loop_block, *fallthrough],
        Terminal::For {
            init,
            test,
            update,
            loop_block,
            fallthrough,
            ..
        } => {
            let mut ids = vec![*init, *test];
            if let Some(u) = update {
                ids.push(*u);
            }
            ids.push(*loop_block);
            ids.push(*fallthrough);
            ids
        }
        Terminal::ForOf {
            init,
            test,
            loop_block,
            fallthrough,
            ..
        } => vec![*init, *test, *loop_block, *fallthrough],
        Terminal::ForIn {
            init,
            loop_block,
            fallthrough,
            ..
        } => vec![*init, *loop_block, *fallthrough],
        Terminal::Logical {
            test, fallthrough, ..
        }
        | Terminal::Ternary {
            test, fallthrough, ..
        }
        | Terminal::Optional {
            test, fallthrough, ..
        } => vec![*test, *fallthrough],
        Terminal::Label {
            block,
            fallthrough,
            ..
        }
        | Terminal::Sequence {
            block,
            fallthrough,
            ..
        } => vec![*block, *fallthrough],
        Terminal::MaybeThrow {
            continuation,
            handler,
            ..
        } => {
            let mut ids = vec![*continuation];
            if let Some(h) = handler {
                ids.push(*h);
            }
            ids
        }
        Terminal::Try {
            block,
            handler,
            fallthrough,
            ..
        } => vec![*block, *handler, *fallthrough],
        Terminal::Scope {
            block,
            fallthrough,
            ..
        }
        | Terminal::PrunedScope {
            block,
            fallthrough,
            ..
        } => vec![*block, *fallthrough],
        Terminal::Return { .. }
        | Terminal::Throw { .. }
        | Terminal::Unreachable { .. }
        | Terminal::Unsupported { .. } => vec![],
    }
}

// =============================================================================
// Helper: collect lvalue IdentifierIds from an instruction
// =============================================================================

fn each_instruction_lvalue_ids(
    instr: &react_compiler_hir::Instruction,
) -> Vec<IdentifierId> {
    let mut result = vec![instr.lvalue.identifier];
    match &instr.value {
        InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::DeclareContext { lvalue, .. } => {
            result.push(lvalue.place.identifier);
        }
        InstructionValue::StoreLocal { lvalue, .. } => {
            result.push(lvalue.place.identifier);
        }
        InstructionValue::StoreContext { lvalue, .. } => {
            result.push(lvalue.place.identifier);
        }
        InstructionValue::Destructure { lvalue, .. } => {
            each_pattern_identifier_ids(&lvalue.pattern, &mut result);
        }
        InstructionValue::PrefixUpdate { lvalue, .. }
        | InstructionValue::PostfixUpdate { lvalue, .. } => {
            result.push(lvalue.identifier);
        }
        _ => {}
    }
    result
}

fn each_pattern_identifier_ids(
    pattern: &react_compiler_hir::Pattern,
    result: &mut Vec<IdentifierId>,
) {
    match pattern {
        react_compiler_hir::Pattern::Array(arr) => {
            for el in &arr.items {
                match el {
                    react_compiler_hir::ArrayPatternElement::Place(p) => {
                        result.push(p.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Spread(s) => {
                        result.push(s.place.identifier);
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => {}
                }
            }
        }
        react_compiler_hir::Pattern::Object(obj) => {
            for prop in &obj.properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        result.push(p.place.identifier);
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        result.push(s.place.identifier);
                    }
                }
            }
        }
    }
}

// =============================================================================
// Helper: collect operand IdentifierIds from an instruction value
// =============================================================================

fn each_instruction_value_operand_ids(
    value: &InstructionValue,
    env: &Environment,
) -> Vec<IdentifierId> {
    let mut result = Vec::new();
    match value {
        InstructionValue::CallExpression { callee, args, .. }
        | InstructionValue::NewExpression { callee, args, .. } => {
            result.push(callee.identifier);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(p) => result.push(p.identifier),
                    react_compiler_hir::PlaceOrSpread::Spread(s) => {
                        result.push(s.place.identifier)
                    }
                }
            }
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            result.push(receiver.identifier);
            result.push(property.identifier);
            for arg in args {
                match arg {
                    react_compiler_hir::PlaceOrSpread::Place(p) => result.push(p.identifier),
                    react_compiler_hir::PlaceOrSpread::Spread(s) => {
                        result.push(s.place.identifier)
                    }
                }
            }
        }
        InstructionValue::BinaryExpression { left, right, .. } => {
            result.push(left.identifier);
            result.push(right.identifier);
        }
        InstructionValue::LoadLocal { place, .. } | InstructionValue::LoadContext { place, .. } => {
            result.push(place.identifier);
        }
        InstructionValue::StoreLocal { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::StoreContext { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::Destructure { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::UnaryExpression { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::TypeCastExpression { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::JsxExpression {
            tag,
            props,
            children,
            ..
        } => {
            if let react_compiler_hir::JsxTag::Place(p) = tag {
                result.push(p.identifier);
            }
            for prop in props {
                match prop {
                    react_compiler_hir::JsxAttribute::Attribute { place, .. } => {
                        result.push(place.identifier)
                    }
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                        result.push(argument.identifier)
                    }
                }
            }
            if let Some(ch) = children {
                for c in ch {
                    result.push(c.identifier);
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for c in children {
                result.push(c.identifier);
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        result.push(p.place.identifier);
                        if let react_compiler_hir::ObjectPropertyKey::Computed { name } = &p.key {
                            result.push(name.identifier);
                        }
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        result.push(s.place.identifier)
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for el in elements {
                match el {
                    react_compiler_hir::ArrayElement::Place(p) => result.push(p.identifier),
                    react_compiler_hir::ArrayElement::Spread(s) => {
                        result.push(s.place.identifier)
                    }
                    react_compiler_hir::ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::PropertyStore { object, value, .. }
        | InstructionValue::ComputedStore { object, value, .. } => {
            result.push(object.identifier);
            result.push(value.identifier);
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::ComputedLoad { object, .. } => {
            result.push(object.identifier);
        }
        InstructionValue::PropertyDelete { object, .. }
        | InstructionValue::ComputedDelete { object, .. } => {
            result.push(object.identifier);
        }
        InstructionValue::Await { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::GetIterator { collection, .. } => {
            result.push(collection.identifier);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            result.push(iterator.identifier);
            result.push(collection.identifier);
        }
        InstructionValue::NextPropertyOf { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::PrefixUpdate { value, .. }
        | InstructionValue::PostfixUpdate { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for s in subexprs {
                result.push(s.identifier);
            }
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            result.push(tag.identifier);
        }
        InstructionValue::StoreGlobal { value, .. } => {
            result.push(value.identifier);
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps {
                    if let react_compiler_hir::ManualMemoDependencyRoot::NamedLocal {
                        value, ..
                    } = &dep.root
                    {
                        result.push(value.identifier);
                    }
                }
            }
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            result.push(decl.identifier);
        }
        InstructionValue::FunctionExpression { lowered_func, .. }
        | InstructionValue::ObjectMethod { lowered_func, .. } => {
            let inner_func = &env.functions[lowered_func.func.0 as usize];
            for ctx in &inner_func.context {
                result.push(ctx.identifier);
            }
        }
        _ => {}
    }
    result
}

/// Collects terminal operand IdentifierIds.
fn each_terminal_operand_ids(terminal: &Terminal) -> Vec<IdentifierId> {
    match terminal {
        Terminal::Throw { value, .. } => vec![value.identifier],
        Terminal::Return { value, .. } => vec![value.identifier],
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => vec![test.identifier],
        Terminal::Switch { test, .. } => vec![test.identifier],
        _ => vec![],
    }
}

// =============================================================================
// Helper: get the first EvaluationOrder in a block
// =============================================================================

fn block_first_id(func: &HirFunction, block_id: BlockId) -> EvaluationOrder {
    let block = func.body.blocks.get(&block_id).unwrap();
    if !block.instructions.is_empty() {
        func.instructions[block.instructions[0].0 as usize].id
    } else {
        block.terminal.evaluation_order()
    }
}

// =============================================================================
// BlockFallthroughRange
// =============================================================================

#[derive(Clone)]
struct BlockFallthroughRange {
    fallthrough: BlockId,
    range: MutableRange,
}

// =============================================================================
// Public API
// =============================================================================

/// Aligns reactive scope boundaries to block scope boundaries in the HIR.
///
/// This pass updates reactive scope boundaries to align to control flow
/// boundaries. For example, if a scope ends partway through an if consequent,
/// the scope is extended to the end of the consequent block.
pub fn align_reactive_scopes_to_block_scopes_hir(func: &mut HirFunction, env: &mut Environment) {
    let mut active_block_fallthrough_ranges: Vec<BlockFallthroughRange> = Vec::new();
    let mut active_scopes: HashSet<ScopeId> = HashSet::new();
    let mut seen: HashSet<ScopeId> = HashSet::new();
    let mut value_block_nodes: HashMap<BlockId, ValueBlockNode> = HashMap::new();

    let block_ids: Vec<BlockId> = func.body.blocks.keys().copied().collect();

    for &block_id in &block_ids {
        let starting_id = block_first_id(func, block_id);

        // Retain only active scopes whose range.end > startingId
        active_scopes.retain(|&scope_id| {
            env.scopes[scope_id.0 as usize].range.end > starting_id
        });

        // Check if we've reached a fallthrough block
        if let Some(top) = active_block_fallthrough_ranges.last().cloned() {
            if top.fallthrough == block_id {
                active_block_fallthrough_ranges.pop();
                // All active scopes overlap this block-fallthrough range;
                // extend their start to include the range start.
                for &scope_id in &active_scopes {
                    let scope = &mut env.scopes[scope_id.0 as usize];
                    scope.range.start = std::cmp::min(scope.range.start, top.range.start);
                }
            }
        }

        let node = value_block_nodes.get(&block_id).cloned();

        // Visit instruction lvalues and operands
        let block = func.body.blocks.get(&block_id).unwrap();
        let instr_ids: Vec<react_compiler_hir::InstructionId> =
            block.instructions.iter().copied().collect();
        for &instr_id in &instr_ids {
            let instr = &func.instructions[instr_id.0 as usize];
            let eval_order = instr.id;

            let lvalue_ids = each_instruction_lvalue_ids(instr);
            for lvalue_id in lvalue_ids {
                record_place_id(
                    eval_order,
                    lvalue_id,
                    &node,
                    env,
                    &mut active_scopes,
                    &mut seen,
                );
            }

            let operand_ids = each_instruction_value_operand_ids(&instr.value, env);
            for operand_id in operand_ids {
                record_place_id(
                    eval_order,
                    operand_id,
                    &node,
                    env,
                    &mut active_scopes,
                    &mut seen,
                );
            }
        }

        // Visit terminal operands
        let block = func.body.blocks.get(&block_id).unwrap();
        let terminal_eval_order = block.terminal.evaluation_order();
        let terminal_operand_ids = each_terminal_operand_ids(&block.terminal);
        for operand_id in terminal_operand_ids {
            record_place_id(
                terminal_eval_order,
                operand_id,
                &node,
                env,
                &mut active_scopes,
                &mut seen,
            );
        }

        let block = func.body.blocks.get(&block_id).unwrap();
        let terminal = &block.terminal;
        let fallthrough = terminal_fallthrough(terminal);
        let is_branch = matches!(terminal, Terminal::Branch { .. });
        let is_goto = match terminal {
            Terminal::Goto { block, .. } => Some(*block),
            _ => None,
        };
        let is_ternary_logical_optional = matches!(
            terminal,
            Terminal::Ternary { .. } | Terminal::Logical { .. } | Terminal::Optional { .. }
        );
        let all_successors = all_terminal_block_ids(terminal);

        // Handle fallthrough logic
        if let Some(ft) = fallthrough {
            if !is_branch {
                let next_id = block_first_id(func, ft);

                for &scope_id in &active_scopes {
                    let scope = &mut env.scopes[scope_id.0 as usize];
                    if scope.range.end > terminal_eval_order {
                        scope.range.end = std::cmp::max(scope.range.end, next_id);
                    }
                }

                active_block_fallthrough_ranges.push(BlockFallthroughRange {
                    fallthrough: ft,
                    range: MutableRange {
                        start: terminal_eval_order,
                        end: next_id,
                    },
                });

                assert!(
                    !value_block_nodes.contains_key(&ft),
                    "Expect hir blocks to have unique fallthroughs"
                );
                if let Some(n) = &node {
                    value_block_nodes.insert(ft, n.clone());
                }
            }
        } else if let Some(goto_block) = is_goto {
            // Handle goto to label
            let start_pos = active_block_fallthrough_ranges
                .iter()
                .position(|r| r.fallthrough == goto_block);
            let top_idx = if active_block_fallthrough_ranges.is_empty() {
                None
            } else {
                Some(active_block_fallthrough_ranges.len() - 1)
            };
            if let Some(pos) = start_pos {
                if top_idx != Some(pos) {
                    let start_range = active_block_fallthrough_ranges[pos].clone();
                    let first_id = block_first_id(func, start_range.fallthrough);

                    for &scope_id in &active_scopes {
                        let scope = &mut env.scopes[scope_id.0 as usize];
                        if scope.range.end <= terminal_eval_order {
                            continue;
                        }
                        scope.range.start =
                            std::cmp::min(start_range.range.start, scope.range.start);
                        scope.range.end = std::cmp::max(first_id, scope.range.end);
                    }
                }
            }
        }

        // Visit all successors to set up value block nodes
        for successor in all_successors {
            if value_block_nodes.contains_key(&successor) {
                continue;
            }

            let successor_block = func.body.blocks.get(&successor).unwrap();
            if successor_block.kind == BlockKind::Block
                || successor_block.kind == BlockKind::Catch
            {
                // Block or catch kind: don't create a value block node
            } else if node.is_none() || is_ternary_logical_optional {
                // Create a new node when transitioning non-value -> value,
                // or for ternary/logical/optional terminals.
                let value_range = if node.is_none() {
                    // Transition from block -> value block
                    let ft =
                        fallthrough.expect("Expected a fallthrough for value block");
                    let next_id = block_first_id(func, ft);
                    MutableRange {
                        start: terminal_eval_order,
                        end: next_id,
                    }
                } else {
                    // Value -> value transition (ternary/logical/optional): reuse range
                    node.as_ref().unwrap().value_range.clone()
                };

                value_block_nodes.insert(
                    successor,
                    ValueBlockNode { value_range },
                );
            } else {
                // Value -> value block transition: reuse the node
                if let Some(n) = &node {
                    value_block_nodes.insert(successor, n.clone());
                }
            }
        }
    }

    // Sync identifier mutable_range with their scope's range.
    // In TS, identifier.mutableRange and scope.range are the same shared object,
    // so modifications to scope.range are automatically visible through the
    // identifier. In Rust they are separate copies, so we must explicitly sync.
    for ident in &mut env.identifiers {
        if let Some(scope_id) = ident.scope {
            let scope_range = &env.scopes[scope_id.0 as usize].range;
            ident.mutable_range.start = scope_range.start;
            ident.mutable_range.end = scope_range.end;
        }
    }
}

/// Records a place's scope as active and adjusts scope ranges for value blocks.
///
/// Mirrors TS `recordPlace(id, place, node)`.
fn record_place_id(
    id: EvaluationOrder,
    identifier_id: IdentifierId,
    node: &Option<ValueBlockNode>,
    env: &mut Environment,
    active_scopes: &mut HashSet<ScopeId>,
    seen: &mut HashSet<ScopeId>,
) {
    // Get the scope for this identifier, if active at this instruction
    let scope_id = match env.identifiers[identifier_id.0 as usize].scope {
        Some(scope_id) => {
            let scope = &env.scopes[scope_id.0 as usize];
            if id >= scope.range.start && id < scope.range.end {
                Some(scope_id)
            } else {
                None
            }
        }
        None => None,
    };

    if let Some(scope_id) = scope_id {
        active_scopes.insert(scope_id);

        if seen.contains(&scope_id) {
            return;
        }
        seen.insert(scope_id);

        if let Some(n) = node {
            let scope = &mut env.scopes[scope_id.0 as usize];
            scope.range.start = std::cmp::min(n.value_range.start, scope.range.start);
            scope.range.end = std::cmp::max(n.value_range.end, scope.range.end);
        }
    }
}
