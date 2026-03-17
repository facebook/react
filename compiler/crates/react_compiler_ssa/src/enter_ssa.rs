use std::collections::{HashMap, HashSet};

use indexmap::IndexMap;
use react_compiler_diagnostics::{CompilerDiagnostic, CompilerDiagnosticDetail, ErrorCategory};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::*;
use react_compiler_lowering::each_terminal_successor;

// =============================================================================
// Helper: map_instruction_operands
// =============================================================================

/// Maps all operand (read) Places in an instruction value via `f`.
/// For FunctionExpression/ObjectMethod, also maps the context places of the
/// inner function (accessed via env).
fn map_instruction_operands(
    instr: &mut Instruction,
    env: &mut Environment,
    f: &mut impl FnMut(&mut Place, &mut Environment),
) {
    match &mut instr.value {
        InstructionValue::BinaryExpression { left, right, .. } => {
            f(left, env);
            f(right, env);
        }
        InstructionValue::PropertyLoad { object, .. }
        | InstructionValue::PropertyDelete { object, .. } => {
            f(object, env);
        }
        InstructionValue::PropertyStore { object, value, .. } => {
            f(object, env);
            f(value, env);
        }
        InstructionValue::ComputedLoad {
            object, property, ..
        }
        | InstructionValue::ComputedDelete {
            object, property, ..
        } => {
            f(object, env);
            f(property, env);
        }
        InstructionValue::ComputedStore {
            object,
            property,
            value,
            ..
        } => {
            f(object, env);
            f(property, env);
            f(value, env);
        }
        InstructionValue::DeclareContext { .. } | InstructionValue::DeclareLocal { .. } => {}
        InstructionValue::LoadLocal { place, .. } | InstructionValue::LoadContext { place, .. } => {
            f(place, env);
        }
        InstructionValue::StoreLocal { value, .. } => {
            f(value, env);
        }
        InstructionValue::StoreContext { lvalue, value, .. } => {
            f(&mut lvalue.place, env);
            f(value, env);
        }
        InstructionValue::StoreGlobal { value, .. } => {
            f(value, env);
        }
        InstructionValue::Destructure { value, .. } => {
            f(value, env);
        }
        InstructionValue::NewExpression { callee, args, .. }
        | InstructionValue::CallExpression { callee, args, .. } => {
            f(callee, env);
            for arg in args.iter_mut() {
                match arg {
                    PlaceOrSpread::Place(p) => f(p, env),
                    PlaceOrSpread::Spread(s) => f(&mut s.place, env),
                }
            }
        }
        InstructionValue::MethodCall {
            receiver,
            property,
            args,
            ..
        } => {
            f(receiver, env);
            f(property, env);
            for arg in args.iter_mut() {
                match arg {
                    PlaceOrSpread::Place(p) => f(p, env),
                    PlaceOrSpread::Spread(s) => f(&mut s.place, env),
                }
            }
        }
        InstructionValue::UnaryExpression { value, .. } => {
            f(value, env);
        }
        InstructionValue::JsxExpression {
            tag,
            props,
            children,
            ..
        } => {
            if let JsxTag::Place(p) = tag {
                f(p, env);
            }
            for attr in props.iter_mut() {
                match attr {
                    JsxAttribute::SpreadAttribute { argument } => f(argument, env),
                    JsxAttribute::Attribute { place, .. } => f(place, env),
                }
            }
            if let Some(children) = children {
                for child in children.iter_mut() {
                    f(child, env);
                }
            }
        }
        InstructionValue::ObjectExpression { properties, .. } => {
            for prop in properties.iter_mut() {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => {
                        if let ObjectPropertyKey::Computed { name } = &mut p.key {
                            f(name, env);
                        }
                        f(&mut p.place, env);
                    }
                    ObjectPropertyOrSpread::Spread(s) => {
                        f(&mut s.place, env);
                    }
                }
            }
        }
        InstructionValue::ArrayExpression { elements, .. } => {
            for elem in elements.iter_mut() {
                match elem {
                    ArrayElement::Place(p) => f(p, env),
                    ArrayElement::Spread(s) => f(&mut s.place, env),
                    ArrayElement::Hole => {}
                }
            }
        }
        InstructionValue::JsxFragment { children, .. } => {
            for child in children.iter_mut() {
                f(child, env);
            }
        }
        InstructionValue::FunctionExpression { .. }
        | InstructionValue::ObjectMethod { .. } => {
            // Context places are mapped separately before this call
            // (in enter_ssa_impl) to avoid borrow conflicts with env.functions.
        }
        InstructionValue::TaggedTemplateExpression { tag, .. } => {
            f(tag, env);
        }
        InstructionValue::TypeCastExpression { value, .. } => {
            f(value, env);
        }
        InstructionValue::TemplateLiteral { subexprs, .. } => {
            for expr in subexprs.iter_mut() {
                f(expr, env);
            }
        }
        InstructionValue::Await { value, .. } => {
            f(value, env);
        }
        InstructionValue::GetIterator { collection, .. } => {
            f(collection, env);
        }
        InstructionValue::IteratorNext {
            iterator,
            collection,
            ..
        } => {
            f(iterator, env);
            f(collection, env);
        }
        InstructionValue::NextPropertyOf { value, .. } => {
            f(value, env);
        }
        InstructionValue::PostfixUpdate { value, .. }
        | InstructionValue::PrefixUpdate { value, .. } => {
            f(value, env);
        }
        InstructionValue::StartMemoize { deps, .. } => {
            if let Some(deps) = deps {
                for dep in deps.iter_mut() {
                    if let ManualMemoDependencyRoot::NamedLocal { value, .. } = &mut dep.root {
                        f(value, env);
                    }
                }
            }
        }
        InstructionValue::FinishMemoize { decl, .. } => {
            f(decl, env);
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
// Helper: map_instruction_lvalues
// =============================================================================

fn map_instruction_lvalues(
    instr: &mut Instruction,
    f: &mut impl FnMut(&mut Place) -> Result<(), CompilerDiagnostic>,
) -> Result<(), CompilerDiagnostic> {
    match &mut instr.value {
        InstructionValue::DeclareLocal { lvalue, .. }
        | InstructionValue::StoreLocal { lvalue, .. } => {
            f(&mut lvalue.place)?;
        }
        InstructionValue::DeclareContext { .. } | InstructionValue::StoreContext { .. } => {}
        InstructionValue::Destructure { lvalue, .. } => {
            map_pattern_lvalues(&mut lvalue.pattern, f)?;
        }
        InstructionValue::PostfixUpdate { lvalue, .. }
        | InstructionValue::PrefixUpdate { lvalue, .. } => {
            f(lvalue)?;
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
    f(&mut instr.lvalue)?;
    Ok(())
}

fn map_pattern_lvalues(
    pattern: &mut Pattern,
    f: &mut impl FnMut(&mut Place) -> Result<(), CompilerDiagnostic>,
) -> Result<(), CompilerDiagnostic> {
    match pattern {
        Pattern::Array(arr) => {
            for item in arr.items.iter_mut() {
                match item {
                    ArrayPatternElement::Place(p) => f(p)?,
                    ArrayPatternElement::Spread(s) => f(&mut s.place)?,
                    ArrayPatternElement::Hole => {}
                }
            }
        }
        Pattern::Object(obj) => {
            for prop in obj.properties.iter_mut() {
                match prop {
                    ObjectPropertyOrSpread::Property(p) => f(&mut p.place)?,
                    ObjectPropertyOrSpread::Spread(s) => f(&mut s.place)?,
                }
            }
        }
    }
    Ok(())
}

// =============================================================================
// Helper: map_terminal_operands
// =============================================================================

fn map_terminal_operands(terminal: &mut Terminal, mut f: impl FnMut(&mut Place)) {
    match terminal {
        Terminal::If { test, .. } | Terminal::Branch { test, .. } => {
            f(test);
        }
        Terminal::Switch { test, cases, .. } => {
            f(test);
            for case in cases.iter_mut() {
                if let Some(t) = &mut case.test {
                    f(t);
                }
            }
        }
        Terminal::Return { value, .. } | Terminal::Throw { value, .. } => {
            f(value);
        }
        Terminal::Try {
            handler_binding, ..
        } => {
            if let Some(binding) = handler_binding {
                f(binding);
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
// SSABuilder
// =============================================================================

struct IncompletePhi {
    old_place: Place,
    new_place: Place,
}

struct State {
    defs: HashMap<IdentifierId, IdentifierId>,
    incomplete_phis: Vec<IncompletePhi>,
}

struct SSABuilder {
    states: HashMap<BlockId, State>,
    current: Option<BlockId>,
    unsealed_preds: HashMap<BlockId, u32>,
    block_preds: HashMap<BlockId, Vec<BlockId>>,
    unknown: HashSet<IdentifierId>,
    context: HashSet<IdentifierId>,
    pending_phis: HashMap<BlockId, Vec<Phi>>,
    processed_functions: Vec<FunctionId>,
}

impl SSABuilder {
    fn new(blocks: &IndexMap<BlockId, BasicBlock>) -> Self {
        let mut block_preds = HashMap::new();
        for (id, block) in blocks {
            block_preds.insert(*id, block.preds.iter().copied().collect());
        }
        SSABuilder {
            states: HashMap::new(),
            current: None,
            unsealed_preds: HashMap::new(),
            block_preds,
            unknown: HashSet::new(),
            context: HashSet::new(),
            pending_phis: HashMap::new(),
            processed_functions: Vec::new(),
        }
    }

    fn define_function(&mut self, func: &HirFunction) {
        for (id, block) in &func.body.blocks {
            self.block_preds
                .insert(*id, block.preds.iter().copied().collect());
        }
    }

    fn state_mut(&mut self) -> &mut State {
        let current = self.current.expect("we need to be in a block to access state!");
        self.states
            .get_mut(&current)
            .expect("state not found for current block")
    }

    fn make_id(&mut self, old_id: IdentifierId, env: &mut Environment) -> IdentifierId {
        let new_id = env.next_identifier_id();
        let old = &env.identifiers[old_id.0 as usize];
        let declaration_id = old.declaration_id;
        let name = old.name.clone();
        let loc = old.loc;
        let new_ident = &mut env.identifiers[new_id.0 as usize];
        new_ident.declaration_id = declaration_id;
        new_ident.name = name;
        new_ident.loc = loc;
        new_id
    }

    fn define_place(&mut self, old_place: &Place, env: &mut Environment) -> Result<Place, CompilerDiagnostic> {
        let old_id = old_place.identifier;

        if self.unknown.contains(&old_id) {
            return Err(CompilerDiagnostic::new(
                ErrorCategory::Todo,
                "[hoisting] EnterSSA: Expected identifier to be defined before being used",
                Some(format!("Identifier {:?} is undefined", old_id)),
            ).with_detail(CompilerDiagnosticDetail::Error {
                loc: old_place.loc,
                message: None,
            }));
        }

        // Do not redefine context references.
        if self.context.contains(&old_id) {
            return Ok(self.get_place(old_place, env));
        }

        let new_id = self.make_id(old_id, env);
        self.state_mut().defs.insert(old_id, new_id);
        Ok(Place {
            identifier: new_id,
            effect: old_place.effect,
            reactive: old_place.reactive,
            loc: old_place.loc,
        })
    }

    #[allow(dead_code)]
    fn define_context(&mut self, old_place: &Place, env: &mut Environment) -> Result<Place, CompilerDiagnostic> {
        let old_id = old_place.identifier;
        let new_place = self.define_place(old_place, env)?;
        self.context.insert(old_id);
        Ok(new_place)
    }

    fn get_place(&mut self, old_place: &Place, env: &mut Environment) -> Place {
        let current_id = self.current.expect("must be in a block");
        let new_id = self.get_id_at(old_place, current_id, env);
        Place {
            identifier: new_id,
            effect: old_place.effect,
            reactive: old_place.reactive,
            loc: old_place.loc,
        }
    }

    fn get_id_at(
        &mut self,
        old_place: &Place,
        block_id: BlockId,
        env: &mut Environment,
    ) -> IdentifierId {
        if let Some(state) = self.states.get(&block_id) {
            if let Some(&new_id) = state.defs.get(&old_place.identifier) {
                return new_id;
            }
        }

        let preds = self
            .block_preds
            .get(&block_id)
            .cloned()
            .unwrap_or_default();

        if preds.is_empty() {
            self.unknown.insert(old_place.identifier);
            return old_place.identifier;
        }

        let unsealed = self.unsealed_preds.get(&block_id).copied().unwrap_or(0);
        if unsealed > 0 {
            let new_id = self.make_id(old_place.identifier, env);
            let new_place = Place {
                identifier: new_id,
                effect: old_place.effect,
                reactive: old_place.reactive,
                loc: old_place.loc,
            };
            let state = self.states.get_mut(&block_id).unwrap();
            state.incomplete_phis.push(IncompletePhi {
                old_place: old_place.clone(),
                new_place,
            });
            state.defs.insert(old_place.identifier, new_id);
            return new_id;
        }

        if preds.len() == 1 {
            let pred = preds[0];
            let new_id = self.get_id_at(old_place, pred, env);
            self.states
                .get_mut(&block_id)
                .unwrap()
                .defs
                .insert(old_place.identifier, new_id);
            return new_id;
        }

        let new_id = self.make_id(old_place.identifier, env);
        self.states
            .get_mut(&block_id)
            .unwrap()
            .defs
            .insert(old_place.identifier, new_id);
        let new_place = Place {
            identifier: new_id,
            effect: old_place.effect,
            reactive: old_place.reactive,
            loc: old_place.loc,
        };
        self.add_phi(block_id, old_place, &new_place, env);
        new_id
    }

    fn add_phi(
        &mut self,
        block_id: BlockId,
        old_place: &Place,
        new_place: &Place,
        env: &mut Environment,
    ) {
        let preds = self
            .block_preds
            .get(&block_id)
            .cloned()
            .unwrap_or_default();

        let mut pred_defs: IndexMap<BlockId, Place> = IndexMap::new();
        for pred_block_id in &preds {
            let pred_id = self.get_id_at(old_place, *pred_block_id, env);
            pred_defs.insert(
                *pred_block_id,
                Place {
                    identifier: pred_id,
                    effect: old_place.effect,
                    reactive: old_place.reactive,
                    loc: old_place.loc,
                },
            );
        }

        let phi = Phi {
            place: new_place.clone(),
            operands: pred_defs,
        };

        self.pending_phis
            .entry(block_id)
            .or_default()
            .push(phi);
    }

    fn fix_incomplete_phis(&mut self, block_id: BlockId, env: &mut Environment) {
        let incomplete_phis: Vec<IncompletePhi> = self
            .states
            .get_mut(&block_id)
            .unwrap()
            .incomplete_phis
            .drain(..)
            .collect();
        for phi in &incomplete_phis {
            self.add_phi(block_id, &phi.old_place, &phi.new_place, env);
        }
    }

    fn start_block(&mut self, block_id: BlockId) {
        self.current = Some(block_id);
        self.states.insert(
            block_id,
            State {
                defs: HashMap::new(),
                incomplete_phis: Vec::new(),
            },
        );
    }
}

// =============================================================================
// Public entry point
// =============================================================================

pub fn enter_ssa(
    func: &mut HirFunction,
    env: &mut Environment,
) -> Result<(), CompilerDiagnostic> {
    let mut builder = SSABuilder::new(&func.body.blocks);
    let root_entry = func.body.entry;
    enter_ssa_impl(func, &mut builder, env, root_entry)?;

    // Apply all pending phis to the actual blocks
    apply_pending_phis(func, env, &mut builder);

    Ok(())
}

fn apply_pending_phis(
    func: &mut HirFunction,
    env: &mut Environment,
    builder: &mut SSABuilder,
) {
    for (block_id, block) in func.body.blocks.iter_mut() {
        if let Some(phis) = builder.pending_phis.remove(block_id) {
            block.phis.extend(phis);
        }
    }
    for fid in &builder.processed_functions.clone() {
        let inner_func = &mut env.functions[fid.0 as usize];
        for (block_id, block) in inner_func.body.blocks.iter_mut() {
            if let Some(phis) = builder.pending_phis.remove(block_id) {
                block.phis.extend(phis);
            }
        }
    }
}

fn enter_ssa_impl(
    func: &mut HirFunction,
    builder: &mut SSABuilder,
    env: &mut Environment,
    root_entry: BlockId,
) -> Result<(), CompilerDiagnostic> {
    let mut visited_blocks: HashSet<BlockId> = HashSet::new();
    let block_ids: Vec<BlockId> = func.body.blocks.keys().copied().collect();

    for block_id in &block_ids {
        let block_id = *block_id;

        if visited_blocks.contains(&block_id) {
            return Err(CompilerDiagnostic::new(
                ErrorCategory::Invariant,
                format!("found a cycle! visiting bb{} again", block_id.0),
                None,
            ));
        }

        visited_blocks.insert(block_id);
        builder.start_block(block_id);

        // Handle params at the root entry
        if block_id == root_entry {
            if !func.context.is_empty() {
                return Err(CompilerDiagnostic::new(
                    ErrorCategory::Invariant,
                    "Expected function context to be empty for outer function declarations",
                    None,
                ));
            }
            let params = std::mem::take(&mut func.params);
            let mut new_params = Vec::with_capacity(params.len());
            for param in params {
                new_params.push(match param {
                    ParamPattern::Place(p) => ParamPattern::Place(builder.define_place(&p, env)?),
                    ParamPattern::Spread(s) => ParamPattern::Spread(SpreadPattern {
                        place: builder.define_place(&s.place, env)?,
                    }),
                });
            }
            func.params = new_params;
        }

        // Process instructions
        let instruction_ids: Vec<InstructionId> = func
            .body
            .blocks
            .get(&block_id)
            .unwrap()
            .instructions
            .clone();

        for instr_id in &instruction_ids {
            let instr_idx = instr_id.0 as usize;
            let instr = &mut func.instructions[instr_idx];

            // For FunctionExpression/ObjectMethod, we need to handle context
            // mapping specially because env.functions is borrowed by the closure.
            // First, check if this is a FunctionExpression/ObjectMethod and handle
            // context mapping separately.
            let func_expr_id = match &instr.value {
                InstructionValue::FunctionExpression { lowered_func, .. }
                | InstructionValue::ObjectMethod { lowered_func, .. } => Some(lowered_func.func),
                _ => None,
            };

            // Map context places for function expressions before other operands
            if let Some(fid) = func_expr_id {
                let context = std::mem::take(&mut env.functions[fid.0 as usize].context);
                env.functions[fid.0 as usize].context = context
                    .into_iter()
                    .map(|place| builder.get_place(&place, env))
                    .collect();
            }

            // Map non-context operands
            map_instruction_operands(instr, env, &mut |place, env| {
                *place = builder.get_place(place, env);
            });

            // Map lvalues
            let instr = &mut func.instructions[instr_idx];
            map_instruction_lvalues(instr, &mut |place| {
                *place = builder.define_place(place, env)?;
                Ok(())
            })?;

            // Handle inner function SSA
            if let Some(fid) = func_expr_id {
                builder.processed_functions.push(fid);
                let inner_func = &mut env.functions[fid.0 as usize];
                let inner_entry = inner_func.body.entry;
                let entry_block = inner_func.body.blocks.get_mut(&inner_entry).unwrap();

                if !entry_block.preds.is_empty() {
                    return Err(CompilerDiagnostic::new(
                        ErrorCategory::Invariant,
                        "Expected function expression entry block to have zero predecessors",
                        None,
                    ));
                }
                entry_block.preds.insert(block_id);

                builder.define_function(inner_func);

                let saved_current = builder.current;

                // Map inner function params
                let inner_params = std::mem::take(&mut env.functions[fid.0 as usize].params);
                let mut new_inner_params = Vec::with_capacity(inner_params.len());
                for param in inner_params {
                    new_inner_params.push(match param {
                        ParamPattern::Place(p) => ParamPattern::Place(builder.define_place(&p, env)?),
                        ParamPattern::Spread(s) => ParamPattern::Spread(SpreadPattern {
                            place: builder.define_place(&s.place, env)?,
                        }),
                    });
                }
                env.functions[fid.0 as usize].params = new_inner_params;

                // Take the inner function out of the arena to process it
                let mut inner_func = std::mem::replace(
                    &mut env.functions[fid.0 as usize],
                    placeholder_function(),
                );

                enter_ssa_impl(&mut inner_func, builder, env, root_entry)?;

                // Put it back
                env.functions[fid.0 as usize] = inner_func;

                builder.current = saved_current;

                // Clear entry preds
                env.functions[fid.0 as usize]
                    .body
                    .blocks
                    .get_mut(&inner_entry)
                    .unwrap()
                    .preds
                    .clear();
                builder.block_preds.insert(inner_entry, Vec::new());
            }
        }

        // Map terminal operands
        let terminal = &mut func.body.blocks.get_mut(&block_id).unwrap().terminal;
        map_terminal_operands(terminal, |place| {
            *place = builder.get_place(place, env);
        });

        // Handle successors
        let terminal_ref = &func.body.blocks.get(&block_id).unwrap().terminal;
        let successors = each_terminal_successor(terminal_ref);
        for output_id in successors {
            let output_preds_len = builder
                .block_preds
                .get(&output_id)
                .map(|p| p.len() as u32)
                .unwrap_or(0);

            let count = if builder.unsealed_preds.contains_key(&output_id) {
                builder.unsealed_preds[&output_id] - 1
            } else {
                output_preds_len - 1
            };
            builder.unsealed_preds.insert(output_id, count);

            if count == 0 && visited_blocks.contains(&output_id) {
                builder.fix_incomplete_phis(output_id, env);
            }
        }
    }

    Ok(())
}

/// Create a placeholder HirFunction for temporarily swapping an inner function
/// out of `env.functions` via `std::mem::replace`. The placeholder is never
/// read — the real function is swapped back immediately after processing.
pub fn placeholder_function() -> HirFunction {
    HirFunction {
        loc: None,
        id: None,
        name_hint: None,
        fn_type: ReactFunctionType::Other,
        params: Vec::new(),
        return_type_annotation: None,
        returns: Place {
            identifier: IdentifierId(0),
            effect: Effect::Unknown,
            reactive: false,
            loc: None,
        },
        context: Vec::new(),
        body: HIR {
            entry: BlockId(0),
            blocks: IndexMap::new(),
        },
        instructions: Vec::new(),
        generator: false,
        is_async: false,
        directives: Vec::new(),
        aliasing_effects: None,
    }
}
