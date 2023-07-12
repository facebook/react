mod build;
mod builder;
mod error;

pub use build::build;
pub use builder::{
    initialize_hir, mark_instruction_ids, mark_predecessors,
    remove_unreachable_do_while_statements, remove_unreachable_fallthroughs,
    remove_unreachable_for_updates, reverse_postorder_blocks,
};
pub use error::*;
