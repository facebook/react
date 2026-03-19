use std::collections::HashSet;

use react_compiler_diagnostics::{CompilerError, CompilerErrorOrDiagnostic, SourceLocation};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    BasicBlock, BlockId, HirFunction, IdentifierId, IdentifierName, Instruction, InstructionValue,
    LValue, ParamPattern, Pattern, Place, ScopeId, Terminal, Type,
};

// =============================================================================
// DebugPrinter struct
// =============================================================================

struct DebugPrinter<'a> {
    env: &'a Environment,
    seen_identifiers: HashSet<IdentifierId>,
    seen_scopes: HashSet<ScopeId>,
    output: Vec<String>,
    indent_level: usize,
}

impl<'a> DebugPrinter<'a> {
    fn new(env: &'a Environment) -> Self {
        Self {
            env,
            seen_identifiers: HashSet::new(),
            seen_scopes: HashSet::new(),
            output: Vec::new(),
            indent_level: 0,
        }
    }

    fn line(&mut self, text: &str) {
        let indent = "  ".repeat(self.indent_level);
        self.output.push(format!("{}{}", indent, text));
    }

    fn indent(&mut self) {
        self.indent_level += 1;
    }

    fn dedent(&mut self) {
        self.indent_level -= 1;
    }

    fn to_string_output(&self) -> String {
        self.output.join("\n")
    }

    // =========================================================================
    // Function
    // =========================================================================

    fn format_function(&mut self, func: &HirFunction) {
        self.indent();
        self.line(&format!(
            "id: {}",
            match &func.id {
                Some(id) => format!("\"{}\"", id),
                None => "null".to_string(),
            }
        ));
        self.line(&format!(
            "name_hint: {}",
            match &func.name_hint {
                Some(h) => format!("\"{}\"", h),
                None => "null".to_string(),
            }
        ));
        self.line(&format!("fn_type: {:?}", func.fn_type));
        self.line(&format!("generator: {}", func.generator));
        self.line(&format!("is_async: {}", func.is_async));
        self.line(&format!("loc: {}", format_loc(&func.loc)));

        // params
        self.line("params:");
        self.indent();
        for (i, param) in func.params.iter().enumerate() {
            match param {
                ParamPattern::Place(place) => {
                    self.format_place_field(&format!("[{}]", i), place);
                }
                ParamPattern::Spread(spread) => {
                    self.line(&format!("[{}] Spread:", i));
                    self.indent();
                    self.format_place_field("place", &spread.place);
                    self.dedent();
                }
            }
        }
        self.dedent();

        // returns
        self.line("returns:");
        self.indent();
        self.format_place_field("value", &func.returns);
        self.dedent();

        // context
        self.line("context:");
        self.indent();
        for (i, place) in func.context.iter().enumerate() {
            self.format_place_field(&format!("[{}]", i), place);
        }
        self.dedent();

        // aliasing_effects
        match &func.aliasing_effects {
            Some(effects) => {
                self.line("aliasingEffects:");
                self.indent();
                for (i, _) in effects.iter().enumerate() {
                    self.line(&format!("[{}] ()", i));
                }
                self.dedent();
            }
            None => self.line("aliasingEffects: null"),
        }

        // directives
        self.line("directives:");
        self.indent();
        for (i, d) in func.directives.iter().enumerate() {
            self.line(&format!("[{}] \"{}\"", i, d));
        }
        self.dedent();

        // return_type_annotation
        self.line(&format!(
            "returnTypeAnnotation: {}",
            match &func.return_type_annotation {
                Some(ann) => ann.clone(),
                None => "null".to_string(),
            }
        ));

        self.line("");
        self.line("Blocks:");
        self.indent();
        for (block_id, block) in &func.body.blocks {
            self.format_block(block_id, block, &func.instructions);
        }
        self.dedent();
        self.dedent();
    }

    // =========================================================================
    // Block
    // =========================================================================

    fn format_block(
        &mut self,
        block_id: &BlockId,
        block: &BasicBlock,
        instructions: &[Instruction],
    ) {
        self.line(&format!("bb{} ({}):", block_id.0, block.kind));
        self.indent();

        // preds
        let preds: Vec<String> = block.preds.iter().map(|p| format!("bb{}", p.0)).collect();
        self.line(&format!("preds: [{}]", preds.join(", ")));

        // phis
        self.line("phis:");
        self.indent();
        for phi in &block.phis {
            self.format_phi(phi);
        }
        self.dedent();

        // instructions
        self.line("instructions:");
        self.indent();
        for (index, instr_id) in block.instructions.iter().enumerate() {
            let instr = &instructions[instr_id.0 as usize];
            self.format_instruction(instr, index);
        }
        self.dedent();

        // terminal
        self.line("terminal:");
        self.indent();
        self.format_terminal(&block.terminal);
        self.dedent();

        self.dedent();
    }

    // =========================================================================
    // Phi
    // =========================================================================

    fn format_phi(&mut self, phi: &react_compiler_hir::Phi) {
        self.line("Phi {");
        self.indent();
        self.format_place_field("place", &phi.place);
        self.line("operands:");
        self.indent();
        for (block_id, place) in &phi.operands {
            self.line(&format!("bb{}:", block_id.0));
            self.indent();
            self.format_place_field("value", place);
            self.dedent();
        }
        self.dedent();
        self.dedent();
        self.line("}");
    }

    // =========================================================================
    // Instruction
    // =========================================================================

    fn format_instruction(&mut self, instr: &Instruction, index: usize) {
        self.line(&format!("[{}] Instruction {{", index));
        self.indent();
        self.line(&format!("id: {}", instr.id.0));
        self.format_place_field("lvalue", &instr.lvalue);
        self.line("value:");
        self.indent();
        self.format_instruction_value(&instr.value);
        self.dedent();
        match &instr.effects {
            Some(effects) => {
                self.line("effects:");
                self.indent();
                for (i, _) in effects.iter().enumerate() {
                    self.line(&format!("[{}] ()", i));
                }
                self.dedent();
            }
            None => self.line("effects: null"),
        }
        self.line(&format!("loc: {}", format_loc(&instr.loc)));
        self.dedent();
        self.line("}");
    }

    // =========================================================================
    // Place (with identifier deduplication)
    // =========================================================================

    fn format_place_field(&mut self, field_name: &str, place: &Place) {
        let is_seen = self.seen_identifiers.contains(&place.identifier);
        if is_seen {
            self.line(&format!(
                "{}: Place {{ identifier: Identifier({}), effect: {}, reactive: {}, loc: {} }}",
                field_name,
                place.identifier.0,
                place.effect,
                place.reactive,
                format_loc(&place.loc)
            ));
        } else {
            self.line(&format!("{}: Place {{", field_name));
            self.indent();
            self.line("identifier:");
            self.indent();
            self.format_identifier(place.identifier);
            self.dedent();
            self.line(&format!("effect: {}", place.effect));
            self.line(&format!("reactive: {}", place.reactive));
            self.line(&format!("loc: {}", format_loc(&place.loc)));
            self.dedent();
            self.line("}");
        }
    }

    // =========================================================================
    // Identifier (first-seen expansion)
    // =========================================================================

    fn format_identifier(&mut self, id: IdentifierId) {
        self.seen_identifiers.insert(id);
        let ident = &self.env.identifiers[id.0 as usize];
        self.line("Identifier {");
        self.indent();
        self.line(&format!("id: {}", ident.id.0));
        self.line(&format!("declarationId: {}", ident.declaration_id.0));
        match &ident.name {
            Some(name) => {
                let (kind, value) = match name {
                    IdentifierName::Named(n) => ("named", n.as_str()),
                    IdentifierName::Promoted(n) => ("promoted", n.as_str()),
                };
                self.line(&format!(
                    "name: {{ kind: \"{}\", value: \"{}\" }}",
                    kind, value
                ));
            }
            None => self.line("name: null"),
        }
        self.line(&format!(
            "mutableRange: [{}:{}]",
            ident.mutable_range.start.0, ident.mutable_range.end.0
        ));
        match ident.scope {
            Some(scope_id) => self.format_scope_field("scope", scope_id),
            None => self.line("scope: null"),
        }
        self.line(&format!("type: {}", self.format_type(ident.type_)));
        self.line(&format!("loc: {}", format_loc(&ident.loc)));
        self.dedent();
        self.line("}");
    }

    // =========================================================================
    // Scope (with deduplication)
    // =========================================================================

    fn format_scope_field(&mut self, field_name: &str, scope_id: ScopeId) {
        let is_seen = self.seen_scopes.contains(&scope_id);
        if is_seen {
            self.line(&format!("{}: Scope({})", field_name, scope_id.0));
        } else {
            self.seen_scopes.insert(scope_id);
            if let Some(scope) = self.env.scopes.iter().find(|s| s.id == scope_id) {
                let range_start = scope.range.start.0;
                let range_end = scope.range.end.0;
                self.line(&format!("{}: Scope {{", field_name));
                self.indent();
                self.line(&format!("id: {}", scope_id.0));
                self.line(&format!("range: [{}:{}]", range_start, range_end));
                self.dedent();
                self.line("}");
            } else {
                self.line(&format!("{}: Scope({})", field_name, scope_id.0));
            }
        }
    }

    // =========================================================================
    // Type
    // =========================================================================

    fn format_type(&self, type_id: react_compiler_hir::TypeId) -> String {
        if let Some(ty) = self.env.types.get(type_id.0 as usize) {
            match ty {
                Type::Primitive => "Primitive".to_string(),
                Type::Function {
                    shape_id,
                    return_type,
                    is_constructor,
                } => {
                    format!(
                        "Function {{ shapeId: {}, return: {}, isConstructor: {} }}",
                        match shape_id {
                            Some(s) => format!("\"{}\"", s),
                            None => "null".to_string(),
                        },
                        self.format_type_value(return_type),
                        is_constructor
                    )
                }
                Type::Object { shape_id } => {
                    format!(
                        "Object {{ shapeId: {} }}",
                        match shape_id {
                            Some(s) => format!("\"{}\"", s),
                            None => "null".to_string(),
                        }
                    )
                }
                Type::TypeVar { id } => format!("Type({})", id.0),
                Type::Poly => "Poly".to_string(),
                Type::Phi { operands } => {
                    let ops: Vec<String> = operands
                        .iter()
                        .map(|op| self.format_type_value(op))
                        .collect();
                    format!("Phi {{ operands: [{}] }}", ops.join(", "))
                }
                Type::Property {
                    object_type,
                    object_name,
                    property_name,
                } => {
                    let prop_str = match property_name {
                        react_compiler_hir::PropertyNameKind::Literal { value } => {
                            format!("\"{}\"", format_property_literal(value))
                        }
                        react_compiler_hir::PropertyNameKind::Computed { value } => {
                            format!("computed({})", self.format_type_value(value))
                        }
                    };
                    format!(
                        "Property {{ objectType: {}, objectName: \"{}\", propertyName: {} }}",
                        self.format_type_value(object_type),
                        object_name,
                        prop_str
                    )
                }
                Type::ObjectMethod => "ObjectMethod".to_string(),
            }
        } else {
            format!("Type({})", type_id.0)
        }
    }

    fn format_type_value(&self, ty: &Type) -> String {
        match ty {
            Type::Primitive => "Primitive".to_string(),
            Type::Function {
                shape_id,
                return_type,
                is_constructor,
            } => {
                format!(
                    "Function {{ shapeId: {}, return: {}, isConstructor: {} }}",
                    match shape_id {
                        Some(s) => format!("\"{}\"", s),
                        None => "null".to_string(),
                    },
                    self.format_type_value(return_type),
                    is_constructor
                )
            }
            Type::Object { shape_id } => {
                format!(
                    "Object {{ shapeId: {} }}",
                    match shape_id {
                        Some(s) => format!("\"{}\"", s),
                        None => "null".to_string(),
                    }
                )
            }
            Type::TypeVar { id } => format!("Type({})", id.0),
            Type::Poly => "Poly".to_string(),
            Type::Phi { operands } => {
                let ops: Vec<String> = operands
                    .iter()
                    .map(|op| self.format_type_value(op))
                    .collect();
                format!("Phi {{ operands: [{}] }}", ops.join(", "))
            }
            Type::Property {
                object_type,
                object_name,
                property_name,
            } => {
                let prop_str = match property_name {
                    react_compiler_hir::PropertyNameKind::Literal { value } => {
                        format!("\"{}\"", format_property_literal(value))
                    }
                    react_compiler_hir::PropertyNameKind::Computed { value } => {
                        format!("computed({})", self.format_type_value(value))
                    }
                };
                format!(
                    "Property {{ objectType: {}, objectName: \"{}\", propertyName: {} }}",
                    self.format_type_value(object_type),
                    object_name,
                    prop_str
                )
            }
            Type::ObjectMethod => "ObjectMethod".to_string(),
        }
    }

    // =========================================================================
    // LValue
    // =========================================================================

    fn format_lvalue(&mut self, field_name: &str, lv: &LValue) {
        self.line(&format!("{}:", field_name));
        self.indent();
        self.line(&format!("kind: {:?}", lv.kind));
        self.format_place_field("place", &lv.place);
        self.dedent();
    }

    // =========================================================================
    // Pattern
    // =========================================================================

    fn format_pattern(&mut self, pattern: &Pattern) {
        match pattern {
            Pattern::Array(arr) => {
                self.line("pattern: ArrayPattern {");
                self.indent();
                self.line("items:");
                self.indent();
                for (i, item) in arr.items.iter().enumerate() {
                    match item {
                        react_compiler_hir::ArrayPatternElement::Hole => {
                            self.line(&format!("[{}] Hole", i));
                        }
                        react_compiler_hir::ArrayPatternElement::Place(p) => {
                            self.format_place_field(&format!("[{}]", i), p);
                        }
                        react_compiler_hir::ArrayPatternElement::Spread(s) => {
                            self.line(&format!("[{}] Spread:", i));
                            self.indent();
                            self.format_place_field("place", &s.place);
                            self.dedent();
                        }
                    }
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(&arr.loc)));
                self.dedent();
                self.line("}");
            }
            Pattern::Object(obj) => {
                self.line("pattern: ObjectPattern {");
                self.indent();
                self.line("properties:");
                self.indent();
                for (i, prop) in obj.properties.iter().enumerate() {
                    match prop {
                        react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                            self.line(&format!("[{}] ObjectProperty {{", i));
                            self.indent();
                            self.line(&format!("key: {}", format_object_property_key(&p.key)));
                            self.line(&format!("type: \"{}\"", p.property_type));
                            self.format_place_field("place", &p.place);
                            self.dedent();
                            self.line("}");
                        }
                        react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                            self.line(&format!("[{}] Spread:", i));
                            self.indent();
                            self.format_place_field("place", &s.place);
                            self.dedent();
                        }
                    }
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(&obj.loc)));
                self.dedent();
                self.line("}");
            }
        }
    }

    // =========================================================================
    // Arguments
    // =========================================================================

    fn format_argument(&mut self, arg: &react_compiler_hir::PlaceOrSpread, index: usize) {
        match arg {
            react_compiler_hir::PlaceOrSpread::Place(p) => {
                self.format_place_field(&format!("[{}]", index), p);
            }
            react_compiler_hir::PlaceOrSpread::Spread(s) => {
                self.line(&format!("[{}] Spread:", index));
                self.indent();
                self.format_place_field("place", &s.place);
                self.dedent();
            }
        }
    }

    // =========================================================================
    // InstructionValue
    // =========================================================================

    fn format_instruction_value(&mut self, value: &InstructionValue) {
        match value {
            InstructionValue::ArrayExpression { elements, loc } => {
                self.line("ArrayExpression {");
                self.indent();
                self.line("elements:");
                self.indent();
                for (i, elem) in elements.iter().enumerate() {
                    match elem {
                        react_compiler_hir::ArrayElement::Place(p) => {
                            self.format_place_field(&format!("[{}]", i), p);
                        }
                        react_compiler_hir::ArrayElement::Hole => {
                            self.line(&format!("[{}] Hole", i));
                        }
                        react_compiler_hir::ArrayElement::Spread(s) => {
                            self.line(&format!("[{}] Spread:", i));
                            self.indent();
                            self.format_place_field("place", &s.place);
                            self.dedent();
                        }
                    }
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::ObjectExpression { properties, loc } => {
                self.line("ObjectExpression {");
                self.indent();
                self.line("properties:");
                self.indent();
                for (i, prop) in properties.iter().enumerate() {
                    match prop {
                        react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                            self.line(&format!("[{}] ObjectProperty {{", i));
                            self.indent();
                            self.line(&format!("key: {}", format_object_property_key(&p.key)));
                            self.line(&format!("type: \"{}\"", p.property_type));
                            self.format_place_field("place", &p.place);
                            self.dedent();
                            self.line("}");
                        }
                        react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                            self.line(&format!("[{}] Spread:", i));
                            self.indent();
                            self.format_place_field("place", &s.place);
                            self.dedent();
                        }
                    }
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::UnaryExpression {
                operator,
                value,
                loc,
            } => {
                self.line("UnaryExpression {");
                self.indent();
                self.line(&format!("operator: \"{}\"", operator));
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::BinaryExpression {
                operator,
                left,
                right,
                loc,
            } => {
                self.line("BinaryExpression {");
                self.indent();
                self.line(&format!("operator: \"{}\"", operator));
                self.format_place_field("left", left);
                self.format_place_field("right", right);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::NewExpression { callee, args, loc } => {
                self.line("NewExpression {");
                self.indent();
                self.format_place_field("callee", callee);
                self.line("args:");
                self.indent();
                for (i, arg) in args.iter().enumerate() {
                    self.format_argument(arg, i);
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::CallExpression { callee, args, loc } => {
                self.line("CallExpression {");
                self.indent();
                self.format_place_field("callee", callee);
                self.line("args:");
                self.indent();
                for (i, arg) in args.iter().enumerate() {
                    self.format_argument(arg, i);
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::MethodCall {
                receiver,
                property,
                args,
                loc,
            } => {
                self.line("MethodCall {");
                self.indent();
                self.format_place_field("receiver", receiver);
                self.format_place_field("property", property);
                self.line("args:");
                self.indent();
                for (i, arg) in args.iter().enumerate() {
                    self.format_argument(arg, i);
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::JSXText { value, loc } => {
                self.line(&format!(
                    "JSXText {{ value: {:?}, loc: {} }}",
                    value,
                    format_loc(loc)
                ));
            }
            InstructionValue::Primitive { value: prim, loc } => {
                self.line(&format!(
                    "Primitive {{ value: {}, loc: {} }}",
                    format_primitive(prim),
                    format_loc(loc)
                ));
            }
            InstructionValue::TypeCastExpression { value, type_, type_annotation_name, type_annotation_kind, loc } => {
                self.line("TypeCastExpression {");
                self.indent();
                self.format_place_field("value", value);
                self.line(&format!("type: {}", self.format_type_value(type_)));
                if let Some(annotation_name) = type_annotation_name {
                    self.line(&format!("typeAnnotation: {}", annotation_name));
                }
                if let Some(annotation_kind) = type_annotation_kind {
                    self.line(&format!("typeAnnotationKind: \"{}\"", annotation_kind));
                }
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::JsxExpression {
                tag,
                props,
                children,
                loc,
                opening_loc,
                closing_loc,
            } => {
                self.line("JsxExpression {");
                self.indent();
                match tag {
                    react_compiler_hir::JsxTag::Place(p) => {
                        self.format_place_field("tag", p);
                    }
                    react_compiler_hir::JsxTag::Builtin(b) => {
                        self.line(&format!("tag: BuiltinTag(\"{}\")", b.name));
                    }
                }
                self.line("props:");
                self.indent();
                for (i, prop) in props.iter().enumerate() {
                    match prop {
                        react_compiler_hir::JsxAttribute::Attribute { name, place } => {
                            self.line(&format!("[{}] JsxAttribute {{", i));
                            self.indent();
                            self.line(&format!("name: \"{}\"", name));
                            self.format_place_field("place", place);
                            self.dedent();
                            self.line("}");
                        }
                        react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                            self.line(&format!("[{}] JsxSpreadAttribute:", i));
                            self.indent();
                            self.format_place_field("argument", argument);
                            self.dedent();
                        }
                    }
                }
                self.dedent();
                match children {
                    Some(c) => {
                        self.line("children:");
                        self.indent();
                        for (i, child) in c.iter().enumerate() {
                            self.format_place_field(&format!("[{}]", i), child);
                        }
                        self.dedent();
                    }
                    None => self.line("children: null"),
                }
                self.line(&format!("openingLoc: {}", format_loc(opening_loc)));
                self.line(&format!("closingLoc: {}", format_loc(closing_loc)));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::JsxFragment { children, loc } => {
                self.line("JsxFragment {");
                self.indent();
                self.line("children:");
                self.indent();
                for (i, child) in children.iter().enumerate() {
                    self.format_place_field(&format!("[{}]", i), child);
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::UnsupportedNode { node_type, loc } => {
                match node_type {
                    Some(t) => self.line(&format!("UnsupportedNode {{ type: {:?}, loc: {} }}", t, format_loc(loc))),
                    None => self.line(&format!("UnsupportedNode {{ loc: {} }}", format_loc(loc))),
                }
            }
            InstructionValue::LoadLocal { place, loc } => {
                self.line("LoadLocal {");
                self.indent();
                self.format_place_field("place", place);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::DeclareLocal {
                lvalue,
                type_annotation,
                loc,
            } => {
                self.line("DeclareLocal {");
                self.indent();
                self.format_lvalue("lvalue", lvalue);
                self.line(&format!(
                    "type: {}",
                    match type_annotation {
                        Some(t) => t.clone(),
                        None => "null".to_string(),
                    }
                ));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::DeclareContext { lvalue, loc } => {
                self.line("DeclareContext {");
                self.indent();
                self.line("lvalue:");
                self.indent();
                self.line(&format!("kind: {:?}", lvalue.kind));
                self.format_place_field("place", &lvalue.place);
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::StoreLocal {
                lvalue,
                value,
                type_annotation,
                loc,
            } => {
                self.line("StoreLocal {");
                self.indent();
                self.format_lvalue("lvalue", lvalue);
                self.format_place_field("value", value);
                self.line(&format!(
                    "type: {}",
                    match type_annotation {
                        Some(t) => t.clone(),
                        None => "null".to_string(),
                    }
                ));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::LoadContext { place, loc } => {
                self.line("LoadContext {");
                self.indent();
                self.format_place_field("place", place);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::StoreContext { lvalue, value, loc } => {
                self.line("StoreContext {");
                self.indent();
                self.line("lvalue:");
                self.indent();
                self.line(&format!("kind: {:?}", lvalue.kind));
                self.format_place_field("place", &lvalue.place);
                self.dedent();
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::Destructure { lvalue, value, loc } => {
                self.line("Destructure {");
                self.indent();
                self.line("lvalue:");
                self.indent();
                self.line(&format!("kind: {:?}", lvalue.kind));
                self.format_pattern(&lvalue.pattern);
                self.dedent();
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::PropertyLoad {
                object,
                property,
                loc,
            } => {
                self.line("PropertyLoad {");
                self.indent();
                self.format_place_field("object", object);
                self.line(&format!(
                    "property: \"{}\"",
                    format_property_literal(property)
                ));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::PropertyStore {
                object,
                property,
                value,
                loc,
            } => {
                self.line("PropertyStore {");
                self.indent();
                self.format_place_field("object", object);
                self.line(&format!(
                    "property: \"{}\"",
                    format_property_literal(property)
                ));
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::PropertyDelete {
                object,
                property,
                loc,
            } => {
                self.line("PropertyDelete {");
                self.indent();
                self.format_place_field("object", object);
                self.line(&format!(
                    "property: \"{}\"",
                    format_property_literal(property)
                ));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::ComputedLoad {
                object,
                property,
                loc,
            } => {
                self.line("ComputedLoad {");
                self.indent();
                self.format_place_field("object", object);
                self.format_place_field("property", property);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::ComputedStore {
                object,
                property,
                value,
                loc,
            } => {
                self.line("ComputedStore {");
                self.indent();
                self.format_place_field("object", object);
                self.format_place_field("property", property);
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::ComputedDelete {
                object,
                property,
                loc,
            } => {
                self.line("ComputedDelete {");
                self.indent();
                self.format_place_field("object", object);
                self.format_place_field("property", property);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::LoadGlobal { binding, loc } => {
                self.line("LoadGlobal {");
                self.indent();
                self.line(&format!("binding: {}", format_non_local_binding(binding)));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::StoreGlobal { name, value, loc } => {
                self.line("StoreGlobal {");
                self.indent();
                self.line(&format!("name: \"{}\"", name));
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::FunctionExpression {
                name,
                name_hint,
                lowered_func,
                expr_type,
                loc,
            } => {
                self.line("FunctionExpression {");
                self.indent();
                self.line(&format!(
                    "name: {}",
                    match name {
                        Some(n) => format!("\"{}\"", n),
                        None => "null".to_string(),
                    }
                ));
                self.line(&format!(
                    "nameHint: {}",
                    match name_hint {
                        Some(h) => format!("\"{}\"", h),
                        None => "null".to_string(),
                    }
                ));
                self.line(&format!("type: \"{:?}\"", expr_type));
                self.line("loweredFunc:");
                let inner_func = &self.env.functions[lowered_func.func.0 as usize];
                self.format_function(inner_func);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::ObjectMethod {
                loc,
                lowered_func,
            } => {
                self.line("ObjectMethod {");
                self.indent();
                self.line("loweredFunc:");
                let inner_func = &self.env.functions[lowered_func.func.0 as usize];
                self.format_function(inner_func);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::TaggedTemplateExpression { tag, value, loc } => {
                self.line("TaggedTemplateExpression {");
                self.indent();
                self.format_place_field("tag", tag);
                self.line(&format!("raw: {:?}", value.raw));
                self.line(&format!(
                    "cooked: {}",
                    match &value.cooked {
                        Some(c) => format!("{:?}", c),
                        None => "undefined".to_string(),
                    }
                ));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::TemplateLiteral {
                subexprs,
                quasis,
                loc,
            } => {
                self.line("TemplateLiteral {");
                self.indent();
                self.line("subexprs:");
                self.indent();
                for (i, sub) in subexprs.iter().enumerate() {
                    self.format_place_field(&format!("[{}]", i), sub);
                }
                self.dedent();
                self.line("quasis:");
                self.indent();
                for (i, q) in quasis.iter().enumerate() {
                    self.line(&format!(
                        "[{}] {{ raw: {:?}, cooked: {} }}",
                        i,
                        q.raw,
                        match &q.cooked {
                            Some(c) => format!("{:?}", c),
                            None => "undefined".to_string(),
                        }
                    ));
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::RegExpLiteral {
                pattern,
                flags,
                loc,
            } => {
                self.line(&format!(
                    "RegExpLiteral {{ pattern: \"{}\", flags: \"{}\", loc: {} }}",
                    pattern,
                    flags,
                    format_loc(loc)
                ));
            }
            InstructionValue::MetaProperty {
                meta,
                property,
                loc,
            } => {
                self.line(&format!(
                    "MetaProperty {{ meta: \"{}\", property: \"{}\", loc: {} }}",
                    meta,
                    property,
                    format_loc(loc)
                ));
            }
            InstructionValue::Await { value, loc } => {
                self.line("Await {");
                self.indent();
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::GetIterator { collection, loc } => {
                self.line("GetIterator {");
                self.indent();
                self.format_place_field("collection", collection);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::IteratorNext {
                iterator,
                collection,
                loc,
            } => {
                self.line("IteratorNext {");
                self.indent();
                self.format_place_field("iterator", iterator);
                self.format_place_field("collection", collection);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::NextPropertyOf { value, loc } => {
                self.line("NextPropertyOf {");
                self.indent();
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::Debugger { loc } => {
                self.line(&format!("Debugger {{ loc: {} }}", format_loc(loc)));
            }
            InstructionValue::PostfixUpdate {
                lvalue,
                operation,
                value,
                loc,
            } => {
                self.line("PostfixUpdate {");
                self.indent();
                self.format_place_field("lvalue", lvalue);
                self.line(&format!("operation: \"{}\"", operation));
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::PrefixUpdate {
                lvalue,
                operation,
                value,
                loc,
            } => {
                self.line("PrefixUpdate {");
                self.indent();
                self.format_place_field("lvalue", lvalue);
                self.line(&format!("operation: \"{}\"", operation));
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::StartMemoize {
                manual_memo_id,
                deps,
                deps_loc: _,
                loc,
            } => {
                self.line("StartMemoize {");
                self.indent();
                self.line(&format!("manualMemoId: {}", manual_memo_id));
                match deps {
                    Some(d) => {
                        self.line("deps:");
                        self.indent();
                        for (i, dep) in d.iter().enumerate() {
                            let root_str = match &dep.root {
                                react_compiler_hir::ManualMemoDependencyRoot::Global {
                                    identifier_name,
                                } => {
                                    format!("Global(\"{}\")", identifier_name)
                                }
                                react_compiler_hir::ManualMemoDependencyRoot::NamedLocal {
                                    value,
                                    constant,
                                } => {
                                    format!(
                                        "NamedLocal({}, constant={})",
                                        value.identifier.0, constant
                                    )
                                }
                            };
                            let path_str: String = dep
                                .path
                                .iter()
                                .map(|p| {
                                    format!(
                                        "{}.{}",
                                        if p.optional { "?" } else { "" },
                                        format_property_literal(&p.property)
                                    )
                                })
                                .collect();
                            self.line(&format!("[{}] {}{}", i, root_str, path_str));
                        }
                        self.dedent();
                    }
                    None => self.line("deps: null"),
                }
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            InstructionValue::FinishMemoize {
                manual_memo_id,
                decl,
                pruned,
                loc,
            } => {
                self.line("FinishMemoize {");
                self.indent();
                self.line(&format!("manualMemoId: {}", manual_memo_id));
                self.format_place_field("decl", decl);
                self.line(&format!("pruned: {}", pruned));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
        }
    }

    // =========================================================================
    // Terminal
    // =========================================================================

    fn format_terminal(&mut self, terminal: &Terminal) {
        match terminal {
            Terminal::If {
                test,
                consequent,
                alternate,
                fallthrough,
                id,
                loc,
            } => {
                self.line("If {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.format_place_field("test", test);
                self.line(&format!("consequent: bb{}", consequent.0));
                self.line(&format!("alternate: bb{}", alternate.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Branch {
                test,
                consequent,
                alternate,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Branch {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.format_place_field("test", test);
                self.line(&format!("consequent: bb{}", consequent.0));
                self.line(&format!("alternate: bb{}", alternate.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Logical {
                operator,
                test,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Logical {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("operator: \"{}\"", operator));
                self.line(&format!("test: bb{}", test.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Ternary {
                test,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Ternary {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("test: bb{}", test.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Optional {
                optional,
                test,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Optional {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("optional: {}", optional));
                self.line(&format!("test: bb{}", test.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Throw { value, id, loc } => {
                self.line("Throw {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.format_place_field("value", value);
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Return {
                value,
                return_variant,
                id,
                loc,
                effects,
            } => {
                self.line("Return {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("returnVariant: {:?}", return_variant));
                self.format_place_field("value", value);
                match effects {
                    Some(e) => {
                        self.line("effects:");
                        self.indent();
                        for (i, _) in e.iter().enumerate() {
                            self.line(&format!("[{}] ()", i));
                        }
                        self.dedent();
                    }
                    None => self.line("effects: null"),
                }
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Goto {
                block,
                variant,
                id,
                loc,
            } => {
                self.line("Goto {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("block: bb{}", block.0));
                self.line(&format!("variant: {:?}", variant));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Switch {
                test,
                cases,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Switch {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.format_place_field("test", test);
                self.line("cases:");
                self.indent();
                for (i, case) in cases.iter().enumerate() {
                    match &case.test {
                        Some(p) => {
                            self.line(&format!("[{}] Case {{", i));
                            self.indent();
                            self.format_place_field("test", p);
                            self.line(&format!("block: bb{}", case.block.0));
                            self.dedent();
                            self.line("}");
                        }
                        None => {
                            self.line(&format!("[{}] Default {{ block: bb{} }}", i, case.block.0));
                        }
                    }
                }
                self.dedent();
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::DoWhile {
                loop_block,
                test,
                fallthrough,
                id,
                loc,
            } => {
                self.line("DoWhile {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loop: bb{}", loop_block.0));
                self.line(&format!("test: bb{}", test.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::While {
                test,
                loop_block,
                fallthrough,
                id,
                loc,
            } => {
                self.line("While {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("test: bb{}", test.0));
                self.line(&format!("loop: bb{}", loop_block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::For {
                init,
                test,
                update,
                loop_block,
                fallthrough,
                id,
                loc,
            } => {
                self.line("For {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("init: bb{}", init.0));
                self.line(&format!("test: bb{}", test.0));
                self.line(&format!(
                    "update: {}",
                    match update {
                        Some(u) => format!("bb{}", u.0),
                        None => "null".to_string(),
                    }
                ));
                self.line(&format!("loop: bb{}", loop_block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::ForOf {
                init,
                test,
                loop_block,
                fallthrough,
                id,
                loc,
            } => {
                self.line("ForOf {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("init: bb{}", init.0));
                self.line(&format!("test: bb{}", test.0));
                self.line(&format!("loop: bb{}", loop_block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::ForIn {
                init,
                loop_block,
                fallthrough,
                id,
                loc,
            } => {
                self.line("ForIn {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("init: bb{}", init.0));
                self.line(&format!("loop: bb{}", loop_block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Label {
                block,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Label {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("block: bb{}", block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Sequence {
                block,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Sequence {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("block: bb{}", block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Unreachable { id, loc } => {
                self.line(&format!(
                    "Unreachable {{ id: {}, loc: {} }}",
                    id.0,
                    format_loc(loc)
                ));
            }
            Terminal::Unsupported { id, loc } => {
                self.line(&format!(
                    "Unsupported {{ id: {}, loc: {} }}",
                    id.0,
                    format_loc(loc)
                ));
            }
            Terminal::MaybeThrow {
                continuation,
                handler,
                id,
                loc,
                effects,
            } => {
                self.line("MaybeThrow {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("continuation: bb{}", continuation.0));
                self.line(&format!(
                    "handler: {}",
                    match handler {
                        Some(h) => format!("bb{}", h.0),
                        None => "null".to_string(),
                    }
                ));
                match effects {
                    Some(e) => {
                        self.line("effects:");
                        self.indent();
                        for (i, _) in e.iter().enumerate() {
                            self.line(&format!("[{}] ()", i));
                        }
                        self.dedent();
                    }
                    None => self.line("effects: null"),
                }
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Scope {
                fallthrough,
                block,
                scope,
                id,
                loc,
            } => {
                self.line("Scope {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.format_scope_field("scope", *scope);
                self.line(&format!("block: bb{}", block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::PrunedScope {
                fallthrough,
                block,
                scope,
                id,
                loc,
            } => {
                self.line("PrunedScope {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.format_scope_field("scope", *scope);
                self.line(&format!("block: bb{}", block.0));
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            Terminal::Try {
                block,
                handler_binding,
                handler,
                fallthrough,
                id,
                loc,
            } => {
                self.line("Try {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("block: bb{}", block.0));
                self.line(&format!("handler: bb{}", handler.0));
                match handler_binding {
                    Some(p) => self.format_place_field("handlerBinding", p),
                    None => self.line("handlerBinding: null"),
                }
                self.line(&format!("fallthrough: bb{}", fallthrough.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
        }
    }

    // =========================================================================
    // Errors
    // =========================================================================

    fn format_errors(&mut self, error: &CompilerError) {
        if error.details.is_empty() {
            self.line("Errors: []");
            return;
        }
        self.line("Errors:");
        self.indent();
        for (i, detail) in error.details.iter().enumerate() {
            self.line(&format!("[{}] {{", i));
            self.indent();
            match detail {
                CompilerErrorOrDiagnostic::Diagnostic(d) => {
                    self.line(&format!("severity: {:?}", d.severity()));
                    self.line(&format!("reason: {:?}", d.reason));
                    self.line(&format!(
                        "description: {}",
                        match &d.description {
                            Some(desc) => format!("{:?}", desc),
                            None => "null".to_string(),
                        }
                    ));
                    self.line(&format!("category: {:?}", d.category));
                    let loc = d.primary_location();
                    self.line(&format!(
                        "loc: {}",
                        match loc {
                            Some(l) => format_loc_value(l),
                            None => "null".to_string(),
                        }
                    ));
                }
                CompilerErrorOrDiagnostic::ErrorDetail(d) => {
                    self.line(&format!("severity: {:?}", d.severity()));
                    self.line(&format!("reason: {:?}", d.reason));
                    self.line(&format!(
                        "description: {}",
                        match &d.description {
                            Some(desc) => format!("{:?}", desc),
                            None => "null".to_string(),
                        }
                    ));
                    self.line(&format!("category: {:?}", d.category));
                    self.line(&format!(
                        "loc: {}",
                        match &d.loc {
                            Some(l) => format_loc_value(l),
                            None => "null".to_string(),
                        }
                    ));
                }
            }
            self.dedent();
            self.line("}");
        }
        self.dedent();
    }
}

// =============================================================================
// Entry point
// =============================================================================

pub fn debug_hir(hir: &HirFunction, env: &Environment) -> String {
    let mut printer = DebugPrinter::new(env);
    printer.format_function(hir);

    printer.line("");
    printer.line("Environment:");
    printer.indent();
    printer.format_errors(&env.errors);
    printer.dedent();

    printer.to_string_output()
}

// =============================================================================
// Standalone helper functions (no state needed)
// =============================================================================

fn format_loc(loc: &Option<SourceLocation>) -> String {
    match loc {
        Some(l) => format_loc_value(l),
        None => "generated".to_string(),
    }
}

fn format_loc_value(loc: &SourceLocation) -> String {
    format!(
        "{}:{}-{}:{}",
        loc.start.line, loc.start.column, loc.end.line, loc.end.column
    )
}

fn format_primitive(prim: &react_compiler_hir::PrimitiveValue) -> String {
    match prim {
        react_compiler_hir::PrimitiveValue::Null => "null".to_string(),
        react_compiler_hir::PrimitiveValue::Undefined => "undefined".to_string(),
        react_compiler_hir::PrimitiveValue::Boolean(b) => format!("{}", b),
        react_compiler_hir::PrimitiveValue::Number(n) => {
            let v = n.value();
            // Match JS String(-0) === "0" behavior
            if v == 0.0 && v.is_sign_negative() {
                "0".to_string()
            } else {
                format!("{}", v)
            }
        }
        react_compiler_hir::PrimitiveValue::String(s) => {
            // Format like JS JSON.stringify: escape control chars and quotes but NOT non-ASCII unicode
            let mut result = String::with_capacity(s.len() + 2);
            result.push('"');
            for c in s.chars() {
                match c {
                    '"' => result.push_str("\\\""),
                    '\\' => result.push_str("\\\\"),
                    '\n' => result.push_str("\\n"),
                    '\r' => result.push_str("\\r"),
                    '\t' => result.push_str("\\t"),
                    c if c.is_control() => {
                        result.push_str(&format!("\\u{{{:04x}}}", c as u32));
                    }
                    c => result.push(c),
                }
            }
            result.push('"');
            result
        }
    }
}

fn format_property_literal(prop: &react_compiler_hir::PropertyLiteral) -> String {
    match prop {
        react_compiler_hir::PropertyLiteral::String(s) => s.clone(),
        react_compiler_hir::PropertyLiteral::Number(n) => format!("{}", n.value()),
    }
}

fn format_object_property_key(key: &react_compiler_hir::ObjectPropertyKey) -> String {
    match key {
        react_compiler_hir::ObjectPropertyKey::String { name } => format!("String(\"{}\")", name),
        react_compiler_hir::ObjectPropertyKey::Identifier { name } => {
            format!("Identifier(\"{}\")", name)
        }
        react_compiler_hir::ObjectPropertyKey::Computed { name } => {
            format!("Computed({})", name.identifier.0)
        }
        react_compiler_hir::ObjectPropertyKey::Number { name } => {
            format!("Number({})", name.value())
        }
    }
}

fn format_non_local_binding(binding: &react_compiler_hir::NonLocalBinding) -> String {
    match binding {
        react_compiler_hir::NonLocalBinding::Global { name } => {
            format!("Global {{ name: \"{}\" }}", name)
        }
        react_compiler_hir::NonLocalBinding::ModuleLocal { name } => {
            format!("ModuleLocal {{ name: \"{}\" }}", name)
        }
        react_compiler_hir::NonLocalBinding::ImportDefault { name, module } => {
            format!(
                "ImportDefault {{ name: \"{}\", module: \"{}\" }}",
                name, module
            )
        }
        react_compiler_hir::NonLocalBinding::ImportNamespace { name, module } => {
            format!(
                "ImportNamespace {{ name: \"{}\", module: \"{}\" }}",
                name, module
            )
        }
        react_compiler_hir::NonLocalBinding::ImportSpecifier {
            name,
            module,
            imported,
        } => {
            format!(
                "ImportSpecifier {{ name: \"{}\", module: \"{}\", imported: \"{}\" }}",
                name, module, imported
            )
        }
    }
}

// =============================================================================
// Error formatting (kept for backward compatibility)
// =============================================================================

pub fn format_errors(error: &CompilerError) -> String {
    let env = Environment::new();
    let mut printer = DebugPrinter::new(&env);
    printer.format_errors(error);
    printer.to_string_output()
}
