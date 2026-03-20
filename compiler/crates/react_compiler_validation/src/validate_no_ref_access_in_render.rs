use std::collections::{HashMap, HashSet};
use react_compiler_diagnostics::{CompilerDiagnostic, CompilerDiagnosticDetail, ErrorCategory, SourceLocation};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{AliasingEffect, ArrayElement, BlockId, Effect, HirFunction, Identifier, IdentifierId, InstructionValue, JsxAttribute, JsxTag, ObjectPropertyOrSpread, Place, PlaceOrSpread, PrimitiveValue, PropertyLiteral, Terminal, Type, UnaryOperator};
const ED: &str = "React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef)";
type RI = u32;
static RC: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);
fn nri() -> RI { RC.fetch_add(1, std::sync::atomic::Ordering::Relaxed) }
#[derive(Debug, Clone, PartialEq)] enum Ty { N, Nl, G(RI), R(RI), RV(Option<SourceLocation>, Option<RI>), S(Option<Box<RT>>, Option<FT>) }
#[derive(Debug, Clone, PartialEq)] enum RT { R(RI), RV(Option<SourceLocation>, Option<RI>), S(Option<Box<RT>>, Option<FT>) }
#[derive(Debug, Clone, PartialEq)] struct FT { rr: bool, rt: Box<Ty> }
impl Ty {
    fn tr(&self) -> Option<RT> { match self { Ty::R(i) => Some(RT::R(*i)), Ty::RV(l,i) => Some(RT::RV(*l,*i)), Ty::S(v,f) => Some(RT::S(v.clone(),f.clone())), _ => None } }
    fn fr(r: &RT) -> Self { match r { RT::R(i) => Ty::R(*i), RT::RV(l,i) => Ty::RV(*l,*i), RT::S(v,f) => Ty::S(v.clone(),f.clone()) } }
}
fn jr(a: &RT, b: &RT) -> RT { match (a,b) {
    (RT::RV(_,ai), RT::RV(_,bi)) => if ai==bi { a.clone() } else { RT::RV(None,None) },
    (RT::RV(..),_) => a.clone(), (_,RT::RV(..)) => b.clone(),
    (RT::R(ai), RT::R(bi)) => if ai==bi { a.clone() } else { RT::R(nri()) },
    (RT::R(..),_) | (_,RT::R(..)) => RT::R(nri()),
    (RT::S(av,af), RT::S(bv,bf)) => { let f = match (af,bf) { (None,o)|(o,None) => o.clone(), (Some(a),Some(b)) => Some(FT{rr:a.rr||b.rr,rt:Box::new(j(&a.rt,&b.rt))}) }; let v = match (av,bv) { (None,o)|(o,None) => o.clone(), (Some(a),Some(b)) => Some(Box::new(jr(a,b))) }; RT::S(v,f) }
}}
fn j(a: &Ty, b: &Ty) -> Ty { match (a,b) {
    (Ty::N,o)|(o,Ty::N) => o.clone(), (Ty::G(ai),Ty::G(bi)) => if ai==bi { a.clone() } else { Ty::N },
    (Ty::G(..),Ty::Nl)|(Ty::Nl,Ty::G(..)) => Ty::N, (Ty::G(..),o)|(o,Ty::G(..)) => o.clone(),
    (Ty::Nl,o)|(o,Ty::Nl) => o.clone(),
    _ => match (a.tr(),b.tr()) { (Some(ar),Some(br)) => Ty::fr(&jr(&ar,&br)), (Some(r),None)|(None,Some(r)) => Ty::fr(&r), _ => Ty::N }
}}
fn jm(ts: &[Ty]) -> Ty { ts.iter().fold(Ty::N, |a,t| j(&a,t)) }
struct E { ch: bool, d: HashMap<IdentifierId, Ty>, t: HashMap<IdentifierId, Place> }
impl E {
    fn new() -> Self { Self{ch:false,d:HashMap::new(),t:HashMap::new()} }
    fn def(&mut self, k: IdentifierId, v: Place) { self.t.insert(k,v); }
    fn rst(&mut self) { self.ch=false; } fn chg(&self) -> bool { self.ch }
    fn g(&self, k: IdentifierId) -> Option<&Ty> { let k=self.t.get(&k).map(|p|p.identifier).unwrap_or(k); self.d.get(&k) }
    fn s(&mut self, k: IdentifierId, v: Ty) { let k=self.t.get(&k).map(|p|p.identifier).unwrap_or(k); let c=self.d.get(&k); let w=match c{Some(c)=>j(&v,c),None=>v}; if c.is_none()&&w==Ty::N{}else if c.map_or(true,|c|c!=&w){self.ch=true;} self.d.insert(k,w); }
}
fn rt(id: IdentifierId, ids: &[Identifier], ts: &[Type]) -> Ty { let i=&ids[id.0 as usize]; let t=&ts[i.type_.0 as usize]; if react_compiler_hir::is_ref_value_type(t){Ty::RV(None,None)} else if react_compiler_hir::is_use_ref_type(t){Ty::R(nri())} else {Ty::N} }
fn isr(id: IdentifierId, ids: &[Identifier], ts: &[Type]) -> bool { let i=&ids[id.0 as usize]; react_compiler_hir::is_use_ref_type(&ts[i.type_.0 as usize]) }
fn isrv(id: IdentifierId, ids: &[Identifier], ts: &[Type]) -> bool { let i=&ids[id.0 as usize]; react_compiler_hir::is_ref_value_type(&ts[i.type_.0 as usize]) }
fn ds(t: &Ty) -> Ty { match t { Ty::S(Some(i),_) => ds(&Ty::fr(i)), o => o.clone() } }
fn ed(es: &mut Vec<CompilerDiagnostic>, p: &Place, e: &E) { if let Some(t)=e.g(p.identifier){let t=ds(t);if let Ty::RV(l,_)=&t{es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:l.or(p.loc),message:Some("Cannot access ref value during render".to_string())}));}}}
fn ev(es: &mut Vec<CompilerDiagnostic>, e: &E, p: &Place) { if let Some(t)=e.g(p.identifier){let t=ds(t);match&t{Ty::RV(l,_)=>{es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:l.or(p.loc),message:Some("Cannot access ref value during render".to_string())}));}Ty::S(_,Some(f)) if f.rr=>{es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:p.loc,message:Some("Cannot access ref value during render".to_string())}));}_ =>{}}}}
fn ep(es: &mut Vec<CompilerDiagnostic>, e: &E, p: &Place, l: Option<SourceLocation>) { if let Some(t)=e.g(p.identifier){let t=ds(t);match&t{Ty::R(..)|Ty::RV(..)=>{let el=if let Ty::RV(rl,_)=&t{rl.or(l)}else{l};es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:el,message:Some("Passing a ref to a function may read its value during render".to_string())}));}Ty::S(_,Some(f)) if f.rr=>{es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:l,message:Some("Passing a ref to a function may read its value during render".to_string())}));}_ =>{}}}}
fn eu(es: &mut Vec<CompilerDiagnostic>, e: &E, p: &Place, l: Option<SourceLocation>) { if let Some(t)=e.g(p.identifier){let t=ds(t);match&t{Ty::R(..)|Ty::RV(..)=>{let el=if let Ty::RV(rl,_)=&t{rl.or(l)}else{l};es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:el,message:Some("Cannot update ref during render".to_string())}));}_ =>{}}}}
fn gc(es: &mut Vec<CompilerDiagnostic>, p: &Place, e: &E) { if matches!(e.g(p.identifier),Some(Ty::G(..))){es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:p.loc,message:Some("Cannot access ref value during render".to_string())}));}}
pub fn validate_no_ref_access_in_render(func: &HirFunction, env: &mut Environment) { let mut re=E::new(); ct(func,&mut re,&env.identifiers,&env.types); let mut es:Vec<CompilerDiagnostic>=Vec::new(); run(func,&env.identifiers,&env.types,&env.functions,&mut re,&mut es); for d in es{env.record_diagnostic(d);} }
fn ct(func: &HirFunction, e: &mut E, ids: &[Identifier], ts: &[Type]) { for(_,block)in&func.body.blocks{for&iid in&block.instructions{let instr=&func.instructions[iid.0 as usize];match&instr.value{InstructionValue::LoadLocal{place,..}=>{let t=e.t.get(&place.identifier).cloned().unwrap_or_else(||place.clone());e.def(instr.lvalue.identifier,t);}InstructionValue::StoreLocal{lvalue,value,..}=>{let t=e.t.get(&value.identifier).cloned().unwrap_or_else(||value.clone());e.def(instr.lvalue.identifier,t.clone());e.def(lvalue.place.identifier,t);}InstructionValue::PropertyLoad{object,property,..}=>{if isr(object.identifier,ids,ts)&&*property==PropertyLiteral::String("current".to_string()){continue;}let t=e.t.get(&object.identifier).cloned().unwrap_or_else(||object.clone());e.def(instr.lvalue.identifier,t);}_ =>{}}}} }
fn run(func: &HirFunction, ids: &[Identifier], ts: &[Type], fns: &[HirFunction], re: &mut E, es: &mut Vec<CompilerDiagnostic>) -> Ty {
    let mut rvs: Vec<Ty>=Vec::new();
    for p in&func.params{let pl=match p{react_compiler_hir::ParamPattern::Place(p)=>p,react_compiler_hir::ParamPattern::Spread(s)=>&s.place};re.s(pl.identifier,rt(pl.identifier,ids,ts));}
    let mut jc:HashSet<IdentifierId>=HashSet::new();
    for(_,block)in&func.body.blocks{for&iid in&block.instructions{let instr=&func.instructions[iid.0 as usize];match&instr.value{InstructionValue::JsxExpression{children:Some(ch),..}=>{for c in ch{jc.insert(c.identifier);}}InstructionValue::JsxFragment{children,..}=>{for c in children{jc.insert(c.identifier);}}_ =>{}}}}
    for it in 0..10{if it>0&&!re.chg(){break;}re.rst();rvs.clear();let mut safe:Vec<(BlockId,RI)>=Vec::new();
    for(_,block)in&func.body.blocks{safe.retain(|(b,_)|*b!=block.id);
    for phi in&block.phis{let pt:Vec<Ty>=phi.operands.values().map(|o|re.g(o.identifier).cloned().unwrap_or(Ty::N)).collect();re.s(phi.place.identifier,jm(&pt));}
    for&iid in&block.instructions{let instr=&func.instructions[iid.0 as usize];match&instr.value{
        InstructionValue::JsxExpression{..}|InstructionValue::JsxFragment{..}=>{for o in vo(&instr.value){ed(es,o,re);}}
        InstructionValue::ComputedLoad{object,property,..}=>{ed(es,property,re);let ot=re.g(object.identifier).cloned();let lt=match&ot{Some(Ty::S(Some(v),_))=>Some(Ty::fr(v)),Some(Ty::R(rid))=>Some(Ty::RV(instr.loc,Some(*rid))),_ =>None};re.s(instr.lvalue.identifier,lt.unwrap_or_else(||rt(instr.lvalue.identifier,ids,ts)));}
        InstructionValue::PropertyLoad{object,..}=>{let ot=re.g(object.identifier).cloned();let lt=match&ot{Some(Ty::S(Some(v),_))=>Some(Ty::fr(v)),Some(Ty::R(rid))=>Some(Ty::RV(instr.loc,Some(*rid))),_ =>None};re.s(instr.lvalue.identifier,lt.unwrap_or_else(||rt(instr.lvalue.identifier,ids,ts)));}
        InstructionValue::TypeCastExpression{value:v,..}=>{re.s(instr.lvalue.identifier,re.g(v.identifier).cloned().unwrap_or_else(||rt(instr.lvalue.identifier,ids,ts)));}
        InstructionValue::LoadContext{place,..}|InstructionValue::LoadLocal{place,..}=>{re.s(instr.lvalue.identifier,re.g(place.identifier).cloned().unwrap_or_else(||rt(instr.lvalue.identifier,ids,ts)));}
        InstructionValue::StoreContext{lvalue,value,..}|InstructionValue::StoreLocal{lvalue,value,..}=>{re.s(lvalue.place.identifier,re.g(value.identifier).cloned().unwrap_or_else(||rt(lvalue.place.identifier,ids,ts)));re.s(instr.lvalue.identifier,re.g(value.identifier).cloned().unwrap_or_else(||rt(instr.lvalue.identifier,ids,ts)));}
        InstructionValue::Destructure{value:v,lvalue,..}=>{let ot=re.g(v.identifier).cloned();let lt=match&ot{Some(Ty::S(Some(vv),_))=>Some(Ty::fr(vv)),_ =>None};re.s(instr.lvalue.identifier,lt.clone().unwrap_or_else(||rt(instr.lvalue.identifier,ids,ts)));for pp in po(&lvalue.pattern){re.s(pp.identifier,lt.clone().unwrap_or_else(||rt(pp.identifier,ids,ts)));}}
        InstructionValue::ObjectMethod{lowered_func,..}|InstructionValue::FunctionExpression{lowered_func,..}=>{let inner=&fns[lowered_func.func.0 as usize];let mut ie:Vec<CompilerDiagnostic>=Vec::new();let result=run(inner,ids,ts,fns,re,&mut ie);let(rty,rr)=if ie.is_empty(){(result,false)}else{(Ty::N,true)};re.s(instr.lvalue.identifier,Ty::S(None,Some(FT{rr,rt:Box::new(rty)})));}
        InstructionValue::MethodCall{property,..}|InstructionValue::CallExpression{callee:property,..}=>{let callee=property;let mut rty=Ty::N;let ft=re.g(callee.identifier).cloned();let mut de=false;
            if let Some(Ty::S(_,Some(f)))=&ft{rty=*f.rt.clone();if f.rr{de=true;es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:callee.loc,message:Some("This function accesses a ref value".to_string())}));}}
            if!de{let irl=isr(instr.lvalue.identifier,ids,ts);let ci=&ids[callee.identifier.0 as usize];let cty=&ts[ci.type_.0 as usize];
                let hk=if let Type::Function{shape_id:Some(sid),..}=cty{if sid.contains("UseState")||sid=="BuiltInUseState"{Some("useState")}else if sid.contains("UseReducer")||sid=="BuiltInUseReducer"{Some("useReducer")}else if(sid.contains("Use")||sid.starts_with("BuiltIn"))&&sid!="BuiltInSetState"&&sid!="BuiltInSetActionState"&&sid!="BuiltInDispatch"&&sid!="BuiltInStartTransition"&&sid!="BuiltInSetOptimistic"{Some("other")}else{None}}else{None};
                if irl||(hk.is_some()&&hk!=Some("useState")&&hk!=Some("useReducer")){for o in vo(&instr.value){ed(es,o,re);}}
                else if jc.contains(&instr.lvalue.identifier){for o in vo(&instr.value){ev(es,re,o);}}
                else if hk.is_none(){if let Some(ref effs)=instr.effects{let mut vis:HashSet<String>=HashSet::new();for eff in effs{let(pl,vl)=match eff{AliasingEffect::Freeze{value,..}=>(Some(value),"d"),AliasingEffect::Mutate{value,..}|AliasingEffect::MutateTransitive{value,..}|AliasingEffect::MutateConditionally{value,..}|AliasingEffect::MutateTransitiveConditionally{value,..}=>(Some(value),"p"),AliasingEffect::Render{place,..}=>(Some(place),"p"),AliasingEffect::Capture{from,..}|AliasingEffect::Alias{from,..}|AliasingEffect::MaybeAlias{from,..}|AliasingEffect::Assign{from,..}|AliasingEffect::CreateFrom{from,..}=>(Some(from),"p"),AliasingEffect::ImmutableCapture{from,..}=>{let fz=effs.iter().any(|e|matches!(e,AliasingEffect::Freeze{value,..}if value.identifier==from.identifier));(Some(from),if fz{"d"}else{"p"})}_ =>(None,"n"),};if let Some(pl)=pl{if vl!="n"{let key=format!("{}:{}",pl.identifier.0,vl);if vis.insert(key){if vl=="d"{ed(es,pl,re);}else{ep(es,re,pl,pl.loc);}}}}}}else{for o in vo(&instr.value){ep(es,re,o,o.loc);}}}}
            re.s(instr.lvalue.identifier,rty);}
        InstructionValue::ObjectExpression{..}|InstructionValue::ArrayExpression{..}=>{let ops=vo(&instr.value);let mut tv:Vec<Ty>=Vec::new();for o in&ops{ed(es,o,re);tv.push(re.g(o.identifier).cloned().unwrap_or(Ty::N));}let v=jm(&tv);match&v{Ty::N|Ty::G(..)|Ty::Nl=>{re.s(instr.lvalue.identifier,Ty::N);}_ =>{re.s(instr.lvalue.identifier,Ty::S(v.tr().map(Box::new),None));}}}
        InstructionValue::PropertyDelete{object,..}|InstructionValue::PropertyStore{object,..}|InstructionValue::ComputedDelete{object,..}|InstructionValue::ComputedStore{object,..}=>{let target=re.g(object.identifier).cloned();let mut fs=false;if matches!(&instr.value,InstructionValue::PropertyStore{..}){if let Some(Ty::R(rid))=&target{if let Some(pos)=safe.iter().position(|(_,r)|r==rid){safe.remove(pos);fs=true;}}}if!fs{eu(es,re,object,instr.loc);}match&instr.value{InstructionValue::ComputedDelete{property,..}|InstructionValue::ComputedStore{property,..}=>{ev(es,re,property);}_ =>{}}match&instr.value{InstructionValue::ComputedStore{value:v,..}|InstructionValue::PropertyStore{value:v,..}=>{ed(es,v,re);let vt=re.g(v.identifier).cloned();if let Some(Ty::S(..))=&vt{let mut ot=vt.unwrap();if let Some(t)=&target{ot=j(&ot,t);}re.s(object.identifier,ot);}}_ =>{}}}
        InstructionValue::StartMemoize{..}|InstructionValue::FinishMemoize{..}=>{}
        InstructionValue::LoadGlobal{binding,..}=>{if binding.name()=="undefined"{re.s(instr.lvalue.identifier,Ty::Nl);}}
        InstructionValue::Primitive{value,..}=>{if matches!(value,PrimitiveValue::Null|PrimitiveValue::Undefined){re.s(instr.lvalue.identifier,Ty::Nl);}}
        InstructionValue::UnaryExpression{operator,value:v,..}=>{if*operator==UnaryOperator::Not{if let Some(Ty::RV(_,Some(rid)))=re.g(v.identifier).cloned().as_ref(){re.s(instr.lvalue.identifier,Ty::G(*rid));es.push(CompilerDiagnostic::new(ErrorCategory::Refs,"Cannot access refs during render",Some(ED.to_string())).with_detail(CompilerDiagnosticDetail::Error{loc:v.loc,message:Some("Cannot access ref value during render".to_string())}).with_detail(CompilerDiagnosticDetail::Hint{message:"To initialize a ref only once, check that the ref is null with the pattern `if (ref.current == null) { ref.current = ... }`".to_string()}));}else{ev(es,re,v);}}else{ev(es,re,v);}}
        InstructionValue::BinaryExpression{left,right,..}=>{let lt=re.g(left.identifier).cloned();let rtt=re.g(right.identifier).cloned();let mut nl=false;let mut fri:Option<RI>=None;if let Some(Ty::RV(_,Some(id)))=&lt{fri=Some(*id);}else if let Some(Ty::RV(_,Some(id)))=&rtt{fri=Some(*id);}if matches!(&lt,Some(Ty::Nl))||matches!(&rtt,Some(Ty::Nl)){nl=true;}if let Some(rid)=fri{if nl{re.s(instr.lvalue.identifier,Ty::G(rid));}else{ev(es,re,left);ev(es,re,right);}}else{ev(es,re,left);ev(es,re,right);}}
        _ =>{for o in vo(&instr.value){ev(es,re,o);}}
    }for o in vo(&instr.value){gc(es,o,re);}
    if isr(instr.lvalue.identifier,ids,ts)&&!matches!(re.g(instr.lvalue.identifier),Some(Ty::R(..))){let ex=re.g(instr.lvalue.identifier).cloned().unwrap_or(Ty::N);re.s(instr.lvalue.identifier,j(&ex,&Ty::R(nri())));}
    if isrv(instr.lvalue.identifier,ids,ts)&&!matches!(re.g(instr.lvalue.identifier),Some(Ty::RV(..))){let ex=re.g(instr.lvalue.identifier).cloned().unwrap_or(Ty::N);re.s(instr.lvalue.identifier,j(&ex,&Ty::RV(instr.loc,None)));}}
    if let Terminal::If{test,fallthrough,..}=&block.terminal{if let Some(Ty::G(rid))=re.g(test.identifier){if!safe.iter().any(|(_,r)|r==rid){safe.push((*fallthrough,*rid));}}}
    for o in to(&block.terminal){if!matches!(&block.terminal,Terminal::Return{..}){ev(es,re,o);if!matches!(&block.terminal,Terminal::If{..}){gc(es,o,re);}}else{ed(es,o,re);gc(es,o,re);if let Some(t)=re.g(o.identifier){rvs.push(t.clone());}}}
    }if!es.is_empty(){return Ty::N;}}jm(&rvs)
}
fn vo(v: &InstructionValue) -> Vec<&Place> { match v {
    InstructionValue::CallExpression{callee,args,..}=>{let mut o=vec![callee];for a in args{match a{PlaceOrSpread::Place(p)=>o.push(p),PlaceOrSpread::Spread(s)=>o.push(&s.place)}}o}
    InstructionValue::MethodCall{receiver,property,args,..}=>{let mut o=vec![receiver,property];for a in args{match a{PlaceOrSpread::Place(p)=>o.push(p),PlaceOrSpread::Spread(s)=>o.push(&s.place)}}o}
    InstructionValue::BinaryExpression{left,right,..}=>vec![left,right], InstructionValue::UnaryExpression{value:v,..}=>vec![v],
    InstructionValue::PropertyLoad{object,..}=>vec![object], InstructionValue::ComputedLoad{object,property,..}=>vec![object,property],
    InstructionValue::PropertyStore{object,value:v,..}=>vec![object,v], InstructionValue::ComputedStore{object,property,value:v,..}=>vec![object,property,v],
    InstructionValue::PropertyDelete{object,..}=>vec![object], InstructionValue::ComputedDelete{object,property,..}=>vec![object,property],
    InstructionValue::TypeCastExpression{value:v,..}=>vec![v], InstructionValue::LoadLocal{place,..}|InstructionValue::LoadContext{place,..}=>vec![place],
    InstructionValue::StoreLocal{value,..}|InstructionValue::StoreContext{value,..}=>vec![value], InstructionValue::Destructure{value:v,..}=>vec![v],
    InstructionValue::NewExpression{callee,args,..}=>{let mut o=vec![callee];for a in args{match a{PlaceOrSpread::Place(p)=>o.push(p),PlaceOrSpread::Spread(s)=>o.push(&s.place)}}o}
    InstructionValue::ObjectExpression{properties,..}=>{let mut o=Vec::new();for p in properties{match p{ObjectPropertyOrSpread::Property(p)=>o.push(&p.place),ObjectPropertyOrSpread::Spread(p)=>o.push(&p.place)}}o}
    InstructionValue::ArrayExpression{elements,..}=>{let mut o=Vec::new();for e in elements{match e{ArrayElement::Place(p)=>o.push(p),ArrayElement::Spread(s)=>o.push(&s.place),ArrayElement::Hole=>{}}}o}
    InstructionValue::JsxExpression{tag,props,children,..}=>{let mut o=Vec::new();if let JsxTag::Place(p)=tag{o.push(p);}for p in props{match p{JsxAttribute::Attribute{place,..}=>o.push(place),JsxAttribute::SpreadAttribute{argument}=>o.push(argument)}}if let Some(ch)=children{for c in ch{o.push(c);}}o}
    InstructionValue::JsxFragment{children,..}=>children.iter().collect(), InstructionValue::TemplateLiteral{subexprs,..}=>subexprs.iter().collect(),
    InstructionValue::TaggedTemplateExpression{tag,..}=>vec![tag], InstructionValue::IteratorNext{iterator,..}=>vec![iterator],
    InstructionValue::NextPropertyOf{value:v,..}=>vec![v], InstructionValue::GetIterator{collection,..}=>vec![collection], InstructionValue::Await{value:v,..}=>vec![v],
    _ =>Vec::new(),
}}
fn to(t: &Terminal) -> Vec<&Place> { match t { Terminal::Return{value,..}|Terminal::Throw{value,..}=>vec![value], Terminal::If{test,..}|Terminal::Branch{test,..}=>vec![test], Terminal::Switch{test,..}=>vec![test], _ =>Vec::new() } }
fn po(p: &react_compiler_hir::Pattern) -> Vec<&Place> { let mut r=Vec::new(); match p { react_compiler_hir::Pattern::Array(a)=>{for i in&a.items{match i{react_compiler_hir::ArrayPatternElement::Place(p)=>r.push(p),react_compiler_hir::ArrayPatternElement::Spread(s)=>r.push(&s.place),react_compiler_hir::ArrayPatternElement::Hole=>{}}}} react_compiler_hir::Pattern::Object(o)=>{for p in&o.properties{match p{ObjectPropertyOrSpread::Property(p)=>r.push(&p.place),ObjectPropertyOrSpread::Spread(s)=>r.push(&s.place)}}} } r }
