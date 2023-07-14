mod diagnostic;

pub use diagnostic::*;

/// Returns Ok(()) if the condition is true, otherwise returns Err()
/// with the diagnostic produced by the provided callback
pub fn invariant<F>(cond: bool, f: F) -> Result<(), Diagnostic>
where
    F: Fn() -> Diagnostic,
{
    if cond {
        Ok(())
    } else {
        Err(f())
    }
}
