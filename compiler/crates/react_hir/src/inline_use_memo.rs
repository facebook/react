/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use react_diagnostics::Diagnostic;

use crate::{
    initialize_hir, BasicBlock, BlockRewriter, BlockRewriterAction, DeclareLocal, Environment,
    Function, GotoKind, GotoTerminal, Identifier, IdentifierData, IdentifierId, IdentifierOperand,
    InstrIx, Instruction, InstructionKind, InstructionValue, LValue, LabelTerminal, LoadLocal,
    MutableRange, PlaceOrSpread, ReturnTerminal, StoreLocal, Terminal, TerminalValue, Type,
};

/// Inlines `useMemo()` calls, rewriting so that the lambda body becomes part of the
/// outer block's instructions. To account for complex control flow, the inlining works
/// as follows:
/// * First, block ids are guaranteed to be unique for all blocks within a function and
///   its recursive function expressions. Thus, the function expression's blocks can be
///   directly moved into the outer function's `blocks` map.
/// * To account for complex control flow, we create a "label" terminal just prior to
///   the useMemo call, with the useMemo function's entry block as the body of the
///   label terminal. The code following the useMemo call becomes the fallthrough.
///   All returns within the useMemo are translated to instead:
///   * Assign to a temporary identifier representing the useMemo result
///   * Break to the label's fallthrough.
///
/// ## Example
///
/// Input:
/// ```javascript
/// foo();
/// const x = useMemo(() => {
///   if (a) {
///     return b;
///   }
///   return c;
/// })
/// x;
/// ```
///
/// HIR after translation:
/// ```hir
/// bb0:
///   [ 1] #1 = LoadLocal 'foo'
///   [ 2] #2 = Call #1()
///   // label to allow substituting return -> goto in the lambda body
///   [ 3] Label body=bb1 fallthrough=bb4
/// bb1:
///   [ 4] #3 = LoadLocal 'a'
///   [ 5] If test=#3 consequent=bb2 alternate=bb3
/// bb2:
///   [ 6] #4 = LoadLocal 'b'
///   [ 7] StoreLocal '<tmp>', #4
///   [ 8] Goto bb4
/// bb3:
///   [ 9] #5 = LoadLocal 'c'
///   [10] StoreLocal '<tmp>' #5
///   [11] Goto bb4
/// bb4:
///    // code after the useMemo. save the temporary
///   [12] #6 = LoadLocal '<tmp>'
///   [13] StoreLocal 'x', #6
/// ```
///
pub fn inline_use_memo(env: &Environment, fun: &mut Function) -> Result<(), Diagnostic> {
    let mut use_memo_globals: HashSet<IdentifierId> = Default::default();
    let mut functions: HashMap<IdentifierId, InstrIx> = Default::default();

    let blocks = &mut fun.body.blocks;
    let instructions = &mut fun.body.instructions;
    let mut rewriter = BlockRewriter::new(blocks, fun.body.entry);

    let mut inlined = Vec::new();

    rewriter.try_each_block(|mut block, rewriter| {
        for (i, instr_ix) in block.instructions.iter().cloned().enumerate() {
            let instr = &mut instructions[usize::from(instr_ix)];
            match &mut instr.value {
                InstructionValue::LoadGlobal(value) => {
                    if value.name.as_str() == "useMemo" {
                        use_memo_globals.insert(instr.lvalue.identifier.id);
                    }
                }
                InstructionValue::Function(_) => {
                    functions.insert(instr.lvalue.identifier.id, instr_ix);
                }
                InstructionValue::Call(value) => {
                    if !use_memo_globals.contains(&value.callee.identifier.id) {
                        continue;
                    }
                    // Skip useMemo calls where the argument is a spread element
                    let lambda_id = match &value.arguments.get(0) {
                        Some(PlaceOrSpread::Place(place)) => place.identifier.id,
                        _ => continue,
                    };
                    let lambda_ix = match functions.get(&lambda_id) {
                        Some(ix) => *ix,
                        // Skip useMemo calls where the argument is not a function expression
                        _ => continue,
                    };
                    let instr_id = instr.id;

                    // Create a temporary variable to store the useMemo result into
                    let temporary_id = env.next_identifier_id();
                    let temporary = Identifier {
                        id: temporary_id,
                        // NOTE: for memoization to work correctly this variable has to be named
                        name: Some("t".to_string()),
                        data: Rc::new(RefCell::new(IdentifierData {
                            mutable_range: MutableRange::new(),
                            scope: None,
                            type_: Type::Var(env.next_type_var_id()),
                        })),
                    };
                    // Replace the call with a load of the temporary
                    // this is convenient since consumers of the useMemo call
                    // already point to this instruction id, so by reusing the
                    // instruction we don't have to update the consumer(s) to
                    // look at a different instruction
                    instr.value = InstructionValue::LoadLocal(LoadLocal {
                        place: IdentifierOperand {
                            identifier: temporary.clone(),
                            effect: None,
                        },
                    });

                    // Move the function expression out of its instruction so that we own
                    // the value and can modify and inline its contents into the outer
                    // function. We replace with a tombstone value that we can filter out later
                    let lambda = std::mem::replace(
                        &mut instructions[usize::from(lambda_ix)].value,
                        InstructionValue::Tombstone,
                    );
                    let mut lambda = if let InstructionValue::Function(lambda) = lambda {
                        lambda
                    } else {
                        unreachable!("Must be a function, checked above")
                    };

                    // Additional validation
                    // TODO: this should be part of a separate validation pass
                    if !lambda.lowered_function.params.is_empty() {
                        return Err(Diagnostic::invalid_react(
                            "useMemo callbacks may not accept any arguments",
                            None,
                        ));
                    }
                    if lambda.lowered_function.is_async || lambda.lowered_function.is_generator {
                        return Err(Diagnostic::invalid_react(
                            "useMemo callbacks may not be async or generator functions",
                            None,
                        ));
                    }

                    // Set aside a BlockId for the code that follows the useMemo call
                    let continuation_block_id = env.next_block_id();

                    // Rewrite the body of the lambda to replace any return terminals
                    // with an assignment to the useMemo temporary followed by a break
                    // to the continuation block
                    for block in lambda.lowered_function.body.blocks.iter_mut() {
                        if let TerminalValue::Return(ReturnTerminal { value }) =
                            &mut block.terminal.value
                        {
                            let store_ix = InstrIx::new(
                                lambda.lowered_function.body.instructions.len() as u32,
                            );
                            lambda.lowered_function.body.instructions.push(Instruction {
                                id: instr_id,
                                lvalue: IdentifierOperand {
                                    identifier: env.new_temporary(),
                                    effect: None,
                                },
                                value: InstructionValue::StoreLocal(StoreLocal {
                                    lvalue: LValue {
                                        identifier: IdentifierOperand {
                                            identifier: temporary.clone(),
                                            effect: None,
                                        },
                                        kind: InstructionKind::Reassign,
                                    },
                                    value: value.clone(),
                                }),
                            });
                            block.instructions.push(store_ix);
                            block.terminal.value = TerminalValue::Goto(GotoTerminal {
                                block: continuation_block_id,
                                kind: GotoKind::Break,
                            });
                        }
                    }

                    // Extract the block's original terminal, which we will move to the
                    // continuation block. Replace it with a label terminal, necessary to
                    // allow the goto statements to have a target.
                    let terminal_id = block.terminal.id;
                    let terminal = std::mem::replace(
                        &mut block.terminal,
                        Terminal {
                            id: terminal_id,
                            value: TerminalValue::Label(LabelTerminal {
                                block: lambda.lowered_function.body.entry,
                                fallthrough: Some(continuation_block_id),
                            }),
                        },
                    );

                    // Extract the instructions for the continuation block
                    let continuation_instructions = block.instructions.split_off(i);

                    // Declare the temporary variable at the end of the block preceding
                    // the useMemo invocation
                    let declare_ix = InstrIx::new(instructions.len() as u32);
                    instructions.push(Instruction {
                        id: instr_id,
                        lvalue: IdentifierOperand {
                            identifier: env.new_temporary(),
                            effect: None,
                        },
                        value: InstructionValue::DeclareLocal(DeclareLocal {
                            lvalue: LValue {
                                identifier: IdentifierOperand {
                                    identifier: temporary.clone(),
                                    effect: None,
                                },
                                kind: InstructionKind::Let,
                            },
                        }),
                    });
                    block.instructions.push(declare_ix);

                    // Add the continuation block
                    let continuation_block = Box::new(BasicBlock {
                        id: continuation_block_id,
                        instructions: continuation_instructions,
                        kind: block.kind,
                        phis: Default::default(),
                        predecessors: Default::default(),
                        terminal,
                    });
                    rewriter.add_block(continuation_block);

                    inlined.push(lambda);
                    break;
                }
                _ => {}
            }
        }
        Ok(BlockRewriterAction::Keep(block))
    })?;

    if !inlined.is_empty() {
        for lambda in inlined {
            fun.body.inline(lambda);
        }
        initialize_hir(&mut fun.body)?;
    }

    Ok(())
}
