use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub enum Binding {
    Global,
    Module(BindingId),
    Local(BindingId),
}

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct BindingId(u32);

impl BindingId {
    pub fn new(value: u32) -> Self {
        Self(value)
    }
}

impl From<BindingId> for u32 {
    fn from(value: BindingId) -> Self {
        value.0
    }
}
