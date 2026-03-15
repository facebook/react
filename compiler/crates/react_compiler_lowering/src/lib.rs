pub mod build_hir;
pub mod hir_builder;

// The main lower() function - delegates to build_hir
pub use build_hir::lower;
