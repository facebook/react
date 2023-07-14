use serde::de::Visitor;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Clone, Debug, PartialEq, PartialOrd, Hash)]
pub enum JsValue {
    Undefined,
    Null,
    Bool(bool),
    Number(Number),
    String(String),
}

#[derive(
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug
)]
pub struct Number(u64);

impl From<u32> for Number {
    fn from(value: u32) -> Self {
        Number(value.into())
    }
}

impl From<u64> for Number {
    fn from(value: u64) -> Self {
        Number(value)
    }
}

impl From<f64> for Number {
    fn from(value: f64) -> Self {
        Number(value.to_bits())
    }
}

impl From<Number> for f64 {
    fn from(value: Number) -> Self {
        f64::from_bits(value.0)
    }
}

impl<'de> Deserialize<'de> for JsValue {
    #[inline]
    fn deserialize<D>(deserializer: D) -> Result<JsValue, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        struct ValueVisitor;

        impl<'de> Visitor<'de> for ValueVisitor {
            type Value = JsValue;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("valid primitive JSON value (null, boolean, number, or string")
            }

            #[inline]
            fn visit_bool<E>(self, value: bool) -> Result<JsValue, E> {
                Ok(JsValue::Bool(value))
            }

            #[inline]
            fn visit_i64<E>(self, value: i64) -> Result<JsValue, E> {
                if value < u32::MAX as i64 {
                    Ok(JsValue::Number((value as u32).into()))
                } else {
                    panic!("Invalid number")
                }
            }

            #[inline]
            fn visit_u64<E>(self, value: u64) -> Result<JsValue, E> {
                Ok(JsValue::Number(value.into()))
            }

            #[inline]
            fn visit_f64<E>(self, value: f64) -> Result<JsValue, E> {
                Ok(JsValue::Number(value.into()))
            }

            #[inline]
            fn visit_str<E>(self, value: &str) -> Result<JsValue, E>
            where
                E: serde::de::Error,
            {
                self.visit_string(String::from(value))
            }

            #[inline]
            fn visit_string<E>(self, value: String) -> Result<JsValue, E> {
                Ok(JsValue::String(value))
            }

            #[inline]
            fn visit_none<E>(self) -> Result<JsValue, E> {
                Ok(JsValue::Null)
            }

            #[inline]
            fn visit_some<D>(self, deserializer: D) -> Result<JsValue, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                Deserialize::deserialize(deserializer)
            }

            #[inline]
            fn visit_unit<E>(self) -> Result<JsValue, E> {
                Ok(JsValue::Undefined)
            }
        }

        deserializer.deserialize_any(ValueVisitor)
    }
}
