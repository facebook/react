mod binding;
mod generated;
mod generated_extensions;
mod js_value;
mod range;

pub use binding::{Binding, BindingId};
pub use generated::*;
pub use js_value::JsValue;
pub use range::SourceRange;

#[cfg(test)]
mod tests {
    use super::*;
    use insta::{assert_snapshot, glob};
    use serde_json;

    #[test]
    fn fixtures() {
        glob!("fixtures/**.json", |path| {
            println!("{:?}", path);
            let input = std::fs::read_to_string(path).unwrap();
            let ast: Program = serde_json::from_str(&input).unwrap();
            let serialized = serde_json::to_string_pretty(&ast).unwrap();
            assert_snapshot!(format!("Input:\n{input}\n\nOutput:\n{serialized}"));
        });
    }
}
