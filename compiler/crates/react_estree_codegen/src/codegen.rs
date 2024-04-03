/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::collections::HashSet;

use indexmap::IndexMap;
use quote::__private::TokenStream;
use quote::{format_ident, quote};
use serde::{Deserialize, Serialize};
use syn::Type;

/// Returns prettyplease-formatted Rust source for estree
pub fn estree() -> String {
    let src = include_str!("./ecmascript.json");
    let grammar: Grammar = serde_json::from_str(src).unwrap();
    let raw = grammar.codegen().to_string();

    let parsed = syn::parse_file(&raw).unwrap();
    format!(
        "// {}generated\n#![cfg_attr(rustfmt, rustfmt_skip)]\n{}",
        '\u{0040}',
        prettyplease::unparse(&parsed)
    )
}

/// Returns prettyplease-formatted Rust source for converting HermesParser results
/// into estree
pub fn estree_hermes() -> String {
    let src = include_str!("./ecmascript.json");
    let grammar: Grammar = serde_json::from_str(src).unwrap();
    let raw = grammar.codegen_hermes().to_string();

    let parsed = syn::parse_file(&raw).unwrap();
    format!(
        "// {}generated\n#![cfg_attr(rustfmt, rustfmt_skip)]\n{}",
        '\u{0040}',
        prettyplease::unparse(&parsed)
    )
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
        let object_defs: Vec<_> = self
            .objects
            .iter()
            .map(|(name, object)| object.codegen(name))
            .collect();
        let object_visitors: Vec<_> = self
            .objects
            .iter()
            .filter_map(|(name, object)| {
                if object.visitor {
                    Some(object.codegen_visitor(name, &self))
                } else {
                    None
                }
            })
            .collect();
        let node_defs: Vec<_> = self
            .nodes
            .iter()
            .map(|(name, node)| node.codegen(name))
            .collect();
        let node_visitors: Vec<_> = self
            .nodes
            .iter()
            .map(|(name, node)| node.codegen_visitor(name, &self))
            .collect();
        let enum_defs: Vec<_> = self
            .enums
            .iter()
            .map(|(name, enum_)| enum_.codegen(name, &self.enums))
            .collect();
        let enum_visitors: Vec<_> = self
            .enums
            .iter()
            .map(|(name, enum_)| enum_.codegen_visitor(name))
            .collect();
        let operator_defs: Vec<_> = self
            .operators
            .iter()
            .map(|(name, operator)| operator.codegen(name))
            .collect();

        quote! {
            #![allow(dead_code)]
            #![allow(unused_variables)]
            #![allow(non_snake_case)]
            #![allow(clippy::enum_variant_names)]

            use std::num::NonZeroU32;
            use serde::ser::{Serializer, SerializeMap};
            use serde::{Serialize,Deserialize};
            use crate::{JsValue, Binding, SourceRange, Number, ESTreeNode};

            #(#object_defs)*

            #(#node_defs)*

            #(#enum_defs)*

            #(#operator_defs)*

            pub trait Visitor {
                #(#object_visitors)*

                #(#node_visitors)*

                #(#enum_visitors)*
            }
        }
    }

    pub fn codegen_hermes(self) -> TokenStream {
        let nodes: Vec<_> = self
            .nodes
            .iter()
            .filter(|(_, node)| !node.skip_hermes_codegen)
            .map(|(name, node)| node.codegen_hermes(name))
            .collect();
        let enums: Vec<_> = self
            .enums
            .iter()
            .map(|(name, enum_)| enum_.codegen_hermes(name, &self))
            .collect();
        let operators: Vec<_> = self
            .operators
            .iter()
            .map(|(name, operator)| operator.codegen_hermes(name))
            .collect();

        quote! {
            #![allow(dead_code)]
            #![allow(unused_variables)]
            #![allow(clippy::enum_variant_names)]

            use react_estree::*;
            use hermes::parser::{NodePtr, NodeKind, NodeLabel };
            use hermes::utf::{utf8_with_surrogates_to_string};
            use crate::generated_extension::*;

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

    #[serde(default)]
    pub visitor: bool,
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
            #[serde(deny_unknown_fields)]
            pub struct #name {
                #(#fields),*
            }
        }
    }

    pub fn codegen_visitor(&self, name: &str, grammar: &Grammar) -> TokenStream {
        let visitor_name = format_ident!("visit_{}", to_lower_snake_case(name));
        let name = format_ident!("{}", name);
        let field_visitors: Vec<_> = self
            .fields
            .iter()
            .filter_map(|(name, field)| {
                let (type_name_str, type_kind) = parse_type(&field.type_).unwrap();
                if !grammar.nodes.contains_key(&type_name_str)
                    && !grammar.enums.contains_key(&type_name_str)
                {
                    return None;
                }
                let visitor_name = format_ident!("visit_{}", to_lower_snake_case(&type_name_str));
                let field_name = format_ident!("{}", name);
                Some(match type_kind {
                    TypeKind::Named => {
                        quote! {
                            self.#visitor_name(&ast.#field_name);
                        }
                    }
                    TypeKind::Option => {
                        quote! {
                            if let Some(#field_name) = &ast.#field_name {
                                self.#visitor_name(#field_name);
                            }
                        }
                    }
                    TypeKind::Vec => {
                        quote! {
                            for #field_name in &ast.#field_name {
                                self.#visitor_name(#field_name);
                            }
                        }
                    }
                    TypeKind::VecOfOption => {
                        quote! {
                            for #field_name in &ast.#field_name {
                                if let Some(#field_name) = #field_name {
                                    self.#visitor_name(#field_name);
                                }
                            }
                        }
                    }
                })
            })
            .collect();
        quote! {
            fn #visitor_name(&mut self, ast: &#name) {
                #(#field_visitors)*
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Node {
    #[serde(default)]
    #[serde(rename = "type")]
    pub type_: Option<String>,

    #[serde(default)]
    pub fields: IndexMap<String, Field>,

    #[serde(default)]
    pub skip_hermes_codegen: bool,

    #[serde(default)]
    pub skip_hermes_enum_variant: bool,

    #[serde(default)]
    #[serde(rename = "TODO")]
    pub todo: Option<String>,
}

impl Node {
    pub fn codegen(&self, name: &str) -> TokenStream {
        let name_str = name;
        let name = format_ident!("{}", name);
        let fields: Vec<_> = self
            .fields
            .iter()
            .map(|(name, field)| field.codegen_node(name))
            .collect();

        let type_serializer = if let Some(type_) = &self.type_ {
            quote! {
                state.serialize_entry("type", #type_)?;
            }
        } else {
            quote! {
                state.serialize_entry("type", #name_str)?;
            }
        };

        let mut field_serializers = Vec::with_capacity(self.fields.len()); // type, loc, range
        for (field_name_str, field) in &self.fields {
            if field.skip {
                continue;
            }
            let field_name = format_ident!("{}", field_name_str);
            let serialized_field_name = field.rename.as_ref().unwrap_or(field_name_str);
            let serializer = if field.flatten {
                quote! {
                    Serialize::serialize(&self.#field_name, serde::__private::ser::FlatMapSerializer(&mut state))?;
                }
            } else {
                quote! {
                    state.serialize_entry(#serialized_field_name, &self.#field_name)?;
                }
            };
            field_serializers.push(serializer);
        }

        quote! {
            #[derive(Deserialize, Clone, Debug)]
            pub struct #name {
                #(#fields,)*

                #[serde(default)]
                pub loc: Option<SourceLocation>,

                #[serde(default)]
                pub range: Option<SourceRange>,
            }

            impl ESTreeNode for #name {}

            impl Serialize for #name {
                fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
                where
                    S: Serializer,
                {
                    let mut state = serializer.serialize_map(None)?;
                    #type_serializer
                    #(#field_serializers)*
                    state.serialize_entry("loc", &self.loc)?;
                    state.serialize_entry("range", &self.range)?;
                    state.end()
                }
            }
        }
    }

    pub fn codegen_visitor(&self, name: &str, grammar: &Grammar) -> TokenStream {
        let visitor_name = format_ident!("visit_{}", to_lower_snake_case(name));
        let name = format_ident!("{}", name);
        let field_visitors: Vec<_> = self
            .fields
            .iter()
            .filter_map(|(name, field)| {
                let (type_name_str, type_kind) = parse_type(&field.type_).unwrap();
                if (!grammar.objects.contains_key(&type_name_str)
                    || !grammar.objects.get(&type_name_str).unwrap().visitor)
                    && !grammar.nodes.contains_key(&type_name_str)
                    && !grammar.enums.contains_key(&type_name_str)
                {
                    return None;
                }
                let visitor_name = format_ident!("visit_{}", to_lower_snake_case(&type_name_str));
                let field_name = format_ident!("{}", name);
                Some(match type_kind {
                    TypeKind::Named => {
                        quote! {
                            self.#visitor_name(&ast.#field_name);
                        }
                    }
                    TypeKind::Option => {
                        quote! {
                            if let Some(#field_name) = &ast.#field_name {
                                self.#visitor_name(#field_name);
                            }
                        }
                    }
                    TypeKind::Vec => {
                        quote! {
                            for #field_name in &ast.#field_name {
                                self.#visitor_name(#field_name);
                            }
                        }
                    }
                    TypeKind::VecOfOption => {
                        quote! {
                            for #field_name in &ast.#field_name {
                                if let Some(#field_name) = #field_name {
                                    self.#visitor_name(#field_name);
                                }
                            }
                        }
                    }
                })
            })
            .collect();
        quote! {
            fn #visitor_name(&mut self, ast: &#name) {
                #(#field_visitors)*
            }
        }
    }

    pub fn codegen_hermes(&self, name: &str) -> TokenStream {
        let name_str = name;
        let name = format_ident!("{}", name);
        let field_names: Vec<_> = self
            .fields
            .iter()
            .map(|(name, _field)| format_ident!("{}", name))
            .collect();
        let fields: Vec<_> = self
            .fields
            .iter()
            .map(|(name, field)| {
                let (type_name_str, type_kind) = parse_type(&field.type_).unwrap();
                let camelcase_name = field.rename.as_ref().unwrap_or(name);
                let field_name = format_ident!("{}", name);
                let helper = format_ident!("hermes_get_{}_{}", name_str, camelcase_name);
                let type_name = format_ident!("{}", type_name_str);
                if field.skip || field.hermes_default {
                    return quote! {
                        let #field_name = Default::default();
                    };
                }
                if let Some(convert_with) = &field.hermes_convert_with {
                    let convert_with = format_ident!("{}", convert_with);
                    return quote! {
                        let #field_name = #convert_with(cx, unsafe { hermes::parser::#helper(node) } );
                    }
                }
                match type_kind {
                    TypeKind::Named => {
                        match type_name_str.as_ref() {
                            "bool" => {
                                quote! {
                                    let #field_name = unsafe { hermes::parser::#helper(node) };
                                }
                            }
                            "Number" => {
                                quote! {
                                    let #field_name = convert_number(unsafe { hermes::parser::#helper(node) });
                                }
                            }
                            "String" => {
                                quote! {
                                    let #field_name = convert_string(cx, unsafe { hermes::parser::#helper(node) });
                                }
                            }
                            _ => {
                                quote! {
                                    let #field_name = #type_name::convert(cx, unsafe { hermes::parser::#helper(node) });
                                }
                            }
                        }
                    }
                    TypeKind::Option => {
                        match type_name_str.as_ref() {
                            "String" => {
                                quote! {
                                    let #field_name = convert_option_string(cx, unsafe { hermes::parser::#helper(node) });
                                }
                            }
                            _ => {
                                quote! {
                                    let #field_name = convert_option(unsafe { hermes::parser::#helper(node) }, |node| #type_name::convert(cx, node));
                                }
                            }
                        }
                    }
                    TypeKind::Vec => {
                        quote! {
                            let #field_name = convert_vec(unsafe { hermes::parser::#helper(node) }, |node| #type_name::convert(cx, node));
                        }
                    }
                    TypeKind::VecOfOption => {
                        quote! {
                            let #field_name = convert_vec_of_option(unsafe { hermes::parser::#helper(node) }, |node| #type_name::convert(cx, node));
                        }
                    }
                }
            })
            .collect();

        let type_ = format_ident!("{}", self.type_.as_ref().unwrap_or(&name_str.to_string()));
        quote! {
            impl FromHermes for #name {
                fn convert(cx: &mut Context, node: NodePtr) -> Self {
                    let node_ref = node.as_ref();
                    assert_eq!(node_ref.kind, NodeKind::#type_);
                    let range = convert_range(cx, node);
                    #(#fields)*
                    Self {
                        #(#field_names,)*
                        loc: None,
                        range: Some(range),
                    }
                }
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Field {
    // TODO: deserialize with `parse_type` into a custom type
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

    #[serde(default)]
    #[serde(rename = "TODO")]
    pub todo: Option<String>,

    #[serde(default)]
    pub hermes_convert_with: Option<String>,

    #[serde(default)]
    pub hermes_default: bool,
}

impl Field {
    pub fn codegen(&self, name: &str) -> TokenStream {
        let name = format_ident!("{}", name);
        parse_type(&self.type_).unwrap();
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
        parse_type(&self.type_).unwrap();
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

        let name_str = name;
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
            #[serde(untagged)]
            pub enum #name {
                #(#variants),*
            }

            #[derive(Deserialize, Debug)]
            enum #enum_tag {
                #(#tag_variants),*
            }

            impl <'de> serde::Deserialize<'de> for #name {
                fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
                where D: serde::Deserializer<'de> {
                    let tagged = serde::Deserializer::deserialize_any(
                        deserializer,
                        serde::__private::de::TaggedContentVisitor::<#enum_tag>::new("type", #name_str)
                    )?;
                    match tagged.0 {
                        #(#tag_matches),*
                    }
                }
            }
        }
    }

    pub fn codegen_visitor(&self, name: &str) -> TokenStream {
        let visitor_name = format_ident!("visit_{}", to_lower_snake_case(name));
        let name = format_ident!("{}", name);
        let mut tag_matches = Vec::new();

        for variant in self.variants.iter() {
            let node_variant = format_ident!("{}", variant);
            let visitor_name = format_ident!("visit_{}", to_lower_snake_case(variant));

            tag_matches.push(quote! {
                #name::#node_variant(ast) => {
                    self.#visitor_name(ast);
                }
            })
        }
        quote! {
            fn #visitor_name(&mut self, ast: &#name) {
                match ast {
                    #(#tag_matches),*
                }
            }
        }
    }

    pub fn codegen_hermes(&self, name: &str, grammar: &Grammar) -> TokenStream {
        let name_str = name;
        let name = format_ident!("{}", name);

        let mut tag_matches = Vec::new();
        let mut seen = HashSet::new();

        // Imagine a case like:
        // enum ModuleItem {
        //   ImportDeclaration, // struct
        //   Statement // another enum
        // }
        // We need to generate matches for all the possible *concrete* `type` values, which means
        // we have to expand nested enums such as `Statement`
        for variant in self.variants.iter() {
            if let Some(nested_enum) = grammar.enums.get(variant) {
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
                    assert!(!grammar.enums.contains_key(variant));
                    let node = grammar.nodes.get(variant).unwrap();
                    if node.skip_hermes_enum_variant {
                        continue;
                    }

                    let inner_variant = format_ident!("{}", variant);
                    let node_variant_name = node.type_.as_ref().unwrap_or(variant);
                    let node_variant = format_ident!("{}", node_variant_name);

                    tag_matches.push(quote! {
                        NodeKind::#node_variant => {
                            let node = #inner_variant::convert(cx, node);
                            #name::#outer_variant(#outer_variant::#inner_variant(Box::new(node)))
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
                let node = grammar.nodes.get(variant).unwrap();
                if node.skip_hermes_enum_variant {
                    continue;
                }

                let node_variant_name = node.type_.as_ref().unwrap_or(variant);
                let node_variant = format_ident!("{}", node_variant_name);

                tag_matches.push(quote! {
                    NodeKind::#node_variant => {
                        let node = #variant_name::convert(cx, node);
                        #name::#variant_name(Box::new(node))
                    }
                })
            }
        }

        quote! {
            impl FromHermes for #name {
                fn convert(cx: &mut Context, node: NodePtr) -> Self {
                    let node_ref = node.as_ref();
                    match node_ref.kind {
                        #(#tag_matches),*
                        _ => panic!("Unexpected node kind `{:?}` for `{}`", node_ref.kind, #name_str)
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

    pub fn codegen_hermes(&self, name: &str) -> TokenStream {
        let mut sorted_variants: Vec<_> = self.variants.iter().collect();
        sorted_variants.sort();

        let name = format_ident!("{}", name);

        quote! {
            impl FromHermesLabel for #name {
                fn convert(cx: &mut Context, label: NodeLabel) -> Self {
                    let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
                    utf_str.parse().unwrap()
                }
            }
        }
    }
}

enum TypeKind {
    /// T
    Named,

    /// Option<T>
    Option,

    /// Vec<T>
    Vec,

    /// Vec<Option<T>>
    VecOfOption,
}

/// Parses a given type into the underlying type name plus a descriptor of the
/// kind of type. Only a subset of Rust types are supported:
/// - T
/// - Option<T>
/// - Vec<T>
/// - Vec<Option<T>>
fn parse_type(type_: &str) -> Result<(String, TypeKind), String> {
    let mut current = type_;
    let mut is_list = false;
    let mut is_option = false;
    if current.starts_with("Vec<") {
        current = &current[4..current.len() - 1];
        is_list = true;
    }
    if current.starts_with("Option<") {
        current = &current[7..current.len() - 1];
        is_option = true;
    }
    if current.contains('<') {
        Err(format!(
            "Unsupported type `{current}` expected named type (`Identifier`), optional type (`Option<Identifier>`), list type (`Vec<Identifier>`), or optional list (`Vec<Option<Identifier>>`)"
        ))
    } else {
        let kind = match (is_list, is_option) {
            (true, true) => TypeKind::VecOfOption,
            (true, false) => TypeKind::Vec,
            (false, true) => TypeKind::Option,
            (false, false) => TypeKind::Named,
        };
        Ok((current.to_string(), kind))
    }
}

// from https://github.com/rust-lang/rust-analyzer/blob/4105378dc7479a3dbd39a4afb3eba67d083bd7f8/xtask/src/codegen/gen_syntax.rs#L406C1-L418C2
fn to_lower_snake_case(s: &str) -> String {
    let mut buf = String::with_capacity(s.len());
    let mut prev = false;
    for c in s.chars() {
        if c.is_ascii_uppercase() {
            if prev {
                buf.push('_')
            }
            prev = false;
        } else {
            prev = true;
        }

        buf.push(c.to_ascii_lowercase());
    }
    buf
}
