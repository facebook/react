use forget_hir::{IdentifierOperand, Instruction, InstructionId, ReactiveScope};

#[derive(Debug)]
pub struct ReactiveFunction {
    pub id: Option<String>,
    pub body: Block,
    pub params: Vec<IdentifierOperand>,
    pub is_async: bool,
    pub is_generator: bool,
}

#[derive(Debug)]
pub struct Block {
    pub statements: Vec<ReactiveStatement>,
}

#[derive(Debug)]
pub enum ReactiveStatement {
    Instruction(Instruction),
    ControlFlow(ControlFlow),
    ReactiveBlock(ReactiveBlock),
}

#[derive(Debug)]
pub struct ReactiveBlock {
    pub scope: ReactiveScope,
    pub block: Block,
}

#[derive(Debug)]
pub struct ControlFlow {
    pub id: InstructionId,
    pub value: ControlFlowValue,
}

#[derive(Debug)]
pub enum ControlFlowValue {
    // Logical(LogicalInstruction),
    // Sequence(SequenceInstruction),
    // Ternary(TernaryInstruction),
    // Optional(OptionalInstruction),
    // Break(BreakInstruction),
    // Continue(ContinueInstruction),
    Return(ReturnInstruction),
    // Throw(ThrowInstruction),
    // Switch(SwitchInstruction),
    // DoWhile(DoWhileInstruction),
    // While(WhileInstruction),
    // For(ForInstruction),
    // ForOf(ForOfInstruction),
    If(IfInstruction),
    // Label(LabelInstruction),
}

#[derive(Debug)]
pub struct ReturnInstruction {
    pub value: IdentifierOperand,
}

#[derive(Debug)]
pub struct IfInstruction {
    pub test: IdentifierOperand,
    pub consequent: Block,
    pub alternate: Option<Block>,
}
