/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::fmt::{Result, Write};

use react_estree::JsValue;
use react_utils::ensure_sufficient_stack;

use crate::{
    ArrayDestructureItem, BasicBlock, DestructurePattern, Function, Identifier, IdentifierOperand,
    Instruction, InstructionValue, LValue, ObjectDestructureItem, Phi, PlaceOrSpread, Terminal,
    TerminalValue, HIR,
};

/// Trait for HIR types to describe how they print themselves.
/// Eventually we should add a higher-level abstraction for printing to
/// handle things like indentation and maybe wrapping long lines. The
/// `pretty` crate seems to have a lot of usage but the type signatures
/// are pretty tedious, we can make something much simpler.
pub trait Print {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result;
}

impl Function {
    pub fn debug(&self) {
        let mut out = String::new();
        self.print(&self.body, &mut out).unwrap();
        println!("{out}");
    }
}

impl Print for Function {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        ensure_sufficient_stack(|| {
            writeln!(
                out,
                "function {}(",
                match &self.id {
                    Some(id) => id,
                    None => "<anonymous>",
                }
            )?;
            for param in &self.params {
                write!(out, "  ")?;
                param.print(hir, out)?;
                writeln!(out, ",")?;
            }
            writeln!(out, ")")?;
            writeln!(out, "entry {}", self.body.entry)?;
            for block in self.body.blocks.iter() {
                block.print(hir, out)?;
            }
            writeln!(out)?;
            Ok(())
        })
    }
}

impl Print for BasicBlock {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        writeln!(out, "{} ({})", self.id, self.kind)?;
        if !self.predecessors.is_empty() {
            write!(out, "  predecessors: ")?;
            for (ix, pred) in self.predecessors.iter().enumerate() {
                if ix != 0 {
                    write!(out, ", ")?;
                }
                write!(out, "{}", *pred)?;
            }
            writeln!(out)?;
        }
        for phi in self.phis.iter() {
            phi.print(hir, out)?;
            writeln!(out)?;
        }
        for ix in &self.instructions {
            if usize::from(*ix) >= hir.instructions.len() {
                writeln!(out, "  <out of bounds {}>", ix)?;
                continue;
            }
            let instr = &hir.instructions[usize::from(*ix)];
            write!(out, "  {} ", instr.id)?;
            instr.lvalue.print(hir, out)?;
            write!(out, " = ")?;
            instr.value.print(hir, out)?;
            writeln!(out, "")?;
        }
        self.terminal.print(hir, out)?;
        Ok(())
    }
}

impl Print for Phi {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        write!(out, "  ")?;
        self.identifier.print(hir, out)?;
        write!(out, ": phi(")?;
        for (ix, (pred_id, id)) in self.operands.iter().enumerate() {
            if ix != 0 {
                write!(out, ", ")?;
            }
            write!(out, "{}: ", pred_id)?;
            id.print(hir, out)?;
        }
        write!(out, ")")?;
        Ok(())
    }
}

impl Print for Instruction {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        write!(out, "  {} ", self.id)?;
        self.value.print(hir, out)?;
        writeln!(out, "")?;
        Ok(())
    }
}

impl Print for InstructionValue {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        match self {
            InstructionValue::Array(value) => {
                write!(out, "Array [")?;
                for (ix, item) in value.elements.iter().enumerate() {
                    if ix != 0 {
                        write!(out, ", ")?;
                    }
                    if let Some(item) = item {
                        item.print(hir, out)?;
                    } else {
                        write!(out, "<elision>")?;
                    }
                }
                write!(out, "]")?;
            }
            InstructionValue::Call(value) => {
                write!(out, "Call ")?;
                value.callee.print(hir, out)?;
                write!(out, "(")?;
                for (ix, arg) in value.arguments.iter().enumerate() {
                    if ix != 0 {
                        write!(out, ", ")?;
                    }
                    arg.print(hir, out)?;
                }
                write!(out, ")")?;
            }
            InstructionValue::LoadGlobal(value) => {
                write!(out, "LoadGlobal {}", &value.name)?;
            }
            InstructionValue::LoadLocal(value) => {
                write!(out, "LoadLocal ")?;
                value.place.print(hir, out)?;
            }
            InstructionValue::Primitive(value) => {
                // Unlike other variants we don't print the variant name ("Primitive") since it's
                // obvious
                match &value.value {
                    JsValue::Boolean(value) => write!(out, "{}", value)?,
                    JsValue::Null => write!(out, "null")?,
                    JsValue::Number(value) => write!(out, "{}", f64::from(*value))?,

                    // TODO: quote the string itself (JS version uses JSON.stringify())
                    JsValue::String(value) => write!(out, "\"{}\"", value.as_str())?,

                    JsValue::Undefined => write!(out, "<undefined>")?,
                };
            }
            InstructionValue::StoreLocal(value) => {
                write!(out, "StoreLocal ")?;
                value.lvalue.print(hir, out)?;
                write!(out, " = ")?;
                value.value.print(hir, out)?;
            }
            InstructionValue::DeclareLocal(value) => {
                write!(out, "DeclareLocal ")?;
                value.lvalue.print(hir, out)?;
            }
            InstructionValue::Binary(value) => {
                write!(out, "Binary ")?;
                value.left.print(hir, out)?;
                write!(out, " {} ", value.operator)?;
                value.right.print(hir, out)?;
            }
            InstructionValue::Function(value) => {
                write!(out, "Function @deps[")?;
                for (ix, dep) in value.dependencies.iter().enumerate() {
                    if ix != 0 {
                        write!(out, ", ")?;
                    }
                    dep.print(hir, out)?;
                }
                write!(out, "] @context[")?;
                for (ix, dep) in value.lowered_function.context.iter().enumerate() {
                    if ix != 0 {
                        write!(out, ", ")?;
                    }
                    dep.print(hir, out)?;
                }
                writeln!(out, "]:")?;
                let mut inner_output = String::new();
                value
                    .lowered_function
                    .print(&value.lowered_function.body, &mut inner_output)?;
                let lines: Vec<_> = inner_output
                    .split("\n")
                    .map(|line| format!("      {}", line))
                    .filter(|line| line.trim().len() != 0)
                    .collect();
                write!(out, "{}", lines.join("\n"))?;
            }
            InstructionValue::Destructure(value) => {
                write!(out, "Destructure ")?;
                value.pattern.print(hir, out)?;
                write!(out, " = ")?;
                value.value.print(hir, out)?;
            }
            InstructionValue::Tombstone => {
                write!(out, "Tombstone!")?;
            }
            _ => write!(out, "{:?}", self)?,
        }
        Ok(())
    }
}

impl Print for PlaceOrSpread {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        match self {
            PlaceOrSpread::Place(place) => place.print(hir, out),
            PlaceOrSpread::Spread(place) => {
                write!(out, "...")?;
                place.print(hir, out)?;
                Ok(())
            }
        }
    }
}

impl Print for LValue {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        write!(out, "{} ", self.kind)?;
        self.identifier.print(hir, out)
    }
}

impl Print for IdentifierOperand {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        write!(
            out,
            "{} ",
            match self.effect {
                Some(effect) => format!("{}", effect),
                None => "unknown".to_string(),
            },
        )?;
        self.identifier.print(hir, out)
    }
}

impl Print for Identifier {
    fn print(&self, _hir: &HIR, out: &mut impl Write) -> Result {
        write!(
            out,
            "{}{}",
            match &self.name {
                Some(name) => name.to_string(),
                None => "".to_string(),
            },
            self.id
        )
    }
}

impl Print for DestructurePattern {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        match self {
            DestructurePattern::Array(items) => {
                write!(out, "[ ")?;
                for (index, item) in items.iter().enumerate() {
                    if index != 0 {
                        write!(out, ", ")?;
                    }
                    match item {
                        ArrayDestructureItem::Hole => {
                            write!(out, "<hole>")?;
                        }
                        ArrayDestructureItem::Value(item) => {
                            item.print(hir, out)?;
                        }
                        ArrayDestructureItem::Spread(item) => {
                            write!(out, "...")?;
                            item.print(hir, out)?;
                        }
                    }
                }
                write!(out, " ]")?;
            }
            DestructurePattern::Object(properties) => {
                write!(out, "{{ ")?;
                for (index, property) in properties.iter().enumerate() {
                    if index != 0 {
                        write!(out, ", ")?;
                    }
                    match property {
                        ObjectDestructureItem::Property(property) => {
                            write!(out, "{}: ", &property.name)?;
                            property.value.print(hir, out)?;
                        }
                        ObjectDestructureItem::Spread(property) => {
                            write!(out, "...")?;
                            property.print(hir, out)?;
                        }
                    }
                }
                write!(out, " }}")?;
            }
        }
        Ok(())
    }
}

impl Print for Terminal {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        write!(out, "  {} ", self.id)?;
        self.value.print(hir, out)?;
        writeln!(out, "")?;
        Ok(())
    }
}

impl Print for TerminalValue {
    fn print(&self, hir: &HIR, out: &mut impl Write) -> Result {
        match self {
            TerminalValue::Return(terminal) => {
                write!(out, "Return ")?;
                terminal.value.print(hir, out)?;
            }
            TerminalValue::Goto(terminal) => {
                write!(out, "Goto {}", terminal.block)?;
            }
            TerminalValue::If(terminal) => {
                write!(out, "If ")?;
                terminal.test.print(hir, out)?;
                write!(
                    out,
                    " consequent={} alternate={} fallthrough={}",
                    terminal.consequent,
                    terminal.alternate,
                    match terminal.fallthrough {
                        Some(fallthrough) => format!("{fallthrough}"),
                        None => "<none>".to_string(),
                    }
                )?;
            }
            TerminalValue::Branch(terminal) => {
                write!(out, "Branch ")?;
                terminal.test.print(hir, out)?;
                write!(
                    out,
                    " consequent={} alternate={}",
                    terminal.consequent, terminal.alternate,
                )?;
            }
            TerminalValue::For(terminal) => {
                write!(
                    out,
                    "For init={} test={} update={} body={} fallthrough={}",
                    terminal.init,
                    terminal.test,
                    match terminal.update {
                        Some(update) => format!("{update}"),
                        None => "<none>".to_string(),
                    },
                    terminal.body,
                    terminal.fallthrough,
                )?;
            }
            TerminalValue::Label(terminal) => {
                write!(
                    out,
                    "Label block={} fallthrough={}",
                    terminal.block,
                    match terminal.fallthrough {
                        Some(fallthrough) => format!("{fallthrough}"),
                        None => "<none>".to_string(),
                    },
                )?;
            }
            TerminalValue::Unsupported(_) => {
                write!(out, "Unsupported")?;
            }
            _ => write!(out, "{:?}", self)?,
        }
        Ok(())
    }
}
