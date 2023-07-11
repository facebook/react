use std::fmt::{Result, Write};

use crate::{
    ArrayElement, BasicBlock, Function, Instruction, InstructionValue, LValue, Place,
    PrimitiveValue, Terminal, TerminalValue,
};

/// Trait for HIR types to describe how they print themselves.
/// Eventually we should add a higher-level abstraction for printing to
/// handle things like indentation and maybe wrapping long lines. The
/// `pretty` crate seems to have a lot of usage but the type signatures
/// are pretty tedious, we can make something much simpler.
pub trait Print {
    fn print(&self, out: &mut impl Write) -> Result;
}

impl<'a> Print for Function<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        writeln!(out, "entry {}", self.body.entry)?;
        for block in self.body.blocks.values() {
            block.print(out)?;
        }
        Ok(())
    }
}

impl<'a> Print for BasicBlock<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        writeln!(out, "{}", self.id)?;
        for instr in &self.instructions {
            instr.print(out)?;
        }
        self.terminal.print(out)?;
        Ok(())
    }
}

impl<'a> Print for Instruction<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        write!(out, "  {} ", self.id)?;
        self.lvalue.print(out)?;
        write!(out, " = ")?;
        self.value.print(out)?;
        writeln!(out, "")?;
        Ok(())
    }
}

impl<'a> Print for InstructionValue<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        match self {
            InstructionValue::Array(value) => {
                write!(out, "Array [")?;
                for (ix, item) in value.elements.iter().enumerate() {
                    if ix != 0 {
                        write!(out, ", ")?;
                    }
                    if let Some(item) = item {
                        item.print(out)?;
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
                value.place.print(out)?;
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
                value.lvalue.print(out)?;
                write!(out, " = ")?;
                value.value.print(out)?;
            }
            InstructionValue::DeclareLocal(value) => {
                write!(out, "DeclareLocal ")?;
                value.lvalue.print(out)?;
            }
            InstructionValue::Binary(value) => {
                write!(out, "Binary ")?;
                value.left.print(out)?;
                write!(out, " {} ", value.operator)?;
                value.right.print(out)?;
            }
            _ => write!(out, "{:?}", self)?,
        }
        Ok(())
    }
}

impl<'a> Print for ArrayElement<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        match self {
            ArrayElement::Place(place) => place.print(out),
            ArrayElement::Spread(place) => {
                write!(out, "...")?;
                place.print(out)?;
                Ok(())
            }
        }
    }
}

impl<'a> Print for Place<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        write!(
            out,
            "{} {}{}",
            match self.effect {
                Some(effect) => format!("{}", effect),
                None => "unknown".to_string(),
            },
            match &self.identifier.name {
                Some(name) => name.to_string(),
                None => "".to_string(),
            },
            self.identifier.id
        )
    }
}

impl<'a> Print for LValue<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        write!(out, "{} ", self.kind)?;
        self.place.print(out)
    }
}

impl<'a> Print for Terminal<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        write!(out, "  {} ", self.id)?;
        self.value.print(out)?;
        writeln!(out, "")?;
        Ok(())
    }
}

impl<'a> Print for TerminalValue<'a> {
    fn print(&self, out: &mut impl Write) -> Result {
        match self {
            TerminalValue::Return(terminal) => {
                write!(out, "Return ")?;
                terminal.value.print(out)?;
            }
            TerminalValue::Goto(terminal) => {
                write!(out, "Goto {}", terminal.block)?;
            }
            TerminalValue::If(terminal) => {
                write!(out, "If ")?;
                terminal.test.print(out)?;
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
                terminal.test.print(out)?;
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
