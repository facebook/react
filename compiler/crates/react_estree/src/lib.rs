/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

mod binding;
mod generated;
mod generated_extensions;
mod js_value;
mod range;
mod visit;

pub use binding::{Binding, BindingId};
pub use generated::*;
pub use generated_extensions::*;
pub use js_value::{JsValue, Number};
pub use range::SourceRange;
pub use visit::*;

#[cfg(test)]
mod tests {
    use insta::{assert_snapshot, glob};

    use super::*;

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
