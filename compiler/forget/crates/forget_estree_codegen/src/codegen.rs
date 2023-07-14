use std::collections::HashSet;

use indexmap::IndexMap;
use quote::{__private::TokenStream, format_ident, quote};
use serde::{Deserialize, Serialize};
use syn::Type;

/// Returns prettyplease-formatted Rust source for estree
pub fn estree() -> String {
    let src = include_str!("./ecmascript.json");
    let grammar: Grammar = serde_json::from_str(src).unwrap();
    let raw = grammar.codegen().to_string();

    let parsed = syn::parse_file(&raw).unwrap();
    prettyplease::unparse(&parsed)
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Grammar {
    pub objects: IndexMap<String, Object>,
    pub nodes: IndexMap<String, Node>,
    pub enums: IndexMap<String, Enum>,
    pub operators: IndexMap<String, Operator>,
}

impl Grammar {
    pub fn codegen(self) -> TokenStream {
        let Self {
            objects,
            nodes,
            enums,
            operators,
        } = self;

        let objects: Vec<_> = objects
            .iter()
            .map(|(name, object)| object.codegen(name))
            .collect();
        let nodes: Vec<_> = nodes
            .iter()
            .map(|(name, node)| node.codegen(name))
            .collect();
        let enums: Vec<_> = enums
            .iter()
            .map(|(name, enum_)| enum_.codegen(name, &enums))
            .collect();
        let operators: Vec<_> = operators
            .iter()
            .map(|(name, operator)| operator.codegen(name))
            .collect();

        quote! {
            use std::num::NonZeroU32;
            use serde::{Serialize, Deserialize};
            use crate::{JsValue, Binding, SourceRange};

            #(#objects)*

            #(#nodes)*

            #(#enums)*

            #(#operators)*
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Object {
    #[serde(default)]
    pub fields: IndexMap<String, Field>,
}

impl Object {
    pub fn codegen(&self, name: &str) -> TokenStream {
        let name = format_ident!("{}", name);
        let fields: Vec<_> = self
            .fields
            .iter()
            .map(|(name, field)| field.codegen(name))
            .collect();

        quote! {
            #[derive(Serialize, Deserialize, Clone, Debug)]
            pub struct #name {
                #(#fields),*
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Node {
    #[serde(default)]
    pub fields: IndexMap<String, Field>,
}

impl Node {
    pub fn codegen(&self, name: &str) -> TokenStream {
        let name = format_ident!("{}", name);
        let fields: Vec<_> = self
            .fields
            .iter()
            .map(|(name, field)| field.codegen_node(name))
            .collect();

        quote! {
            #[derive(Serialize, Deserialize, Clone, Debug)]
            pub struct #name {
                #(#fields,)*

                #[serde(default)]
                pub loc: Option<SourceLocation>,

                #[serde(default)]
                pub range: Option<SourceRange>,
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Field {
    #[serde(rename = "type")]
    pub type_: String,

    #[serde(default)]
    pub optional: bool,

    #[serde(default)]
    pub flatten: bool,

    #[serde(default)]
    pub rename: Option<String>,

    #[serde(default)]
    pub skip: bool,
}

impl Field {
    pub fn codegen(&self, name: &str) -> TokenStream {
        let name = format_ident!("{}", name);
        let type_name: Type = syn::parse_str(&self.type_)
            .unwrap_or_else(|_| panic!("Expected a type name, got `{}`", &self.type_));

        let type_ = quote!(#type_name);
        let mut field = quote!(pub #name: #type_);
        if self.optional {
            field = quote! {
                #[serde(default)]
                #field
            }
        }
        if self.flatten {
            field = quote! {
                #[serde(flatten)]
                #field
            }
        }
        if self.skip {
            field = quote! {
                #[serde(skip)]
                #field
            }
        }
        if let Some(rename) = &self.rename {
            field = quote! {
                #[serde(rename = #rename)]
                #field
            }
        }
        field
    }

    pub fn codegen_node(&self, name: &str) -> TokenStream {
        let name = format_ident!("{}", name);
        let type_name: Type = syn::parse_str(&self.type_)
            .unwrap_or_else(|_| panic!("Expected a type name, got `{}`", &self.type_));
        let type_ = quote!(#type_name);
        let mut field = quote!(pub #name: #type_);
        if self.optional {
            field = quote! {
                #[serde(default)]
                #field
            }
        }
        if self.flatten {
            field = quote! {
                #[serde(flatten)]
                #field
            }
        }
        if self.skip {
            field = quote! {
                #[serde(skip)]
                #field
            }
        }
        if let Some(rename) = &self.rename {
            field = quote! {
                #[serde(rename = #rename)]
                #field
            }
        }
        field
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(transparent)]
#[serde(deny_unknown_fields)]
pub struct Enum {
    pub variants: Vec<String>,
}

impl Enum {
    pub fn codegen(&self, name: &str, enums: &IndexMap<String, Enum>) -> TokenStream {
        let mut sorted_variants: Vec<_> = self.variants.iter().collect();
        sorted_variants.sort();

        let name = format_ident!("{}", name);
        let variants: Vec<_> = sorted_variants
            .iter()
            .map(|name| {
                let variant = format_ident!("{}", name);
                if enums.contains_key(*name) {
                    quote!(#variant(#variant))
                } else {
                    quote!(#variant(Box<#variant>))
                }
            })
            .collect();

        let enum_ = quote! {
            pub enum #name {
                #(#variants),*
            }
        };
        let enum_ = if sorted_variants.iter().any(|name| enums.contains_key(*name)) {
            // contains recursive enum, use untagged serialization
            quote! {
                #[serde(untagged)]
                #enum_
            }
        } else {
            quote! {
                #[serde(tag = "type")]
                #enum_
            }
        };

        let enum_tag = format_ident!("__{}Tag", name);
        let mut seen = HashSet::new();

        // tag_variants is used to generate an enum of all the possible type tags (`type` values)
        // that can appear in this enum. we emit this enum and derive a deserializer for it so that
        // our enum deserializer can first decode the tag in order to know how to decode the data
        let mut tag_variants = Vec::new();

        // once the tag is decoded, we need to match against it and deserialize according the tag (`type`)
        // tag_matches are the match arms for each type.
        let mut tag_matches = Vec::new();

        // Imagine a case like:
        // enum ModuleItem {
        //   ImportDeclaration, // struct
        //   Statement // another enum
        // }
        // We need to generate matches for all the possible *concrete* `type` values, which means
        // we have to expand nested enums such as `Statement`
        for variant in self.variants.iter() {
            if let Some(nested_enum) = enums.get(variant) {
                let outer_variant = format_ident!("{}", variant);
                for variant in nested_enum.variants.iter() {
                    // Skip variants that appear in multiple nested enums, we deserialize
                    // as the first listed outer variant
                    if !seen.insert(variant.to_string()) {
                        continue;
                    }
                    // Modeling ESTree only requires a single level of nested enums,
                    // so that's all we support. Though in theory we could support arbitrary nesting,
                    // since ultimately we're matching based on the final concrete types.
                    assert!(!enums.contains_key(variant));

                    let inner_variant = format_ident!("{}", variant);
                    tag_variants.push(quote!(#inner_variant));

                    tag_matches.push(quote! {
                        #enum_tag::#inner_variant => {
                            let node: Box<#inner_variant> = <Box<#inner_variant> as Deserialize>::deserialize(
                                serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                            )?;
                            Ok(#name::#outer_variant(#outer_variant::#inner_variant(node)))
                        }
                    });
                }
            } else {
                if !seen.insert(variant.to_string()) {
                    panic!(
                        "Concrete variant {} was already added by a nested enum",
                        variant
                    );
                }
                let variant_name = format_ident!("{}", variant);
                tag_variants.push(quote!(#variant_name));

                tag_matches.push(quote! {
                    #enum_tag::#variant_name => {
                        let node: Box<#variant_name> = <Box<#variant_name> as Deserialize>::deserialize(
                            serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                        )?;
                        Ok(#name::#variant_name(node))
                    }
                })
            }
        }
        quote! {
            #[derive(Serialize, Clone, Debug)]
            #enum_

            #[derive(Deserialize, Debug)]
            enum #enum_tag {
                #(#tag_variants),*
            }

            impl <'de> serde::Deserialize<'de> for #name {
                fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
                where D: serde::Deserializer<'de> {
                    let tagged = serde::Deserializer::deserialize_any(
                        deserializer,
                        serde::__private::de::TaggedContentVisitor::<#enum_tag>::new("type", "Pattern")
                    )?;
                    match tagged.0 {
                        #(#tag_matches),*
                    }
                }
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(transparent)]
#[serde(deny_unknown_fields)]
pub struct Operator {
    pub variants: IndexMap<String, String>,
}

impl Operator {
    pub fn codegen(&self, name: &str) -> TokenStream {
        let mut sorted_variants: Vec<_> = self.variants.iter().collect();
        sorted_variants.sort();

        let name = format_ident!("{}", name);
        let variants: Vec<_> = sorted_variants
            .iter()
            .map(|(name, operator)| {
                let name = format_ident!("{}", name);
                let comment = format!(" {}", &operator);
                quote! {
                    #[doc = #comment]
                    #[serde(rename = #operator)]
                    #name
                }
            })
            .collect();

        let display_matches: Vec<_> = sorted_variants
            .iter()
            .map(|(name, operator)| {
                let name = format_ident!("{}", name);
                quote!(Self::#name => #operator)
            })
            .collect();

        let fromstr_matches: Vec<_> = sorted_variants
            .iter()
            .map(|(name, operator)| {
                let name = format_ident!("{}", name);
                quote!(#operator => Ok(Self::#name))
            })
            .collect();

        quote! {
            #[derive(Serialize, Deserialize, Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug)]
            pub enum #name {
                #(#variants),*
            }

            impl std::fmt::Display for #name {
                fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                    let name = match self {
                        #(#display_matches),*
                    };
                    f.write_str(name)
                }
            }

            impl std::str::FromStr for #name {
                type Err = ();

                fn from_str(s: &str) -> Result<Self, Self::Err> {
                    match s {
                        #(#fromstr_matches,)*
                        _ => Err(()),
                    }
                }
            }
        }
    }
}
