/*********************************************************************
 * NAN - Native Abstractions for Node.js
 *
 * Copyright (c) 2015 NAN contributors
 *
 * MIT License <https://github.com/rvagg/nan/blob/master/LICENSE.md>
 ********************************************************************/

#ifndef NAN_NEW_H_
#define NAN_NEW_H_

#if defined(_MSC_VER)
# pragma warning( push )
# pragma warning( disable : 4530 )
# include <string>
# pragma warning( pop )
#else
# include <string>
#endif

namespace NanIntern {  // scnr

// TODO(agnat): Generalize
template <typename T> v8::Local<T> To(v8::Handle<v8::Integer> i);

template <>
inline
v8::Local<v8::Integer>
To<v8::Integer>(v8::Handle<v8::Integer> i) { return i->ToInteger(); }

template <>
inline
v8::Local<v8::Int32>
To<v8::Int32>(v8::Handle<v8::Integer> i)   { return i->ToInt32(); }

template <>
inline
v8::Local<v8::Uint32>
To<v8::Uint32>(v8::Handle<v8::Integer> i)  { return i->ToUint32(); }

template <typename T> struct FactoryBase { typedef v8::Local<T> return_t; };

template <typename T> struct Factory;

template <>
struct Factory<v8::Array> : FactoryBase<v8::Array> {
  static inline return_t New();
  static inline return_t New(int length);
};

template <>
struct Factory<v8::Boolean> : FactoryBase<v8::Boolean> {
  static inline return_t New(bool value);
};

template <>
struct Factory<v8::BooleanObject> : FactoryBase<v8::BooleanObject> {
  static inline return_t New(bool value);
};

template <>
struct Factory<v8::Context> : FactoryBase<v8::Context> {
  static inline
  return_t
  New( v8::ExtensionConfiguration* extensions = NULL
     , v8::Handle<v8::ObjectTemplate> tmpl = v8::Handle<v8::ObjectTemplate>()
     , v8::Handle<v8::Value> obj = v8::Handle<v8::Value>());
};

template <>
struct Factory<v8::Date> : FactoryBase<v8::Date> {
  static inline return_t New(double value);
};

template <>
struct Factory<v8::External> : FactoryBase<v8::External> {
  static inline return_t New(void *value);
};

template <>
struct Factory<v8::Function> : FactoryBase<v8::Function> {
  static inline
  return_t
  New( NanFunctionCallback callback
     , v8::Handle<v8::Value> data = v8::Handle<v8::Value>());
};

template <>
struct Factory<v8::FunctionTemplate> : FactoryBase<v8::FunctionTemplate> {
  static inline
  return_t
  New( NanFunctionCallback callback = NULL
     , v8::Handle<v8::Value> data = v8::Handle<v8::Value>()
     , v8::Handle<v8::Signature> signature = v8::Handle<v8::Signature>());
};

template <>
struct Factory<v8::Number> : FactoryBase<v8::Number> {
  static inline return_t New(double value);
};

template <>
struct Factory<v8::NumberObject> : FactoryBase<v8::NumberObject> {
  static inline return_t New(double value);
};

template <typename T>
struct IntegerFactory : FactoryBase<T> {
  typedef typename FactoryBase<T>::return_t return_t;
  static inline return_t New(int32_t value);
  static inline return_t New(uint32_t value);
};

template <>
struct Factory<v8::Integer> : IntegerFactory<v8::Integer> {};

template <>
struct Factory<v8::Int32> : IntegerFactory<v8::Int32> {};

template <>
struct Factory<v8::Uint32> : FactoryBase<v8::Uint32> {
  static inline return_t New(int32_t value);
  static inline return_t New(uint32_t value);
};

template <>
struct Factory<v8::Object> : FactoryBase<v8::Object> {
  static inline return_t New();
};

template <>
struct Factory<v8::ObjectTemplate> : FactoryBase<v8::ObjectTemplate> {
  static inline return_t New();
};

template <>
struct Factory<v8::RegExp> : FactoryBase<v8::RegExp> {
  static inline return_t New(
      v8::Handle<v8::String> pattern, v8::RegExp::Flags flags);
};

template <>
struct Factory<v8::Script> : FactoryBase<v8::Script> {
  static inline return_t New( v8::Local<v8::String> source);
  static inline return_t New( v8::Local<v8::String> source
                            , v8::ScriptOrigin const& origin);
};

template <>
struct Factory<v8::Signature> : FactoryBase<v8::Signature> {
  typedef v8::Handle<v8::FunctionTemplate> FTH;
  static inline return_t New(FTH receiver = FTH());
};

template <>
struct Factory<v8::String> : FactoryBase<v8::String> {
  static inline return_t New();
  static inline return_t New(const char *value, int length = -1);
  static inline return_t New(const uint16_t *value, int length = -1);
  static inline return_t New(std::string const& value);

  static inline return_t New(v8::String::ExternalStringResource * value);
  static inline return_t New(NanExternalOneByteStringResource * value);

  // TODO(agnat): Deprecate.
  static inline return_t New(const uint8_t * value, int length = -1);
};

template <>
struct Factory<v8::StringObject> : FactoryBase<v8::StringObject> {
  static inline return_t New(v8::Handle<v8::String> value);
};

}  // end of namespace NanIntern

#if (NODE_MODULE_VERSION >= 12)

namespace NanIntern {

template <>
struct Factory<v8::UnboundScript> : FactoryBase<v8::UnboundScript> {
  static inline return_t New( v8::Local<v8::String> source);
  static inline return_t New( v8::Local<v8::String> source
                            , v8::ScriptOrigin const& origin);
};

}  // end of namespace NanIntern

# include "nan_implementation_12_inl.h"

#else  // NODE_MODULE_VERSION >= 12

# include "nan_implementation_pre_12_inl.h"

#endif

//=== API ======================================================================

template <typename T>
typename NanIntern::Factory<T>::return_t
NanNew() {
  return NanIntern::Factory<T>::New();
}

template <typename T, typename A0>
typename NanIntern::Factory<T>::return_t
NanNew(A0 arg0) {
  return NanIntern::Factory<T>::New(arg0);
}

template <typename T, typename A0, typename A1>
typename NanIntern::Factory<T>::return_t
NanNew(A0 arg0, A1 arg1) {
  return NanIntern::Factory<T>::New(arg0, arg1);
}

template <typename T, typename A0, typename A1, typename A2>
typename NanIntern::Factory<T>::return_t
NanNew(A0 arg0, A1 arg1, A2 arg2) {
  return NanIntern::Factory<T>::New(arg0, arg1, arg2);
}

template <typename T, typename A0, typename A1, typename A2, typename A3>
typename NanIntern::Factory<T>::return_t
NanNew(A0 arg0, A1 arg1, A2 arg2, A3 arg3) {
  return NanIntern::Factory<T>::New(arg0, arg1, arg2, arg3);
}

// Note(agnat): When passing overloaded function pointers to template functions
// as generic arguments the compiler needs help in picking the right overload.
// These two functions handle NanNew<Function> and NanNew<FunctionTemplate> with
// all argument variations.

// v8::Function and v8::FunctionTemplate with one or two arguments
template <typename T>
typename NanIntern::Factory<T>::return_t
NanNew( NanFunctionCallback callback
      , v8::Handle<v8::Value> data = v8::Handle<v8::Value>()) {
    return NanIntern::Factory<T>::New(callback, data);
}

// v8::Function and v8::FunctionTemplate with three arguments
template <typename T, typename A2>
typename NanIntern::Factory<T>::return_t
NanNew( NanFunctionCallback callback
      , v8::Handle<v8::Value> data = v8::Handle<v8::Value>()
      , A2 a2 = A2()) {
    return NanIntern::Factory<T>::New(callback, data, a2);
}

// Convenience

template <typename T> inline v8::Local<T> NanNew(v8::Handle<T> h);
template <typename T> inline v8::Local<T> NanNew(v8::Persistent<T> const& p);

inline
NanIntern::Factory<v8::Boolean>::return_t
NanNew(bool value) {
  return NanNew<v8::Boolean>(value);
}

inline
NanIntern::Factory<v8::Int32>::return_t
NanNew(int32_t value) {
  return NanNew<v8::Int32>(value);
}

inline
NanIntern::Factory<v8::Uint32>::return_t
NanNew(uint32_t value) {
  return NanNew<v8::Uint32>(value);
}

inline
NanIntern::Factory<v8::Number>::return_t
NanNew(double value) {
  return NanNew<v8::Number>(value);
}

inline
NanIntern::Factory<v8::String>::return_t
NanNew(std::string const& value) {
  return NanNew<v8::String>(value);
}

inline
NanIntern::Factory<v8::String>::return_t
NanNew(const char * value, int length) {
  return NanNew<v8::String>(value, length);
}

inline
NanIntern::Factory<v8::String>::return_t
NanNew(const char * value) {
  return NanNew<v8::String>(value);
}

inline
NanIntern::Factory<v8::String>::return_t
NanNew(const uint8_t * value) {
  return NanNew<v8::String>(value);
}

inline
NanIntern::Factory<v8::String>::return_t
NanNew(const uint16_t * value) {
  return NanNew<v8::String>(value);
}

inline
NanIntern::Factory<v8::String>::return_t
NanNew(v8::String::ExternalStringResource * value) {
  return NanNew<v8::String>(value);
}

inline
NanIntern::Factory<v8::String>::return_t
NanNew(NanExternalOneByteStringResource * value) {
  return NanNew<v8::String>(value);
}

inline
NanIntern::Factory<v8::RegExp>::return_t
NanNew(v8::Handle<v8::String> pattern, v8::RegExp::Flags flags) {
  return NanNew<v8::RegExp>(pattern, flags);
}

#endif  // NAN_NEW_H_
