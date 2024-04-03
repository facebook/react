/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use serde::de::Visitor;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JsValue {
    Boolean(bool),
    Null,
    Number(Number),
    String(String),
    Undefined,
}

impl JsValue {
    pub fn is_truthy(&self) -> bool {
        match &self {
            JsValue::Boolean(value) => *value,
            JsValue::Number(value) => value.is_truthy(),
            JsValue::String(value) => !value.is_empty(),
            JsValue::Null => false,
            JsValue::Undefined => false,
        }
    }

    // Partial implementation of loose equality for javascript, returns Some for supported
    // cases w the equality result, and None for unsupported cases
    pub fn loosely_equals(&self, other: &Self) -> Option<bool> {
        // https://tc39.es/ecma262/multipage/abstract-operations.html#sec-islooselyequal
        match (&self, &other) {
            // 1. If Type(x) is Type(y), then
            //    a. Return IsStrictlyEqual(x, y).
            (JsValue::Number(left), JsValue::Number(right)) => Some(left.equals(*right)),
            (JsValue::Null, JsValue::Null) => Some(true),
            (JsValue::Undefined, JsValue::Undefined) => Some(true),
            (JsValue::Boolean(left), JsValue::Boolean(right)) => Some(left == right),
            (JsValue::String(left), JsValue::String(right)) => Some(left == right),

            // 2. If x is null and y is undefined, return true.
            (JsValue::Null, JsValue::Undefined) => Some(true),

            // 3. If x is undefined and y is null, return true.
            (JsValue::Undefined, JsValue::Null) => Some(true),
            _ => None,
        }
    }

    pub fn not_loosely_equals(&self, other: &Self) -> Option<bool> {
        self.loosely_equals(other).map(|value| !value)
    }

    // Complete implementation of strict equality for javascript
    pub fn strictly_equals(&self, other: &Self) -> bool {
        // https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal
        match (&self, &other) {
            (JsValue::Number(left), JsValue::Number(right)) => left.equals(*right),
            (JsValue::Null, JsValue::Null) => true,
            (JsValue::Undefined, JsValue::Undefined) => true,
            (JsValue::Boolean(left), JsValue::Boolean(right)) => left == right,
            (JsValue::String(left), JsValue::String(right)) => left == right,
            _ => false,
        }
    }

    pub fn not_strictly_equals(&self, other: &Self) -> bool {
        !self.strictly_equals(other)
    }
}

impl Serialize for JsValue {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            Self::Boolean(b) => serializer.serialize_bool(*b),
            Self::Null => serializer.serialize_none(),
            Self::Number(n) => serializer.serialize_f64(n.into()),
            Self::String(s) => serializer.serialize_str(s),
            Self::Undefined => serializer.serialize_unit(),
        }
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
                Ok(JsValue::Boolean(value))
            }

            #[inline]
            fn visit_i64<E>(self, value: i64) -> Result<JsValue, E> {
                if (MIN_SAFE_INT..=MAX_SAFE_INT).contains(&value) {
                    Ok(JsValue::Number((value as f64).into()))
                } else {
                    panic!("Invalid number")
                }
            }

            #[inline]
            fn visit_u64<E>(self, value: u64) -> Result<JsValue, E> {
                if value as i64 <= MAX_SAFE_INT {
                    Ok(JsValue::Number((value as f64).into()))
                } else {
                    panic!("Invalid number")
                }
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

/// Represents a JavaScript Number as its binary representation so that
/// -1 == -1, NaN == Nan etc.
/// Note: NaN is *always* represented as the f64::NAN constant to allow
/// comparison of NaNs.
#[derive(Clone, Copy, Eq, PartialEq, PartialOrd, Ord, Debug, Hash)]
pub struct Number(u64);

pub const MAX_SAFE_INT: i64 = 9007199254740991;
pub const MIN_SAFE_INT: i64 = -9007199254740991;

impl From<f64> for Number {
    fn from(value: f64) -> Self {
        if value.is_nan() {
            Self(f64::NAN.to_bits())
        } else {
            Self(value.to_bits())
        }
    }
}

impl From<u32> for Number {
    fn from(value: u32) -> Self {
        f64::from(value).into()
    }
}

impl From<Number> for f64 {
    fn from(number: Number) -> Self {
        let value = f64::from_bits(number.0);
        assert!(!f64::is_nan(value) || number.0 == f64::NAN.to_bits());
        value
    }
}

impl From<&Number> for f64 {
    fn from(number: &Number) -> Self {
        let value = f64::from_bits(number.0);
        assert!(!f64::is_nan(value) || number.0 == f64::NAN.to_bits());
        value
    }
}

impl Number {
    pub fn equals(self, other: Self) -> bool {
        f64::from(self) == f64::from(other)
    }

    pub fn not_equals(self, other: Self) -> bool {
        !self.equals(other)
    }

    pub fn is_truthy(self) -> bool {
        let value = f64::from(self);
        !(self.0 == f64::NAN.to_bits() || value == 0.0 || value == -0.0)
    }
}

impl std::ops::Add for Number {
    type Output = Number;

    fn add(self, rhs: Self) -> Self::Output {
        let result = f64::from(self) + f64::from(rhs);
        Self::from(result)
    }
}

impl std::ops::Sub for Number {
    type Output = Number;

    fn sub(self, rhs: Self) -> Self::Output {
        let result = f64::from(self) - f64::from(rhs);
        Self::from(result)
    }
}

impl std::ops::Mul for Number {
    type Output = Number;

    fn mul(self, rhs: Self) -> Self::Output {
        let result = f64::from(self) * f64::from(rhs);
        Self::from(result)
    }
}

impl std::ops::Div for Number {
    type Output = Number;

    fn div(self, rhs: Self) -> Self::Output {
        let result = f64::from(self) / f64::from(rhs);
        Self::from(result)
    }
}

impl Serialize for Number {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_f64(self.into())
    }
}

impl<'de> Deserialize<'de> for Number {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        struct ValueVisitor;

        impl<'de> Visitor<'de> for ValueVisitor {
            type Value = Number;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("value JavaScript number value")
            }

            fn visit_f64<E>(self, v: f64) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                Ok(v.into())
            }
        }

        deserializer.deserialize_any(ValueVisitor)
    }
}
