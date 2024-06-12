/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

mod basic_block;
mod environment;
mod features;
mod function;
mod id_types;
mod initialize;
mod inline_use_memo;
mod instruction;
mod merge_consecutive_blocks;
mod print;
mod registry;
mod terminal;
mod types;

pub use basic_block::*;
pub use environment::*;
pub use features::*;
pub use function::*;
pub use id_types::*;
pub use initialize::{
    initialize_hir, mark_instruction_ids, mark_predecessors,
    remove_unreachable_do_while_statements, remove_unreachable_fallthroughs,
    remove_unreachable_for_updates, reverse_postorder_blocks,
};
pub use inline_use_memo::inline_use_memo;
pub use instruction::*;
pub use merge_consecutive_blocks::merge_consecutive_blocks;
pub use print::Print;
pub use registry::Registry;
pub use terminal::*;
pub use types::*;
