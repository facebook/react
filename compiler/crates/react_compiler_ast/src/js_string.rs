use std::borrow::Cow;
use std::cell::RefCell;
use std::fmt;
use std::hash::Hash;
use std::hash::Hasher;

use serde::Deserialize;
use serde::Serialize;
use serde::de::Deserializer;
use serde::ser::Serializer;

// ---------------------------------------------------------------------------
// Dynamic surrogate marker (thread-local)
// ---------------------------------------------------------------------------

thread_local! {
    /// The surrogate marker prefix chosen by bridge.ts for this compilation.
    /// Default: `__SURROGATE_`. bridge.ts may prepend `__ESC_` if the source
    /// contains the default marker text, making it e.g. `__ESC___SURROGATE_`.
    static SURROGATE_MARKER: RefCell<String> = RefCell::new("__SURROGATE_".to_string());
}

/// Set the surrogate marker for the current thread/compilation.
/// Called from the NAPI entry point with the marker chosen by bridge.ts.
pub fn set_surrogate_marker(marker: &str) {
    SURROGATE_MARKER.with(|m| {
        *m.borrow_mut() = marker.to_string();
    });
}

/// Get the current surrogate marker prefix.
fn get_marker_prefix() -> String {
    SURROGATE_MARKER.with(|m| m.borrow().clone())
}

/// Get the full marker for a given hex codepoint (e.g. `__SURROGATE_D83E__`).
fn make_marker(prefix: &str, hex: &str) -> String {
    format!("{}{}__", prefix, hex)
}

/// A JavaScript string value that can contain lone surrogates (WTF-8).
///
/// JavaScript strings are sequences of UTF-16 code units that may include
/// unpaired surrogates (U+D800–U+DFFF). Rust's `String` type requires valid
/// UTF-8, which cannot represent lone surrogates. `JsString` uses WTF-8
/// encoding internally to preserve them.
///
/// For the 99.99% of strings that contain no lone surrogates, `JsString`
/// stores a regular `String` (the `Utf8` variant) with zero overhead.
/// The `Wtf8` variant is used only when lone surrogates are present.
///
/// ## Serde
///
/// The bridge layer (bridge.ts) encodes lone surrogates as `__SURROGATE_XXXX__`
/// markers in JSON before sending to Rust. `JsString`'s custom deserializer
/// decodes these markers into WTF-8 lone surrogate bytes. On serialization,
/// WTF-8 lone surrogates are re-encoded as markers so `restoreJsonSurrogates`
/// can convert them back to real surrogates in JS.
#[derive(Clone)]
pub enum JsString {
    /// Valid UTF-8 string (no lone surrogates). This is the fast path.
    Utf8(String),
    /// WTF-8 encoded bytes containing at least one lone surrogate.
    Wtf8(Vec<u8>),
}

// ---------------------------------------------------------------------------
// WTF-8 encoding helpers
// ---------------------------------------------------------------------------

/// Encode a lone surrogate (U+D800–U+DFFF) as 3 WTF-8 bytes.
fn encode_surrogate(cp: u32) -> [u8; 3] {
    debug_assert!((0xD800..=0xDFFF).contains(&cp));
    [
        0xE0 | ((cp >> 12) as u8 & 0x0F),
        0x80 | ((cp >> 6) as u8 & 0x3F),
        0x80 | (cp as u8 & 0x3F),
    ]
}

/// Check if a 3-byte WTF-8 sequence at `bytes[i..]` is a lone surrogate.
/// Returns the surrogate codepoint if so.
pub fn decode_surrogate_at(bytes: &[u8], i: usize) -> Option<u32> {
    if i + 3 > bytes.len() {
        return None;
    }
    let b0 = bytes[i];
    let b1 = bytes[i + 1];
    let b2 = bytes[i + 2];
    // WTF-8 surrogates: ED A0 80 .. ED BF BF (U+D800..U+DFFF)
    if b0 == 0xED && b1 >= 0xA0 {
        let cp = ((b0 as u32 & 0x0F) << 12) | ((b1 as u32 & 0x3F) << 6) | (b2 as u32 & 0x3F);
        if (0xD800..=0xDFFF).contains(&cp) {
            return Some(cp);
        }
    }
    None
}

/// Check if WTF-8 bytes contain any lone surrogates.
fn has_surrogates(bytes: &[u8]) -> bool {
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == 0xED && i + 2 < bytes.len() && bytes[i + 1] >= 0xA0 {
            return true;
        }
        // Advance by UTF-8 sequence length
        i += utf8_seq_len(bytes[i]);
    }
    false
}

fn utf8_seq_len(first_byte: u8) -> usize {
    match first_byte {
        0x00..=0x7F => 1,
        0xC0..=0xDF => 2,
        0xE0..=0xEF => 3,
        0xF0..=0xF7 => 4,
        _ => 1, // invalid byte, advance by 1
    }
}

/// Decode surrogate markers in a string, producing WTF-8 bytes.
/// Uses the dynamic marker prefix from the thread-local (set by bridge.ts).
/// Returns `None` if no markers are found (caller should use the original String).
fn decode_markers(s: &str) -> Option<Vec<u8>> {
    let prefix = get_marker_prefix();
    if !s.contains(&prefix) {
        return None;
    }

    let prefix_bytes = prefix.as_bytes();
    let prefix_len = prefix_bytes.len();
    // Full marker: prefix + 4 hex digits + "__" = prefix_len + 6
    let marker_len = prefix_len + 6;

    let mut result = Vec::with_capacity(s.len());
    let bytes = s.as_bytes();
    let mut i = 0;

    while i < bytes.len() {
        if i + marker_len <= bytes.len()
            && &bytes[i..i + prefix_len] == prefix_bytes
            && bytes[i + prefix_len + 4] == b'_'
            && bytes[i + prefix_len + 5] == b'_'
        {
            let hex = &s[i + prefix_len..i + prefix_len + 4];
            if let Ok(cp) = u16::from_str_radix(hex, 16) {
                let cp32 = cp as u32;
                if (0xD800..=0xDFFF).contains(&cp32) {
                    result.extend_from_slice(&encode_surrogate(cp32));
                    i += marker_len;
                    continue;
                }
            }
        }
        result.push(bytes[i]);
        i += 1;
    }

    Some(result)
}

/// Encode WTF-8 bytes back to a String with surrogate markers.
/// Uses the dynamic marker prefix from the thread-local.
fn encode_markers(bytes: &[u8]) -> String {
    let prefix = get_marker_prefix();
    let mut result = String::with_capacity(bytes.len());
    let mut i = 0;

    while i < bytes.len() {
        if let Some(cp) = decode_surrogate_at(bytes, i) {
            result.push_str(&make_marker(&prefix, &format!("{:04X}", cp)));
            i += 3;
        } else {
            let len = utf8_seq_len(bytes[i]);
            let end = (i + len).min(bytes.len());
            if let Ok(s) = std::str::from_utf8(&bytes[i..end]) {
                result.push_str(s);
            } else {
                result.push('\u{FFFD}');
            }
            i = end;
        }
    }

    result
}

// ---------------------------------------------------------------------------
// Core impl
// ---------------------------------------------------------------------------

impl JsString {
    /// Create a JsString from a regular string (no surrogates).
    pub fn new(s: impl Into<String>) -> Self {
        JsString::Utf8(s.into())
    }

    /// Returns the string as a `&str` if it contains no lone surrogates.
    pub fn as_str(&self) -> Option<&str> {
        match self {
            JsString::Utf8(s) => Some(s),
            JsString::Wtf8(_) => None,
        }
    }

    /// Returns true if the string is empty.
    pub fn is_empty(&self) -> bool {
        match self {
            JsString::Utf8(s) => s.is_empty(),
            JsString::Wtf8(b) => b.is_empty(),
        }
    }

    /// Returns the JavaScript `.length` (number of UTF-16 code units).
    /// Lone surrogates count as 1 code unit each.
    pub fn utf16_len(&self) -> usize {
        match self {
            JsString::Utf8(s) => s.encode_utf16().count(),
            JsString::Wtf8(bytes) => {
                let mut count = 0;
                let mut i = 0;
                while i < bytes.len() {
                    let len = utf8_seq_len(bytes[i]);
                    if len == 4 {
                        count += 2; // supplementary character = 2 UTF-16 code units
                    } else {
                        count += 1; // BMP character or lone surrogate = 1 code unit
                    }
                    i += len;
                }
                count
            }
        }
    }

    /// Concatenate another JsString onto this one.
    pub fn push_js_string(&mut self, other: &JsString) {
        match (self, other) {
            (JsString::Utf8(a), JsString::Utf8(b)) => a.push_str(b),
            (me @ JsString::Utf8(_), JsString::Wtf8(b)) => {
                let mut bytes = match std::mem::replace(me, JsString::Utf8(String::new())) {
                    JsString::Utf8(s) => s.into_bytes(),
                    _ => unreachable!(),
                };
                bytes.extend_from_slice(b);
                *me = JsString::Wtf8(bytes);
            }
            (JsString::Wtf8(a), JsString::Utf8(b)) => a.extend_from_slice(b.as_bytes()),
            (JsString::Wtf8(a), JsString::Wtf8(b)) => a.extend_from_slice(b),
        }
    }

    /// Push a regular str onto this JsString.
    pub fn push_str(&mut self, s: &str) {
        match self {
            JsString::Utf8(a) => a.push_str(s),
            JsString::Wtf8(a) => a.extend_from_slice(s.as_bytes()),
        }
    }

    /// Convert to a lossy UTF-8 string, replacing lone surrogates with U+FFFD.
    pub fn to_utf8_lossy(&self) -> Cow<'_, str> {
        match self {
            JsString::Utf8(s) => Cow::Borrowed(s),
            JsString::Wtf8(bytes) => {
                let mut result = String::with_capacity(bytes.len());
                let mut i = 0;
                while i < bytes.len() {
                    if let Some(_cp) = decode_surrogate_at(bytes, i) {
                        result.push('\u{FFFD}');
                        i += 3;
                    } else {
                        let len = utf8_seq_len(bytes[i]);
                        let end = (i + len).min(bytes.len());
                        if let Ok(s) = std::str::from_utf8(&bytes[i..end]) {
                            result.push_str(s);
                        } else {
                            result.push('\u{FFFD}');
                        }
                        i = end;
                    }
                }
                Cow::Owned(result)
            }
        }
    }

    /// Get the raw WTF-8 bytes.
    pub fn as_bytes(&self) -> &[u8] {
        match self {
            JsString::Utf8(s) => s.as_bytes(),
            JsString::Wtf8(b) => b,
        }
    }

    /// Returns the string as a `&str`, panicking if it contains lone surrogates.
    /// Use only when you know the string is valid UTF-8 (identifiers, tag names, etc.).
    pub fn as_str_unwrap(&self) -> &str {
        match self {
            JsString::Utf8(s) => s,
            JsString::Wtf8(_) => {
                panic!("JsString contains lone surrogates, cannot convert to &str")
            }
        }
    }

    /// Check if the string contains a substring (UTF-8 only fast path).
    pub fn contains(&self, pattern: &str) -> bool {
        match self {
            JsString::Utf8(s) => s.contains(pattern),
            JsString::Wtf8(b) => {
                // Search for the pattern bytes within the WTF-8 bytes
                let pat = pattern.as_bytes();
                b.windows(pat.len()).any(|w| w == pat)
            }
        }
    }

    /// Check if the string starts with a prefix.
    pub fn starts_with(&self, prefix: &str) -> bool {
        match self {
            JsString::Utf8(s) => s.starts_with(prefix),
            JsString::Wtf8(b) => b.starts_with(prefix.as_bytes()),
        }
    }

    /// Get the inner String, consuming self. Panics if WTF-8.
    pub fn into_string(self) -> String {
        match self {
            JsString::Utf8(s) => s,
            JsString::Wtf8(_) => {
                panic!("JsString contains lone surrogates, cannot convert to String")
            }
        }
    }

    /// Get the inner String if UTF-8, or lossy conversion if WTF-8.
    pub fn into_string_lossy(self) -> String {
        match self {
            JsString::Utf8(s) => s,
            JsString::Wtf8(_) => self.to_utf8_lossy().into_owned(),
        }
    }

    /// Iterate over chars (UTF-8 fast path only, surrogates replaced with U+FFFD).
    pub fn chars_lossy(&self) -> impl Iterator<Item = char> + '_ {
        self.to_utf8_lossy().chars().collect::<Vec<_>>().into_iter()
    }

    /// Split the string at the first occurrence of a delimiter.
    pub fn splitn_str(&self, n: usize, delimiter: &str) -> Vec<JsString> {
        match self {
            JsString::Utf8(s) => s.splitn(n, delimiter).map(JsString::from).collect(),
            JsString::Wtf8(_) => {
                let lossy = self.to_utf8_lossy();
                lossy
                    .splitn(n, delimiter)
                    .map(|s| JsString::from(s.to_string()))
                    .collect()
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Trait impls
// ---------------------------------------------------------------------------

impl PartialEq for JsString {
    fn eq(&self, other: &Self) -> bool {
        self.as_bytes() == other.as_bytes()
    }
}

impl Eq for JsString {}

impl Hash for JsString {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.as_bytes().hash(state);
    }
}

impl fmt::Debug for JsString {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            JsString::Utf8(s) => fmt::Debug::fmt(s, f),
            JsString::Wtf8(_) => {
                write!(f, "\"{}\"", self.to_utf8_lossy())
            }
        }
    }
}

impl fmt::Display for JsString {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            JsString::Utf8(s) => fmt::Display::fmt(s, f),
            JsString::Wtf8(_) => write!(f, "{}", self.to_utf8_lossy()),
        }
    }
}

impl Default for JsString {
    fn default() -> Self {
        JsString::Utf8(String::new())
    }
}

impl From<String> for JsString {
    fn from(s: String) -> Self {
        JsString::Utf8(s)
    }
}

impl From<&str> for JsString {
    fn from(s: &str) -> Self {
        JsString::Utf8(s.to_string())
    }
}

impl PartialEq<str> for JsString {
    fn eq(&self, other: &str) -> bool {
        match self {
            JsString::Utf8(s) => s == other,
            JsString::Wtf8(b) => b.as_slice() == other.as_bytes(),
        }
    }
}

impl PartialEq<&str> for JsString {
    fn eq(&self, other: &&str) -> bool {
        self == *other
    }
}

// ---------------------------------------------------------------------------
// Serde
// ---------------------------------------------------------------------------

impl Serialize for JsString {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self {
            JsString::Utf8(s) => serializer.serialize_str(s),
            JsString::Wtf8(bytes) => {
                let encoded = encode_markers(bytes);
                serializer.serialize_str(&encoded)
            }
        }
    }
}

impl<'de> Deserialize<'de> for JsString {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        match decode_markers(&s) {
            Some(wtf8_bytes) => {
                if has_surrogates(&wtf8_bytes) {
                    Ok(JsString::Wtf8(wtf8_bytes))
                } else {
                    // Markers were present but didn't produce surrogates — use UTF-8
                    match String::from_utf8(wtf8_bytes) {
                        Ok(s) => Ok(JsString::Utf8(s)),
                        Err(e) => Ok(JsString::Wtf8(e.into_bytes())),
                    }
                }
            }
            None => Ok(JsString::Utf8(s)),
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn utf8_fast_path() {
        let s = JsString::from("hello");
        assert_eq!(s.as_str(), Some("hello"));
        assert_eq!(s.utf16_len(), 5);
        assert!(!s.is_empty());
    }

    #[test]
    fn empty_string() {
        let s = JsString::from("");
        assert!(s.is_empty());
        assert_eq!(s.utf16_len(), 0);
        assert_eq!(s.as_str(), Some(""));
    }

    #[test]
    fn serde_no_markers() {
        let json = r#""hello world""#;
        let s: JsString = serde_json::from_str(json).unwrap();
        assert_eq!(s.as_str(), Some("hello world"));
        let out = serde_json::to_string(&s).unwrap();
        assert_eq!(out, json);
    }

    #[test]
    fn serde_with_surrogate_marker() {
        let json = r#""before__SURROGATE_D83E__after""#;
        let s: JsString = serde_json::from_str(json).unwrap();
        // Should be in Wtf8 variant
        assert!(s.as_str().is_none());
        // The surrogate U+D83E is 1 UTF-16 code unit
        // "before" (6) + surrogate (1) + "after" (5) = 12
        assert_eq!(s.utf16_len(), 12);
        // Round-trip: serialize back to marker form
        let out = serde_json::to_string(&s).unwrap();
        assert_eq!(out, json);
    }

    #[test]
    fn serde_lone_high_surrogate() {
        let json = r#""__SURROGATE_D83E__""#;
        let s: JsString = serde_json::from_str(json).unwrap();
        assert!(s.as_str().is_none());
        assert_eq!(s.utf16_len(), 1);
        let out = serde_json::to_string(&s).unwrap();
        assert_eq!(out, json);
    }

    #[test]
    fn serde_lone_low_surrogate() {
        let json = r#""__SURROGATE_DD21__""#;
        let s: JsString = serde_json::from_str(json).unwrap();
        assert!(s.as_str().is_none());
        assert_eq!(s.utf16_len(), 1);
        let out = serde_json::to_string(&s).unwrap();
        assert_eq!(out, json);
    }

    #[test]
    fn serde_two_surrogates() {
        let json = r#""__SURROGATE_D83E____SURROGATE_DD21__""#;
        let s: JsString = serde_json::from_str(json).unwrap();
        assert_eq!(s.utf16_len(), 2);
        let out = serde_json::to_string(&s).unwrap();
        assert_eq!(out, json);
    }

    #[test]
    fn sentinel_collision_resistance() {
        // Source code that literally contains the marker text
        let json = r#""__SURROGATE_D83E__""#;
        let s: JsString = serde_json::from_str(json).unwrap();
        // This IS a real surrogate marker, so it should be decoded
        assert!(s.as_str().is_none());
        assert_eq!(s.utf16_len(), 1);
    }

    #[test]
    fn non_surrogate_marker_pattern() {
        // A marker with a non-surrogate codepoint should be treated as literal text
        let json = r#""__SURROGATE_0041__""#;
        let s: JsString = serde_json::from_str(json).unwrap();
        // 0041 is 'A', not a surrogate — should be stored as-is
        assert_eq!(s.as_str(), Some("__SURROGATE_0041__"));
    }

    #[test]
    fn equality() {
        let a = JsString::from("hello");
        let b = JsString::from("hello");
        assert_eq!(a, b);

        let c: JsString = serde_json::from_str(r#""__SURROGATE_D83E__""#).unwrap();
        let d: JsString = serde_json::from_str(r#""__SURROGATE_D83E__""#).unwrap();
        assert_eq!(c, d);

        assert_ne!(a, c);
    }

    #[test]
    fn concat_utf8_utf8() {
        let mut a = JsString::from("hello ");
        let b = JsString::from("world");
        a.push_js_string(&b);
        assert_eq!(a.as_str(), Some("hello world"));
    }

    #[test]
    fn concat_utf8_wtf8() {
        let mut a = JsString::from("prefix");
        let b: JsString = serde_json::from_str(r#""__SURROGATE_D83E__""#).unwrap();
        a.push_js_string(&b);
        assert!(a.as_str().is_none());
        // "prefix" (6) + surrogate (1) = 7
        assert_eq!(a.utf16_len(), 7);
    }

    #[test]
    fn concat_wtf8_utf8() {
        let mut a: JsString = serde_json::from_str(r#""__SURROGATE_D83E__""#).unwrap();
        let b = JsString::from("suffix");
        a.push_js_string(&b);
        assert!(a.as_str().is_none());
        assert_eq!(a.utf16_len(), 7);
    }

    #[test]
    fn utf16_len_supplementary() {
        // U+1F600 (😀) is a supplementary character = 2 UTF-16 code units
        let s = JsString::from("😀");
        assert_eq!(s.utf16_len(), 2);
    }

    #[test]
    fn utf16_len_bmp() {
        // ASCII + BMP characters
        let s = JsString::from("café");
        assert_eq!(s.utf16_len(), 4);
    }

    #[test]
    fn to_utf8_lossy_no_surrogates() {
        let s = JsString::from("hello");
        assert_eq!(s.to_utf8_lossy(), "hello");
    }

    #[test]
    fn to_utf8_lossy_with_surrogates() {
        let s: JsString = serde_json::from_str(r#""a__SURROGATE_D83E__b""#).unwrap();
        assert_eq!(s.to_utf8_lossy(), "a\u{FFFD}b");
    }

    #[test]
    fn push_str() {
        let mut s = JsString::from("hello");
        s.push_str(" world");
        assert_eq!(s.as_str(), Some("hello world"));
    }

    #[test]
    fn partial_eq_str() {
        let s = JsString::from("hello");
        assert_eq!(s, *"hello");
        assert_ne!(s, *"world");
    }

    #[test]
    fn encode_surrogate_bytes() {
        // U+D83E should encode as ED A0 BE
        let bytes = encode_surrogate(0xD83E);
        assert_eq!(bytes, [0xED, 0xA0, 0xBE]);

        // U+DD21 should encode as ED B4 A1
        let bytes = encode_surrogate(0xDD21);
        assert_eq!(bytes, [0xED, 0xB4, 0xA1]);
    }

    #[test]
    fn decode_surrogate_bytes() {
        assert_eq!(decode_surrogate_at(&[0xED, 0xA0, 0xBE], 0), Some(0xD83E));
        assert_eq!(decode_surrogate_at(&[0xED, 0xB4, 0xA1], 0), Some(0xDD21));
        // Not a surrogate
        assert_eq!(decode_surrogate_at(&[0xE4, 0xB8, 0xAD], 0), None);
    }
}
