use std::fmt::{Result, Write};

use crate::{
    ArrayElement, BasicBlock, Function, Identifier, IdentifierOperand, Instruction,
    InstructionValue, LValue, Operand, Phi, PrimitiveValue, Terminal, TerminalValue, HIR,
};

/// Trait for HIR types to describe how they print themselves.
/// Eventually we should add a higher-level abstraction for printing to
/// handle things like indentation and maybe wrapping long lines. The
/// `pretty` crate seems to have a lot of usage but the type signatures
/// are pretty tedious, we can make something much simpler.
pub trait Print<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result;
}

impl<'a> Print<'a> for Function<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
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
        for (_, block) in self.body.blocks.iter() {
            block.print(hir, out)?;
        }
        Ok(())
    }
}

impl<'a> Print<'a> for BasicBlock<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
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
            let instr = &hir.instructions[usize::from(*ix)];
            write!(out, "  {} {} = ", instr.id, ix)?;
            instr.value.print(hir, out)?;
            writeln!(out, "")?;
        }
        self.terminal.print(hir, out)?;
        Ok(())
    }
}

impl<'a> Print<'a> for Phi<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
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

impl<'a> Print<'a> for Instruction<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
        write!(out, "  {} ", self.id)?;
        self.value.print(hir, out)?;
        writeln!(out, "")?;
        Ok(())
    }
}

impl<'a> Print<'a> for InstructionValue<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
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
                    PrimitiveValue::Boolean(value) => write!(out, "{}", value)?,
                    PrimitiveValue::Null => write!(out, "null")?,
                    PrimitiveValue::Number(value) => write!(out, "{}", f64::from(*value))?,

                    // TODO: quote the string itself (JS version uses JSON.stringify())
                    PrimitiveValue::String(value) => write!(out, "\"{}\"", value.as_str())?,

                    PrimitiveValue::Undefined => write!(out, "<undefined>")?,
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
            _ => write!(out, "{:?}", self)?,
        }
        Ok(())
    }
}

impl<'a> Print<'a> for ArrayElement {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
        match self {
            ArrayElement::Place(place) => place.print(hir, out),
            ArrayElement::Spread(place) => {
                write!(out, "...")?;
                place.print(hir, out)?;
                Ok(())
            }
        }
    }
}

impl<'a> Print<'a> for Operand {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
        write!(
            out,
            "{} {}",
            match self.effect {
                Some(effect) => format!("{}", effect),
                None => "unknown".to_string(),
            },
            self.ix
        )
    }
}

impl<'a> Print<'a> for LValue<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
        write!(out, "{} ", self.kind)?;
        self.identifier.print(hir, out)
    }
}

impl<'a> Print<'a> for IdentifierOperand<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
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

impl<'a> Print<'a> for Identifier<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
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

impl<'a> Print<'a> for Terminal<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
        write!(out, "  {} ", self.id)?;
        self.value.print(hir, out)?;
        writeln!(out, "")?;
        Ok(())
    }
}

impl<'a> Print<'a> for TerminalValue<'a> {
    fn print(&self, hir: &HIR<'a>, out: &mut impl Write) -> Result {
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
                        Some(fallthrough) => format!("{fallthrough}"),
                        None => "<none>".to_string(),
                    },
                    terminal.body,
                    terminal.fallthrough,
                )?;
            }
            _ => write!(out, "{:?}", self)?,
        }
        Ok(())
    }
}
