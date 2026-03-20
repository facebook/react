use std::collections::HashMap;
use react_compiler_diagnostics::{CompilerDiagnostic, CompilerDiagnosticDetail, ErrorCategory, SourceLocation};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{AliasingEffect, ArrayElement, Effect, HirFunction, Identifier, IdentifierId, IdentifierName, InstructionValue, JsxAttribute, JsxTag, ObjectPropertyOrSpread, Place, PlaceOrSpread, Terminal, Type};

pub fn validate_no_freezing_known_mutable_functions(func: &HirFunction, env: &mut Environment) {
    let ds = run(func, &env.identifiers, &env.types, &env.functions);
    for d in ds { env.record_diagnostic(d); }
}
#[derive(Debug, Clone)]
struct MI { vid: IdentifierId, vloc: Option<SourceLocation> }
fn run(func: &HirFunction, ids: &[Identifier], tys: &[Type], fns: &[HirFunction]) -> Vec<CompilerDiagnostic> {
    let mut cm: HashMap<IdentifierId, MI> = HashMap::new();
    let mut ds: Vec<CompilerDiagnostic> = Vec::new();
    for (_, block) in &func.body.blocks {
        for &iid in &block.instructions { let instr = &func.instructions[iid.0 as usize]; match &instr.value {
            InstructionValue::LoadLocal { place, .. } => { if let Some(i) = cm.get(&place.identifier) { cm.insert(instr.lvalue.identifier, i.clone()); } }
            InstructionValue::StoreLocal { lvalue, value, .. } => { if let Some(i) = cm.get(&value.identifier) { let i = i.clone(); cm.insert(instr.lvalue.identifier, i.clone()); cm.insert(lvalue.place.identifier, i); } }
            InstructionValue::FunctionExpression { lowered_func, .. } => {
                let inner = &fns[lowered_func.func.0 as usize];
                if let Some(ref aes) = inner.aliasing_effects {
                    let cids: std::collections::HashSet<IdentifierId> = inner.context.iter().map(|p| p.identifier).collect();
                    'eff: for e in aes { match e {
                        AliasingEffect::Mutate { value, .. } | AliasingEffect::MutateTransitive { value, .. } => {
                            if let Some(k) = cm.get(&value.identifier) { cm.insert(instr.lvalue.identifier, k.clone()); }
                            else if cids.contains(&value.identifier) && !is_rrlm(value.identifier, ids, tys) { cm.insert(instr.lvalue.identifier, MI { vid: value.identifier, vloc: value.loc }); break 'eff; }
                        }
                        AliasingEffect::MutateConditionally { value, .. } | AliasingEffect::MutateTransitiveConditionally { value, .. } => { if let Some(k) = cm.get(&value.identifier) { cm.insert(instr.lvalue.identifier, k.clone()); } }
                        _ => {}
                    }}
                }
            }
            _ => { for o in vops(&instr.value) { chk(o, &cm, ids, &mut ds); } }
        }}
        for o in tops(&block.terminal) { chk(o, &cm, ids, &mut ds); }
    }
    ds
}
fn chk(o: &Place, cm: &HashMap<IdentifierId, MI>, ids: &[Identifier], ds: &mut Vec<CompilerDiagnostic>) {
    if o.effect == Effect::Freeze { if let Some(i) = cm.get(&o.identifier) {
        let id = &ids[i.vid.0 as usize]; let v = match &id.name { Some(IdentifierName::Named(n)) => format!("`{}`", n), _ => "a local variable".to_string() };
        ds.push(CompilerDiagnostic::new(ErrorCategory::Immutability, "Cannot modify local variables after render completes",
            Some(format!("This argument is a function which may reassign or mutate {} after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead", v)))
            .with_detail(CompilerDiagnosticDetail::Error { loc: o.loc, message: Some(format!("This function may (indirectly) reassign or modify {} after render", v)) })
            .with_detail(CompilerDiagnosticDetail::Error { loc: i.vloc, message: Some(format!("This modifies {}", v)) }));
    }}
}
fn is_rrlm(id: IdentifierId, ids: &[Identifier], tys: &[Type]) -> bool { let i = &ids[id.0 as usize]; react_compiler_hir::is_ref_or_ref_like_mutable_type(&tys[i.type_.0 as usize]) }
fn vops(v: &InstructionValue) -> Vec<&Place> { match v {
    InstructionValue::CallExpression { callee, args, .. } => { let mut o = vec![callee]; for a in args { match a { PlaceOrSpread::Place(p) => o.push(p), PlaceOrSpread::Spread(s) => o.push(&s.place) } } o }
    InstructionValue::MethodCall { receiver, property, args, .. } => { let mut o = vec![receiver, property]; for a in args { match a { PlaceOrSpread::Place(p) => o.push(p), PlaceOrSpread::Spread(s) => o.push(&s.place) } } o }
    InstructionValue::BinaryExpression { left, right, .. } => vec![left, right],
    InstructionValue::UnaryExpression { value: v, .. } => vec![v],
    InstructionValue::PropertyLoad { object, .. } => vec![object],
    InstructionValue::ComputedLoad { object, property, .. } => vec![object, property],
    InstructionValue::PropertyStore { object, value: v, .. } => vec![object, v],
    InstructionValue::ComputedStore { object, property, value: v, .. } => vec![object, property, v],
    InstructionValue::PropertyDelete { object, .. } => vec![object],
    InstructionValue::ComputedDelete { object, property, .. } => vec![object, property],
    InstructionValue::TypeCastExpression { value: v, .. } => vec![v],
    InstructionValue::Destructure { value: v, .. } => vec![v],
    InstructionValue::NewExpression { callee, args, .. } => { let mut o = vec![callee]; for a in args { match a { PlaceOrSpread::Place(p) => o.push(p), PlaceOrSpread::Spread(s) => o.push(&s.place) } } o }
    InstructionValue::ObjectExpression { properties, .. } => { let mut o = Vec::new(); for p in properties { match p { ObjectPropertyOrSpread::Property(p) => o.push(&p.place), ObjectPropertyOrSpread::Spread(p) => o.push(&p.place) } } o }
    InstructionValue::ArrayExpression { elements, .. } => { let mut o = Vec::new(); for e in elements { match e { ArrayElement::Place(p) => o.push(p), ArrayElement::Spread(s) => o.push(&s.place), ArrayElement::Hole => {} } } o }
    InstructionValue::JsxExpression { tag, props, children, .. } => { let mut o = Vec::new(); if let JsxTag::Place(p) = tag { o.push(p); } for p in props { match p { JsxAttribute::Attribute { place, .. } => o.push(place), JsxAttribute::SpreadAttribute { argument } => o.push(argument) } } if let Some(ch) = children { for c in ch { o.push(c); } } o }
    InstructionValue::JsxFragment { children, .. } => children.iter().collect(),
    InstructionValue::TemplateLiteral { subexprs, .. } => subexprs.iter().collect(),
    InstructionValue::TaggedTemplateExpression { tag, .. } => vec![tag],
    _ => Vec::new(),
}}
fn tops(t: &Terminal) -> Vec<&Place> { match t { Terminal::Return { value, .. } | Terminal::Throw { value, .. } => vec![value], Terminal::If { test, .. } | Terminal::Branch { test, .. } => vec![test], Terminal::Switch { test, .. } => vec![test], _ => Vec::new() } }
