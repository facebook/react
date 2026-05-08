use serde::Deserialize;
use serde::Serialize;

/// Custom deserializer that distinguishes "field absent" from "field: null".
/// - JSON field absent → `None` (via `#[serde(default)]`)
/// - JSON field `null` → `Some(Value::Null)`
/// - JSON field with value → `Some(value)`
///
/// Use with `#[serde(default, skip_serializing_if = "Option::is_none", deserialize_with = "nullable_value")]`
pub fn nullable_value<'de, D>(deserializer: D) -> Result<Option<Box<serde_json::Value>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let value = serde_json::Value::deserialize(deserializer)?;
    Ok(Some(Box::new(value)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub line: u32,
    pub column: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub index: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLocation {
    pub start: Position,
    pub end: Position,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "identifierName"
    )]
    pub identifier_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Comment {
    CommentBlock(CommentData),
    CommentLine(CommentData),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentData {
    pub value: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub end: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BaseNode {
    // NOTE: When creating AST nodes for code generation output, use
    // `BaseNode::typed("NodeTypeName")` instead of `BaseNode::default()`
    // to ensure the "type" field is emitted during serialization.
    /// The node type string (e.g. "BlockStatement").
    /// When deserialized through a `#[serde(tag = "type")]` enum, the enum
    /// consumes the "type" field so this defaults to None. When deserialized
    /// directly, this captures the "type" field for round-trip fidelity.
    #[serde(rename = "type", default, skip_serializing_if = "Option::is_none")]
    pub node_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub start: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub end: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocation>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range: Option<(u32, u32)>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extra: Option<serde_json::Value>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "leadingComments"
    )]
    pub leading_comments: Option<Vec<Comment>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "innerComments"
    )]
    pub inner_comments: Option<Vec<Comment>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "trailingComments"
    )]
    pub trailing_comments: Option<Vec<Comment>>,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "_nodeId")]
    pub node_id: Option<u32>,
}

impl BaseNode {
    /// Create a BaseNode with the given type name.
    /// Use this when creating AST nodes for code generation to ensure the
    /// `"type"` field is present in serialized output.
    pub fn typed(type_name: &str) -> Self {
        Self {
            node_type: Some(type_name.to_string()),
            ..Default::default()
        }
    }
}
