pub mod constant_propagation;
pub mod dead_code_elimination;
pub mod drop_manual_memoization;
pub mod inline_iifes;
pub mod merge_consecutive_blocks;
pub mod optimize_props_method_calls;
pub mod prune_maybe_throws;

pub use constant_propagation::constant_propagation;
pub use dead_code_elimination::dead_code_elimination;
pub use drop_manual_memoization::drop_manual_memoization;
pub use inline_iifes::inline_immediately_invoked_function_expressions;
pub use optimize_props_method_calls::optimize_props_method_calls;
pub use prune_maybe_throws::prune_maybe_throws;
