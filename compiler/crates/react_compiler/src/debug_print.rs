use react_compiler_diagnostics::{
    CompilerError, CompilerErrorOrDiagnostic, CompilerDiagnosticDetail, SourceLocation,
};
use react_compiler_hir::{
    BasicBlock, BlockId, HirFunction, Identifier, IdentifierName, Instruction,
    InstructionValue, LValue, ParamPattern, Pattern, Place, Terminal,
};
use react_compiler_hir::environment::Environment;

// =============================================================================
// Error formatting
// =============================================================================

pub fn debug_error(error: &CompilerError) -> String {
    let mut out = String::new();
    for detail in &error.details {
        match detail {
            CompilerErrorOrDiagnostic::Diagnostic(d) => {
                out.push_str("Error:\n");
                out.push_str(&format!("  category: {:?}\n", d.category));
                out.push_str(&format!("  severity: {:?}\n", d.category.severity()));
                out.push_str(&format!("  reason: {:?}\n", d.reason));
                match &d.description {
                    Some(desc) => out.push_str(&format!("  description: {:?}\n", desc)),
                    None => out.push_str("  description: null\n"),
                }
                match d.primary_location() {
                    Some(loc) => out.push_str(&format!("  loc: {}\n", format_loc(loc))),
                    None => out.push_str("  loc: null\n"),
                }
                match &d.suggestions {
                    Some(suggestions) => {
                        out.push_str("  suggestions:\n");
                        for s in suggestions {
                            out.push_str(&format!(
                                "    - op: {:?}, range: ({}, {}), description: {:?}",
                                s.op, s.range.0, s.range.1, s.description
                            ));
                            if let Some(text) = &s.text {
                                out.push_str(&format!(", text: {:?}", text));
                            }
                            out.push('\n');
                        }
                    }
                    None => out.push_str("  suggestions: []\n"),
                }
                if d.details.is_empty() {
                    out.push_str("  details: []\n");
                } else {
                    out.push_str("  details:\n");
                    for detail in &d.details {
                        match detail {
                            CompilerDiagnosticDetail::Error { loc, message } => {
                                out.push_str("    - kind: error\n");
                                match loc {
                                    Some(l) => out.push_str(&format!(
                                        "      loc: {}\n",
                                        format_loc(l)
                                    )),
                                    None => out.push_str("      loc: null\n"),
                                }
                                match message {
                                    Some(m) => out.push_str(&format!(
                                        "      message: {:?}\n",
                                        m
                                    )),
                                    None => out.push_str("      message: null\n"),
                                }
                            }
                            CompilerDiagnosticDetail::Hint { message } => {
                                out.push_str("    - kind: hint\n");
                                out.push_str(&format!("      message: {:?}\n", message));
                            }
                        }
                    }
                }
            }
            CompilerErrorOrDiagnostic::ErrorDetail(d) => {
                out.push_str("Error:\n");
                out.push_str(&format!("  category: {:?}\n", d.category));
                out.push_str(&format!("  severity: {:?}\n", d.category.severity()));
                out.push_str(&format!("  reason: {:?}\n", d.reason));
                match &d.description {
                    Some(desc) => out.push_str(&format!("  description: {:?}\n", desc)),
                    None => out.push_str("  description: null\n"),
                }
                match &d.loc {
                    Some(loc) => out.push_str(&format!("  loc: {}\n", format_loc(loc))),
                    None => out.push_str("  loc: null\n"),
                }
                match &d.suggestions {
                    Some(suggestions) => {
                        out.push_str("  suggestions:\n");
                        for s in suggestions {
                            out.push_str(&format!(
                                "    - op: {:?}, range: ({}, {}), description: {:?}",
                                s.op, s.range.0, s.range.1, s.description
                            ));
                            if let Some(text) = &s.text {
                                out.push_str(&format!(", text: {:?}", text));
                            }
                            out.push('\n');
                        }
                    }
                    None => out.push_str("  suggestions: []\n"),
                }
                out.push_str("  details: []\n");
            }
        }
    }
    out
}

fn format_loc(loc: &SourceLocation) -> String {
    format!(
        "{}:{}-{}:{}",
        loc.start.line, loc.start.column, loc.end.line, loc.end.column
    )
}

fn format_opt_loc(loc: &Option<SourceLocation>) -> String {
    match loc {
        Some(l) => format_loc(l),
        None => "null".to_string(),
    }
}

// =============================================================================
// HIR formatting
// =============================================================================

pub fn debug_hir(hir: &HirFunction, env: &Environment) -> String {
    let mut out = String::new();
    format_function(&mut out, hir, env, 0);

    // Print outlined functions from the environment's function arena
    for (idx, func) in env.functions.iter().enumerate() {
        out.push('\n');
        format_function(&mut out, func, env, idx + 1);
    }

    out
}

fn format_function(out: &mut String, func: &HirFunction, env: &Environment, index: usize) {
    out.push_str(&format!("Function #{}:\n", index));
    out.push_str(&format!(
        "  id: {}\n",
        match &func.id {
            Some(id) => format!("{:?}", id),
            None => "null".to_string(),
        }
    ));
    out.push_str(&format!(
        "  name_hint: {}\n",
        match &func.name_hint {
            Some(h) => format!("{:?}", h),
            None => "null".to_string(),
        }
    ));
    out.push_str(&format!("  fn_type: {:?}\n", func.fn_type));
    out.push_str(&format!("  generator: {}\n", func.generator));
    out.push_str(&format!("  is_async: {}\n", func.is_async));
    out.push_str(&format!("  loc: {}\n", format_opt_loc(&func.loc)));

    // params
    if func.params.is_empty() {
        out.push_str("  params: []\n");
    } else {
        out.push_str("  params:\n");
        for (i, param) in func.params.iter().enumerate() {
            match param {
                ParamPattern::Place(place) => {
                    out.push_str(&format!(
                        "    [{}] Place {}\n",
                        i,
                        format_place(place)
                    ));
                }
                ParamPattern::Spread(spread) => {
                    out.push_str(&format!(
                        "    [{}] Spread {{ place: {} }}\n",
                        i,
                        format_place(&spread.place)
                    ));
                }
            }
        }
    }

    // returns
    out.push_str(&format!("  returns: {}\n", format_place(&func.returns)));

    // context
    if func.context.is_empty() {
        out.push_str("  context: []\n");
    } else {
        out.push_str("  context:\n");
        for (i, place) in func.context.iter().enumerate() {
            out.push_str(&format!("    [{}] {}\n", i, format_place(place)));
        }
    }

    // aliasing_effects
    match &func.aliasing_effects {
        Some(effects) => out.push_str(&format!("  aliasingEffects: [{} effects]\n", effects.len())),
        None => out.push_str("  aliasingEffects: null\n"),
    }

    // directives
    if func.directives.is_empty() {
        out.push_str("  directives: []\n");
    } else {
        out.push_str("  directives:\n");
        for d in &func.directives {
            out.push_str(&format!("    - {:?}\n", d));
        }
    }

    // return_type_annotation
    match &func.return_type_annotation {
        Some(ann) => out.push_str(&format!("  returnTypeAnnotation: {:?}\n", ann)),
        None => out.push_str("  returnTypeAnnotation: null\n"),
    }

    out.push('\n');

    // Identifiers
    out.push_str("  Identifiers:\n");
    for ident in &env.identifiers {
        format_identifier(out, ident);
    }

    out.push('\n');

    // Blocks
    out.push_str("  Blocks:\n");
    for (block_id, block) in &func.body.blocks {
        format_block(out, block_id, block, &func.instructions, env);
    }
}

fn format_identifier(out: &mut String, ident: &Identifier) {
    out.push_str(&format!("    ${}: Identifier {{\n", ident.id.0));
    out.push_str(&format!("      id: {}\n", ident.id.0));
    out.push_str(&format!(
        "      declarationId: {}\n",
        ident.declaration_id.0
    ));
    out.push_str(&format!(
        "      name: {}\n",
        match &ident.name {
            Some(IdentifierName::Named(n)) => format!("Named({:?})", n),
            Some(IdentifierName::Promoted(n)) => format!("Promoted({:?})", n),
            None => "null".to_string(),
        }
    ));
    out.push_str(&format!(
        "      mutableRange: [{}:{}]\n",
        ident.mutable_range.start.0, ident.mutable_range.end.0
    ));
    out.push_str(&format!(
        "      scope: {}\n",
        match ident.scope {
            Some(s) => format!("{}", s.0),
            None => "null".to_string(),
        }
    ));
    out.push_str(&format!("      type: ${}\n", ident.type_.0));
    out.push_str(&format!("      loc: {}\n", format_opt_loc(&ident.loc)));
    out.push_str("    }\n");
}

fn format_block(
    out: &mut String,
    block_id: &BlockId,
    block: &BasicBlock,
    instructions: &[Instruction],
    _env: &Environment,
) {
    out.push_str(&format!(
        "    bb{} ({:?}):\n",
        block_id.0,
        block.kind
    ));

    // preds
    let preds: Vec<String> = block.preds.iter().map(|p| format!("bb{}", p.0)).collect();
    out.push_str(&format!("      preds: [{}]\n", preds.join(", ")));

    // phis
    if block.phis.is_empty() {
        out.push_str("      phis: []\n");
    } else {
        out.push_str("      phis:\n");
        for phi in &block.phis {
            let operands: Vec<String> = phi
                .operands
                .iter()
                .map(|(bid, place)| format!("bb{}: {}", bid.0, format_place(place)))
                .collect();
            out.push_str(&format!(
                "        Phi {{ place: {}, operands: [{}] }}\n",
                format_place(&phi.place),
                operands.join(", ")
            ));
        }
    }

    // instructions
    if block.instructions.is_empty() {
        out.push_str("      instructions: []\n");
    } else {
        out.push_str("      instructions:\n");
        for instr_id in &block.instructions {
            // Look up the instruction from the flat instruction table
            let instr = &instructions[instr_id.0 as usize];
            out.push_str(&format!(
                "        [{}] Instruction {{\n",
                instr.id.0
            ));
            out.push_str(&format!("          id: {}\n", instr.id.0));
            out.push_str(&format!(
                "          lvalue: {}\n",
                format_place(&instr.lvalue)
            ));
            out.push_str(&format!(
                "          value: {}\n",
                format_instruction_value(&instr.value)
            ));
            match &instr.effects {
                Some(effects) => out.push_str(&format!(
                    "          effects: [{} effects]\n",
                    effects.len()
                )),
                None => out.push_str("          effects: null\n"),
            }
            out.push_str(&format!(
                "          loc: {}\n",
                format_opt_loc(&instr.loc)
            ));
            out.push_str("        }\n");
        }
    }

    // terminal
    out.push_str(&format!(
        "      terminal: {}\n",
        format_terminal(&block.terminal)
    ));
}

fn format_place(place: &Place) -> String {
    format!(
        "Place {{ identifier: ${}, effect: {:?}, reactive: {}, loc: {} }}",
        place.identifier.0,
        place.effect,
        place.reactive,
        format_opt_loc(&place.loc)
    )
}

fn format_lvalue(lv: &LValue) -> String {
    format!(
        "LValue {{ place: {}, kind: {:?} }}",
        format_place(&lv.place),
        lv.kind
    )
}

fn format_place_or_spread(pos: &react_compiler_hir::PlaceOrSpread) -> String {
    match pos {
        react_compiler_hir::PlaceOrSpread::Place(p) => format_place(p),
        react_compiler_hir::PlaceOrSpread::Spread(s) => {
            format!("Spread({})", format_place(&s.place))
        }
    }
}

fn format_args(args: &[react_compiler_hir::PlaceOrSpread]) -> String {
    let items: Vec<String> = args.iter().map(format_place_or_spread).collect();
    format!("[{}]", items.join(", "))
}

fn format_instruction_value(value: &InstructionValue) -> String {
    match value {
        InstructionValue::LoadLocal { place, loc } => {
            format!("LoadLocal {{ place: {}, loc: {} }}", format_place(place), format_opt_loc(loc))
        }
        InstructionValue::LoadContext { place, loc } => {
            format!("LoadContext {{ place: {}, loc: {} }}", format_place(place), format_opt_loc(loc))
        }
        InstructionValue::DeclareLocal { lvalue, type_annotation, loc } => {
            format!(
                "DeclareLocal {{ lvalue: {}, typeAnnotation: {}, loc: {} }}",
                format_lvalue(lvalue),
                match type_annotation {
                    Some(t) => format!("{:?}", t),
                    None => "null".to_string(),
                },
                format_opt_loc(loc)
            )
        }
        InstructionValue::DeclareContext { lvalue, loc } => {
            format!("DeclareContext {{ lvalue: {}, loc: {} }}", format_lvalue(lvalue), format_opt_loc(loc))
        }
        InstructionValue::StoreLocal { lvalue, value, type_annotation, loc } => {
            format!(
                "StoreLocal {{ lvalue: {}, value: {}, typeAnnotation: {}, loc: {} }}",
                format_lvalue(lvalue),
                format_place(value),
                match type_annotation {
                    Some(t) => format!("{:?}", t),
                    None => "null".to_string(),
                },
                format_opt_loc(loc)
            )
        }
        InstructionValue::StoreContext { lvalue, value, loc } => {
            format!(
                "StoreContext {{ lvalue: {}, value: {}, loc: {} }}",
                format_lvalue(lvalue),
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::Destructure { lvalue, value, loc } => {
            format!(
                "Destructure {{ lvalue: LValuePattern {{ pattern: {:?}, kind: {:?} }}, value: {}, loc: {} }}",
                format_pattern(&lvalue.pattern),
                lvalue.kind,
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::Primitive { value: prim, loc } => {
            format!(
                "Primitive {{ value: {}, loc: {} }}",
                format_primitive(prim),
                format_opt_loc(loc)
            )
        }
        InstructionValue::JSXText { value, loc } => {
            format!("JSXText {{ value: {:?}, loc: {} }}", value, format_opt_loc(loc))
        }
        InstructionValue::BinaryExpression { operator, left, right, loc } => {
            format!(
                "BinaryExpression {{ operator: {:?}, left: {}, right: {}, loc: {} }}",
                operator,
                format_place(left),
                format_place(right),
                format_opt_loc(loc)
            )
        }
        InstructionValue::NewExpression { callee, args, loc } => {
            format!(
                "NewExpression {{ callee: {}, args: {}, loc: {} }}",
                format_place(callee),
                format_args(args),
                format_opt_loc(loc)
            )
        }
        InstructionValue::CallExpression { callee, args, loc } => {
            format!(
                "CallExpression {{ callee: {}, args: {}, loc: {} }}",
                format_place(callee),
                format_args(args),
                format_opt_loc(loc)
            )
        }
        InstructionValue::MethodCall { receiver, property, args, loc } => {
            format!(
                "MethodCall {{ receiver: {}, property: {}, args: {}, loc: {} }}",
                format_place(receiver),
                format_place(property),
                format_args(args),
                format_opt_loc(loc)
            )
        }
        InstructionValue::UnaryExpression { operator, value, loc } => {
            format!(
                "UnaryExpression {{ operator: {:?}, value: {}, loc: {} }}",
                operator,
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::TypeCastExpression { value, type_, loc } => {
            format!(
                "TypeCastExpression {{ value: {}, type: {:?}, loc: {} }}",
                format_place(value),
                type_,
                format_opt_loc(loc)
            )
        }
        InstructionValue::JsxExpression { tag, props, children, loc, opening_loc, closing_loc } => {
            let tag_str = match tag {
                react_compiler_hir::JsxTag::Place(p) => format!("Place({})", format_place(p)),
                react_compiler_hir::JsxTag::Builtin(b) => format!("Builtin({:?})", b.name),
            };
            let props_str: Vec<String> = props
                .iter()
                .map(|p| match p {
                    react_compiler_hir::JsxAttribute::Attribute { name, place } => {
                        format!("Attribute {{ name: {:?}, place: {} }}", name, format_place(place))
                    }
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                        format!("SpreadAttribute {{ argument: {} }}", format_place(argument))
                    }
                })
                .collect();
            let children_str = match children {
                Some(c) => {
                    let items: Vec<String> = c.iter().map(format_place).collect();
                    format!("[{}]", items.join(", "))
                }
                None => "null".to_string(),
            };
            format!(
                "JsxExpression {{ tag: {}, props: [{}], children: {}, loc: {}, openingLoc: {}, closingLoc: {} }}",
                tag_str,
                props_str.join(", "),
                children_str,
                format_opt_loc(loc),
                format_opt_loc(opening_loc),
                format_opt_loc(closing_loc)
            )
        }
        InstructionValue::ObjectExpression { properties, loc } => {
            let props_str: Vec<String> = properties
                .iter()
                .map(|p| match p {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(prop) => {
                        format!(
                            "Property {{ key: {}, type: {:?}, place: {} }}",
                            format_object_property_key(&prop.key),
                            prop.property_type,
                            format_place(&prop.place)
                        )
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        format!("Spread({})", format_place(&s.place))
                    }
                })
                .collect();
            format!(
                "ObjectExpression {{ properties: [{}], loc: {} }}",
                props_str.join(", "),
                format_opt_loc(loc)
            )
        }
        InstructionValue::ObjectMethod { loc, lowered_func } => {
            format!(
                "ObjectMethod {{ func: fn#{}, loc: {} }}",
                lowered_func.func.0,
                format_opt_loc(loc)
            )
        }
        InstructionValue::ArrayExpression { elements, loc } => {
            let elems: Vec<String> = elements
                .iter()
                .map(|e| match e {
                    react_compiler_hir::ArrayElement::Place(p) => format_place(p),
                    react_compiler_hir::ArrayElement::Spread(s) => {
                        format!("Spread({})", format_place(&s.place))
                    }
                    react_compiler_hir::ArrayElement::Hole => "Hole".to_string(),
                })
                .collect();
            format!(
                "ArrayExpression {{ elements: [{}], loc: {} }}",
                elems.join(", "),
                format_opt_loc(loc)
            )
        }
        InstructionValue::JsxFragment { children, loc } => {
            let items: Vec<String> = children.iter().map(format_place).collect();
            format!(
                "JsxFragment {{ children: [{}], loc: {} }}",
                items.join(", "),
                format_opt_loc(loc)
            )
        }
        InstructionValue::RegExpLiteral { pattern, flags, loc } => {
            format!(
                "RegExpLiteral {{ pattern: {:?}, flags: {:?}, loc: {} }}",
                pattern,
                flags,
                format_opt_loc(loc)
            )
        }
        InstructionValue::MetaProperty { meta, property, loc } => {
            format!(
                "MetaProperty {{ meta: {:?}, property: {:?}, loc: {} }}",
                meta,
                property,
                format_opt_loc(loc)
            )
        }
        InstructionValue::PropertyStore { object, property, value, loc } => {
            format!(
                "PropertyStore {{ object: {}, property: {}, value: {}, loc: {} }}",
                format_place(object),
                format_property_literal(property),
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::PropertyLoad { object, property, loc } => {
            format!(
                "PropertyLoad {{ object: {}, property: {}, loc: {} }}",
                format_place(object),
                format_property_literal(property),
                format_opt_loc(loc)
            )
        }
        InstructionValue::PropertyDelete { object, property, loc } => {
            format!(
                "PropertyDelete {{ object: {}, property: {}, loc: {} }}",
                format_place(object),
                format_property_literal(property),
                format_opt_loc(loc)
            )
        }
        InstructionValue::ComputedStore { object, property, value, loc } => {
            format!(
                "ComputedStore {{ object: {}, property: {}, value: {}, loc: {} }}",
                format_place(object),
                format_place(property),
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::ComputedLoad { object, property, loc } => {
            format!(
                "ComputedLoad {{ object: {}, property: {}, loc: {} }}",
                format_place(object),
                format_place(property),
                format_opt_loc(loc)
            )
        }
        InstructionValue::ComputedDelete { object, property, loc } => {
            format!(
                "ComputedDelete {{ object: {}, property: {}, loc: {} }}",
                format_place(object),
                format_place(property),
                format_opt_loc(loc)
            )
        }
        InstructionValue::LoadGlobal { binding, loc } => {
            let binding_str = match binding {
                react_compiler_hir::NonLocalBinding::Global { name } => {
                    format!("Global {{ name: {:?} }}", name)
                }
                react_compiler_hir::NonLocalBinding::ImportDefault { name, module } => {
                    format!("ImportDefault {{ name: {:?}, module: {:?} }}", name, module)
                }
                react_compiler_hir::NonLocalBinding::ImportSpecifier { name, module, imported } => {
                    format!(
                        "ImportSpecifier {{ name: {:?}, module: {:?}, imported: {:?} }}",
                        name, module, imported
                    )
                }
                react_compiler_hir::NonLocalBinding::ImportNamespace { name, module } => {
                    format!("ImportNamespace {{ name: {:?}, module: {:?} }}", name, module)
                }
                react_compiler_hir::NonLocalBinding::ModuleLocal { name } => {
                    format!("ModuleLocal {{ name: {:?} }}", name)
                }
            };
            format!("LoadGlobal {{ binding: {}, loc: {} }}", binding_str, format_opt_loc(loc))
        }
        InstructionValue::StoreGlobal { name, value, loc } => {
            format!(
                "StoreGlobal {{ name: {:?}, value: {}, loc: {} }}",
                name,
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::FunctionExpression { name, name_hint, lowered_func, expr_type, loc } => {
            format!(
                "FunctionExpression {{ name: {}, nameHint: {}, func: fn#{}, exprType: {:?}, loc: {} }}",
                match name {
                    Some(n) => format!("{:?}", n),
                    None => "null".to_string(),
                },
                match name_hint {
                    Some(h) => format!("{:?}", h),
                    None => "null".to_string(),
                },
                lowered_func.func.0,
                expr_type,
                format_opt_loc(loc)
            )
        }
        InstructionValue::TaggedTemplateExpression { tag, value, loc } => {
            format!(
                "TaggedTemplateExpression {{ tag: {}, value: TemplateQuasi {{ raw: {:?}, cooked: {:?} }}, loc: {} }}",
                format_place(tag),
                value.raw,
                value.cooked,
                format_opt_loc(loc)
            )
        }
        InstructionValue::TemplateLiteral { subexprs, quasis, loc } => {
            let sub_strs: Vec<String> = subexprs.iter().map(format_place).collect();
            let quasi_strs: Vec<String> = quasis
                .iter()
                .map(|q| format!("{{ raw: {:?}, cooked: {:?} }}", q.raw, q.cooked))
                .collect();
            format!(
                "TemplateLiteral {{ subexprs: [{}], quasis: [{}], loc: {} }}",
                sub_strs.join(", "),
                quasi_strs.join(", "),
                format_opt_loc(loc)
            )
        }
        InstructionValue::Await { value, loc } => {
            format!("Await {{ value: {}, loc: {} }}", format_place(value), format_opt_loc(loc))
        }
        InstructionValue::GetIterator { collection, loc } => {
            format!(
                "GetIterator {{ collection: {}, loc: {} }}",
                format_place(collection),
                format_opt_loc(loc)
            )
        }
        InstructionValue::IteratorNext { iterator, collection, loc } => {
            format!(
                "IteratorNext {{ iterator: {}, collection: {}, loc: {} }}",
                format_place(iterator),
                format_place(collection),
                format_opt_loc(loc)
            )
        }
        InstructionValue::NextPropertyOf { value, loc } => {
            format!(
                "NextPropertyOf {{ value: {}, loc: {} }}",
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::PrefixUpdate { lvalue, operation, value, loc } => {
            format!(
                "PrefixUpdate {{ lvalue: {}, operation: {:?}, value: {}, loc: {} }}",
                format_place(lvalue),
                operation,
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::PostfixUpdate { lvalue, operation, value, loc } => {
            format!(
                "PostfixUpdate {{ lvalue: {}, operation: {:?}, value: {}, loc: {} }}",
                format_place(lvalue),
                operation,
                format_place(value),
                format_opt_loc(loc)
            )
        }
        InstructionValue::Debugger { loc } => {
            format!("Debugger {{ loc: {} }}", format_opt_loc(loc))
        }
        InstructionValue::StartMemoize { manual_memo_id, deps, deps_loc, loc } => {
            let deps_str = match deps {
                Some(d) => {
                    let items: Vec<String> = d.iter().map(|dep| format!("{:?}", dep)).collect();
                    format!("[{}]", items.join(", "))
                }
                None => "null".to_string(),
            };
            let deps_loc_str = match deps_loc {
                Some(inner) => format_opt_loc(inner),
                None => "null".to_string(),
            };
            format!(
                "StartMemoize {{ manualMemoId: {}, deps: {}, depsLoc: {}, loc: {} }}",
                manual_memo_id,
                deps_str,
                deps_loc_str,
                format_opt_loc(loc)
            )
        }
        InstructionValue::FinishMemoize { manual_memo_id, decl, pruned, loc } => {
            format!(
                "FinishMemoize {{ manualMemoId: {}, decl: {}, pruned: {}, loc: {} }}",
                manual_memo_id,
                format_place(decl),
                pruned,
                format_opt_loc(loc)
            )
        }
        InstructionValue::UnsupportedNode { loc } => {
            format!("UnsupportedNode {{ loc: {} }}", format_opt_loc(loc))
        }
    }
}

fn format_primitive(prim: &react_compiler_hir::PrimitiveValue) -> String {
    match prim {
        react_compiler_hir::PrimitiveValue::Null => "null".to_string(),
        react_compiler_hir::PrimitiveValue::Undefined => "undefined".to_string(),
        react_compiler_hir::PrimitiveValue::Boolean(b) => format!("{}", b),
        react_compiler_hir::PrimitiveValue::Number(n) => format!("{}", n.value()),
        react_compiler_hir::PrimitiveValue::String(s) => format!("{:?}", s),
    }
}

fn format_property_literal(prop: &react_compiler_hir::PropertyLiteral) -> String {
    match prop {
        react_compiler_hir::PropertyLiteral::String(s) => format!("{:?}", s),
        react_compiler_hir::PropertyLiteral::Number(n) => format!("{}", n.value()),
    }
}

fn format_object_property_key(key: &react_compiler_hir::ObjectPropertyKey) -> String {
    match key {
        react_compiler_hir::ObjectPropertyKey::String { name } => format!("String({:?})", name),
        react_compiler_hir::ObjectPropertyKey::Identifier { name } => {
            format!("Identifier({:?})", name)
        }
        react_compiler_hir::ObjectPropertyKey::Computed { name } => {
            format!("Computed({})", format_place(name))
        }
        react_compiler_hir::ObjectPropertyKey::Number { name } => {
            format!("Number({})", name.value())
        }
    }
}

fn format_pattern(pattern: &Pattern) -> String {
    match pattern {
        Pattern::Array(arr) => {
            let items: Vec<String> = arr
                .items
                .iter()
                .map(|item| match item {
                    react_compiler_hir::ArrayPatternElement::Place(p) => format_place(p),
                    react_compiler_hir::ArrayPatternElement::Spread(s) => {
                        format!("Spread({})", format_place(&s.place))
                    }
                    react_compiler_hir::ArrayPatternElement::Hole => "Hole".to_string(),
                })
                .collect();
            format!("Array([{}])", items.join(", "))
        }
        Pattern::Object(obj) => {
            let props: Vec<String> = obj
                .properties
                .iter()
                .map(|p| match p {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(prop) => {
                        format!(
                            "{{ key: {}, type: {:?}, place: {} }}",
                            format_object_property_key(&prop.key),
                            prop.property_type,
                            format_place(&prop.place)
                        )
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        format!("Spread({})", format_place(&s.place))
                    }
                })
                .collect();
            format!("Object([{}])", props.join(", "))
        }
    }
}

fn format_terminal(terminal: &Terminal) -> String {
    match terminal {
        Terminal::Unsupported { id, loc } => {
            format!("Unsupported {{ id: {}, loc: {} }}", id.0, format_opt_loc(loc))
        }
        Terminal::Unreachable { id, loc } => {
            format!("Unreachable {{ id: {}, loc: {} }}", id.0, format_opt_loc(loc))
        }
        Terminal::Throw { value, id, loc } => {
            format!(
                "Throw {{ value: {}, id: {}, loc: {} }}",
                format_place(value),
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Return { value, return_variant, id, loc, effects } => {
            format!(
                "Return {{ value: {}, variant: {:?}, id: {}, loc: {}, effects: {} }}",
                format_place(value),
                return_variant,
                id.0,
                format_opt_loc(loc),
                match effects {
                    Some(e) => format!("[{} effects]", e.len()),
                    None => "null".to_string(),
                }
            )
        }
        Terminal::Goto { block, variant, id, loc } => {
            format!(
                "Goto {{ block: bb{}, variant: {:?}, id: {}, loc: {} }}",
                block.0,
                variant,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::If { test, consequent, alternate, fallthrough, id, loc } => {
            format!(
                "If {{ test: {}, consequent: bb{}, alternate: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                format_place(test),
                consequent.0,
                alternate.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Branch { test, consequent, alternate, fallthrough, id, loc } => {
            format!(
                "Branch {{ test: {}, consequent: bb{}, alternate: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                format_place(test),
                consequent.0,
                alternate.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Switch { test, cases, fallthrough, id, loc } => {
            let cases_str: Vec<String> = cases
                .iter()
                .map(|c| {
                    let test_str = match &c.test {
                        Some(p) => format_place(p),
                        None => "default".to_string(),
                    };
                    format!("Case {{ test: {}, block: bb{} }}", test_str, c.block.0)
                })
                .collect();
            format!(
                "Switch {{ test: {}, cases: [{}], fallthrough: bb{}, id: {}, loc: {} }}",
                format_place(test),
                cases_str.join(", "),
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::DoWhile { loop_block, test, fallthrough, id, loc } => {
            format!(
                "DoWhile {{ loop: bb{}, test: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                loop_block.0,
                test.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::While { test, loop_block, fallthrough, id, loc } => {
            format!(
                "While {{ test: bb{}, loop: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                test.0,
                loop_block.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::For { init, test, update, loop_block, fallthrough, id, loc } => {
            format!(
                "For {{ init: bb{}, test: bb{}, update: {}, loop: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                init.0,
                test.0,
                match update {
                    Some(u) => format!("bb{}", u.0),
                    None => "null".to_string(),
                },
                loop_block.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::ForOf { init, test, loop_block, fallthrough, id, loc } => {
            format!(
                "ForOf {{ init: bb{}, test: bb{}, loop: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                init.0,
                test.0,
                loop_block.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::ForIn { init, loop_block, fallthrough, id, loc } => {
            format!(
                "ForIn {{ init: bb{}, loop: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                init.0,
                loop_block.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Logical { operator, test, fallthrough, id, loc } => {
            format!(
                "Logical {{ operator: {:?}, test: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                operator,
                test.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Ternary { test, fallthrough, id, loc } => {
            format!(
                "Ternary {{ test: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                test.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Optional { optional, test, fallthrough, id, loc } => {
            format!(
                "Optional {{ optional: {}, test: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                optional,
                test.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Label { block, fallthrough, id, loc } => {
            format!(
                "Label {{ block: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                block.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Sequence { block, fallthrough, id, loc } => {
            format!(
                "Sequence {{ block: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                block.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::MaybeThrow { continuation, handler, id, loc, effects } => {
            format!(
                "MaybeThrow {{ continuation: bb{}, handler: {}, id: {}, loc: {}, effects: {} }}",
                continuation.0,
                match handler {
                    Some(h) => format!("bb{}", h.0),
                    None => "null".to_string(),
                },
                id.0,
                format_opt_loc(loc),
                match effects {
                    Some(e) => format!("[{} effects]", e.len()),
                    None => "null".to_string(),
                }
            )
        }
        Terminal::Try { block, handler_binding, handler, fallthrough, id, loc } => {
            format!(
                "Try {{ block: bb{}, handlerBinding: {}, handler: bb{}, fallthrough: bb{}, id: {}, loc: {} }}",
                block.0,
                match handler_binding {
                    Some(p) => format_place(p),
                    None => "null".to_string(),
                },
                handler.0,
                fallthrough.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::Scope { fallthrough, block, scope, id, loc } => {
            format!(
                "Scope {{ block: bb{}, fallthrough: bb{}, scope: {}, id: {}, loc: {} }}",
                block.0,
                fallthrough.0,
                scope.0,
                id.0,
                format_opt_loc(loc)
            )
        }
        Terminal::PrunedScope { fallthrough, block, scope, id, loc } => {
            format!(
                "PrunedScope {{ block: bb{}, fallthrough: bb{}, scope: {}, id: {}, loc: {} }}",
                block.0,
                fallthrough.0,
                scope.0,
                id.0,
                format_opt_loc(loc)
            )
        }
    }
}
