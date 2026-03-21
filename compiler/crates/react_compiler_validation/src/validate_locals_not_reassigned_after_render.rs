use std::collections::{HashMap, HashSet};
use react_compiler_diagnostics::{CompilerDiagnostic, CompilerDiagnosticDetail, ErrorCategory};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{Effect, HirFunction, Identifier, IdentifierId, IdentifierName, InstructionValue, Place, PlaceOrSpread, Terminal, Type};

pub fn validate_locals_not_reassigned_after_render(func: &HirFunction, env: &mut Environment) {
    let mut ctx: HashSet<IdentifierId> = HashSet::new();
    let mut errs: Vec<CompilerDiagnostic> = Vec::new();
    let r = check(func, &env.identifiers, &env.types, &env.functions, &*env, &mut ctx, false, false, &mut errs);
    for d in errs { env.record_diagnostic(d); }
    if let Some(r) = r {
        let v = vname(&r, &env.identifiers);
        env.record_diagnostic(CompilerDiagnostic::new(ErrorCategory::Immutability, "Cannot reassign variable after render completes",
            Some(format!("Reassigning {} after render has completed can cause inconsistent behavior on subsequent renders. Consider using state instead", v)))
            .with_detail(CompilerDiagnosticDetail::Error { loc: r.loc, message: Some(format!("Cannot reassign {} after render completes", v)) }));
    }
}
fn vname(p: &Place, ids: &[Identifier]) -> String { let i = &ids[p.identifier.0 as usize]; match &i.name { Some(IdentifierName::Named(n)) => format!("`{}`", n), _ => "variable".to_string() } }
fn get_no_alias(env: &Environment, id: IdentifierId, ids: &[Identifier], tys: &[Type]) -> bool {
    let ty = &tys[ids[id.0 as usize].type_.0 as usize];
    env.get_function_signature(ty).map_or(false, |sig| sig.no_alias)
}
fn check(func: &HirFunction, ids: &[Identifier], tys: &[Type], fns: &[HirFunction], env: &Environment, ctx: &mut HashSet<IdentifierId>, is_fe: bool, is_async: bool, errs: &mut Vec<CompilerDiagnostic>) -> Option<Place> {
    let mut rf: HashMap<IdentifierId, Place> = HashMap::new();
    for (_, block) in &func.body.blocks {
        for &iid in &block.instructions { let instr = &func.instructions[iid.0 as usize]; match &instr.value {
            InstructionValue::FunctionExpression { lowered_func, .. } | InstructionValue::ObjectMethod { lowered_func, .. } => {
                let inner = &fns[lowered_func.func.0 as usize]; let ia = is_async || inner.is_async;
                let mut re = check(inner, ids, tys, fns, env, ctx, true, ia, errs);
                if re.is_none() { for c in &inner.context { if let Some(r) = rf.get(&c.identifier) { re = Some(r.clone()); break; } } }
                if let Some(ref r) = re { if ia { let v = vname(r, ids);
                    errs.push(CompilerDiagnostic::new(ErrorCategory::Immutability, "Cannot reassign variable in async function", Some("Reassigning a variable in an async function can cause inconsistent behavior on subsequent renders. Consider using state instead".to_string()))
                        .with_detail(CompilerDiagnosticDetail::Error { loc: r.loc, message: Some(format!("Cannot reassign {}", v)) }));
                } else { rf.insert(instr.lvalue.identifier, r.clone()); } }
            }
            InstructionValue::StoreLocal { lvalue, value, .. } => { if let Some(r) = rf.get(&value.identifier) { let r = r.clone(); rf.insert(lvalue.place.identifier, r.clone()); rf.insert(instr.lvalue.identifier, r); } }
            InstructionValue::LoadLocal { place, .. } | InstructionValue::LoadContext { place, .. } => { if let Some(r) = rf.get(&place.identifier) { rf.insert(instr.lvalue.identifier, r.clone()); } }
            InstructionValue::DeclareContext { lvalue, .. } => { if !is_fe { ctx.insert(lvalue.place.identifier); } }
            InstructionValue::StoreContext { lvalue, value, .. } => {
                if is_fe && ctx.contains(&lvalue.place.identifier) { return Some(lvalue.place.clone()); }
                if !is_fe { ctx.insert(lvalue.place.identifier); }
                if let Some(r) = rf.get(&value.identifier) { let r = r.clone(); rf.insert(lvalue.place.identifier, r.clone()); rf.insert(instr.lvalue.identifier, r); }
            }
            _ => {
                // For calls with noAlias signatures, only check the callee (not args)
                // to avoid false positives from callbacks that reassign context variables.
                let operands: Vec<&Place> = match &instr.value {
                    InstructionValue::CallExpression { callee, .. } => {
                        if get_no_alias(env, callee.identifier, ids, tys) {
                            vec![callee]
                        } else {
                            ops(&instr.value)
                        }
                    }
                    InstructionValue::MethodCall { receiver, property, .. } => {
                        if get_no_alias(env, property.identifier, ids, tys) {
                            vec![receiver, property]
                        } else {
                            ops(&instr.value)
                        }
                    }
                    InstructionValue::TaggedTemplateExpression { tag, .. } => {
                        if get_no_alias(env, tag.identifier, ids, tys) {
                            vec![tag]
                        } else {
                            ops(&instr.value)
                        }
                    }
                    _ => ops(&instr.value),
                };
                for o in operands { if let Some(r) = rf.get(&o.identifier) { if o.effect == Effect::Freeze { return Some(r.clone()); } rf.insert(instr.lvalue.identifier, r.clone()); } }
            }
        }}
        for o in tops(&block.terminal) { if let Some(r) = rf.get(&o.identifier) { return Some(r.clone()); } }
    }
    None
}
fn ops(v: &InstructionValue) -> Vec<&Place> { match v {
    InstructionValue::CallExpression { callee, args, .. } => { let mut o = vec![callee]; for a in args { match a { PlaceOrSpread::Place(p) => o.push(p), PlaceOrSpread::Spread(s) => o.push(&s.place) } } o }
    InstructionValue::MethodCall { receiver, property, args, .. } => { let mut o = vec![receiver, property]; for a in args { match a { PlaceOrSpread::Place(p) => o.push(p), PlaceOrSpread::Spread(s) => o.push(&s.place) } } o }
    InstructionValue::TaggedTemplateExpression { tag, .. } => vec![tag],
    InstructionValue::BinaryExpression { left, right, .. } => vec![left, right],
    InstructionValue::UnaryExpression { value: v, .. } => vec![v],
    InstructionValue::PropertyLoad { object, .. } => vec![object],
    InstructionValue::ComputedLoad { object, property, .. } => vec![object, property],
    InstructionValue::PropertyStore { object, value: v, .. } => vec![object, v],
    InstructionValue::ComputedStore { object, property, value: v, .. } => vec![object, property, v],
    InstructionValue::PropertyDelete { object, .. } => vec![object],
    InstructionValue::ComputedDelete { object, property, .. } => vec![object, property],
    InstructionValue::TypeCastExpression { value: v, .. } => vec![v],
    InstructionValue::NewExpression { callee, args, .. } => { let mut o = vec![callee]; for a in args { match a { PlaceOrSpread::Place(p) => o.push(p), PlaceOrSpread::Spread(s) => o.push(&s.place) } } o }
    InstructionValue::Destructure { value: v, .. } => vec![v],
    InstructionValue::ObjectExpression { properties, .. } => { let mut o = Vec::new(); for p in properties { match p { react_compiler_hir::ObjectPropertyOrSpread::Property(p) => o.push(&p.place), react_compiler_hir::ObjectPropertyOrSpread::Spread(p) => o.push(&p.place) } } o }
    InstructionValue::ArrayExpression { elements, .. } => { let mut o = Vec::new(); for e in elements { match e { react_compiler_hir::ArrayElement::Place(p) => o.push(p), react_compiler_hir::ArrayElement::Spread(s) => o.push(&s.place), react_compiler_hir::ArrayElement::Hole => {} } } o }
    InstructionValue::JsxExpression { tag, props, children, .. } => { let mut o = Vec::new(); if let react_compiler_hir::JsxTag::Place(p) = tag { o.push(p); } for p in props { match p { react_compiler_hir::JsxAttribute::Attribute { place, .. } => o.push(place), react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => o.push(argument) } } if let Some(ch) = children { for c in ch { o.push(c); } } o }
    InstructionValue::JsxFragment { children, .. } => children.iter().collect(),
    InstructionValue::TemplateLiteral { subexprs, .. } => subexprs.iter().collect(),
    _ => Vec::new(),
}}
fn tops(t: &Terminal) -> Vec<&Place> { match t { Terminal::Return { value, .. } | Terminal::Throw { value, .. } => vec![value], Terminal::If { test, .. } | Terminal::Branch { test, .. } => vec![test], Terminal::Switch { test, .. } => vec![test], _ => Vec::new() } }
