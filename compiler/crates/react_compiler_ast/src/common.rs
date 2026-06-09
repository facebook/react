use serde::Deserialize;
use serde::Serialize;

/// An AST subtree the compiler carries verbatim without inspecting (type
/// annotations, class bodies, parser extras). Wraps JSON text: serialization
/// is pass-through and deserialization streams the subtree into text without
/// building a `serde_json::Value`. Consumers that do need to look inside
/// parse on demand via [`RawNode::parse_value`].
///
/// Deserialize is hand-implemented with a transcode rather than capturing a
/// `RawValue` directly: most nodes sit under `#[serde(tag = "type")]` enums,
/// whose content buffering breaks `RawValue`'s text-borrowing capture.
#[derive(Debug, Clone, Serialize)]
#[serde(transparent)]
pub struct RawNode(pub Box<serde_json::value::RawValue>);

impl<'de> serde::Deserialize<'de> for RawNode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let mut buf = Vec::new();
        let mut ser = serde_json::Serializer::new(&mut buf);
        serde_transcode::transcode(deserializer, &mut ser).map_err(serde::de::Error::custom)?;
        let text = String::from_utf8(buf).map_err(serde::de::Error::custom)?;
        serde_json::value::RawValue::from_string(text)
            .map(RawNode)
            .map_err(serde::de::Error::custom)
    }
}

impl RawNode {
    pub fn from_value(value: &serde_json::Value) -> Self {
        RawNode(
            serde_json::value::RawValue::from_string(value.to_string())
                .expect("serde_json::Value always serializes to valid JSON"),
        )
    }

    pub fn null() -> Self {
        RawNode(
            serde_json::value::RawValue::from_string("null".to_string())
                .expect("null is valid JSON"),
        )
    }

    /// The raw JSON text of this subtree.
    pub fn get(&self) -> &str {
        self.0.get()
    }

    pub fn is_null(&self) -> bool {
        self.0.get() == "null"
    }

    /// Parse the subtree into a `serde_json::Value` for structural inspection.
    pub fn parse_value(&self) -> serde_json::Value {
        serde_json::from_str(self.0.get()).unwrap_or(serde_json::Value::Null)
    }

    /// The node's `"type"` field, without parsing the whole subtree into a Value.
    pub fn type_name(&self) -> Option<String> {
        #[derive(Deserialize)]
        struct TypeProbe {
            #[serde(rename = "type")]
            type_name: Option<String>,
        }
        serde_json::from_str::<TypeProbe>(self.0.get())
            .ok()
            .and_then(|p| p.type_name)
    }
}

/// Deserialize an AST type from a `serde_json::Value` by round-tripping
/// through text. Types carrying [`RawNode`] fields cannot be deserialized via
/// `serde_json::from_value` (RawValue capture requires a text input buffer);
/// every from-Value site must go through this instead. Cold paths only.
pub fn from_value_via_text<T: serde::de::DeserializeOwned>(
    value: &serde_json::Value,
) -> serde_json::Result<T> {
    serde_json::from_str(&value.to_string())
}

/// Custom deserializer that distinguishes "field absent" from "field: null".
/// - JSON field absent → `None` (via `#[serde(default)]`)
/// - JSON field `null` → `Some(RawNode("null"))`
/// - JSON field with value → `Some(raw value)`
///
/// Use with `#[serde(default, skip_serializing_if = "Option::is_none", deserialize_with = "nullable_value")]`
pub fn nullable_value<'de, D>(deserializer: D) -> Result<Option<RawNode>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    RawNode::deserialize(deserializer).map(Some)
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
    pub extra: Option<RawNode>,
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
