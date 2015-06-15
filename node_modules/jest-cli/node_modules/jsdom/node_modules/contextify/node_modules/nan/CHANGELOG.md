# NAN ChangeLog

**Version 1.8.4: current Node 12: 0.12.2, Node 10: 0.10.38, io.js: 1.8.1**

### 1.8.4 Apr 26 2015

  - Build: Repackage

### 1.8.3 Apr 26 2015

  - Bugfix: Include missing header 1af8648

### 1.8.2 Apr 23 2015

  - Build: Repackage

### 1.8.1 Apr 23 2015

  - Bugfix: NanObjectWrapHandle should take a pointer 155f1d3

### 1.8.0 Apr 23 2015

  - Feature: Allow primitives with NanReturnValue 2e4475e
  - Feature: Added comparison operators to NanCallback 55b075e
  - Feature: Backport thread local storage 15bb7fa
  - Removal: Remove support for signatures with arguments 8a2069d
  - Correcteness: Replaced NanObjectWrapHandle macro with function 0bc6d59

### 1.7.0 Feb 28 2015

  - Feature: Made NanCallback::Call accept optional target 8d54da7
  - Feature: Support atom-shell 0.21 0b7f1bb

### 1.6.2 Feb 6 2015

  - Bugfix: NanEncode: fix argument type for node::Encode on io.js 2be8639

### 1.6.1 Jan 23 2015

  - Build: version bump

### 1.5.3 Jan 23 2015

  - Build: repackage

### 1.6.0 Jan 23 2015

 - Deprecated `NanNewContextHandle` in favor of `NanNew<Context>` 49259af
 - Support utility functions moved in newer v8 versions (Node 0.11.15, io.js 1.0) a0aa179
 - Added `NanEncode`, `NanDecodeBytes` and `NanDecodeWrite` 75e6fb9

### 1.5.2 Jan 23 2015

  - Bugfix: Fix non-inline definition build error with clang++ 21d96a1, 60fadd4
  - Bugfix: Readded missing String constructors 18d828f
  - Bugfix: Add overload handling NanNew<FunctionTemplate>(..) 5ef813b
  - Bugfix: Fix uv_work_cb versioning 997e4ae
  - Bugfix: Add function factory and test 4eca89c
  - Bugfix: Add object template factory and test cdcb951
  - Correctness: Lifted an io.js related typedef c9490be
  - Correctness: Make explicit downcasts of String lengths 00074e6
  - Windows: Limit the scope of disabled warning C4530 83d7deb

### 1.5.1 Jan 15 2015

  - Build: version bump

### 1.4.3 Jan 15 2015

  - Build: version bump

### 1.4.2 Jan 15 2015

  - Feature: Support io.js 0dbc5e8

### 1.5.0 Jan 14 2015

 - Feature: Support io.js b003843
 - Correctness: Improved NanNew internals 9cd4f6a
 - Feature: Implement progress to NanAsyncWorker 8d6a160

### 1.4.1 Nov 8 2014

 - Bugfix: Handle DEBUG definition correctly
 - Bugfix: Accept int as Boolean

### 1.4.0 Nov 1 2014

 - Feature: Added NAN_GC_CALLBACK 6a5c245
 - Performance: Removed unnecessary local handle creation 18a7243, 41fe2f8
 - Correctness: Added constness to references in NanHasInstance 02c61cd
 - Warnings: Fixed spurious warnings from -Wundef and -Wshadow, 541b122, 99d8cb6
 - Windoze: Shut Visual Studio up when compiling 8d558c1
 - License: Switch to plain MIT from custom hacked MIT license 11de983
 - Build: Added test target to Makefile e232e46
 - Performance: Removed superfluous scope in NanAsyncWorker f4b7821
 - Sugar/Feature: Added NanReturnThis() and NanReturnHolder() shorthands 237a5ff, d697208
 - Feature: Added suitable overload of NanNew for v8::Integer::NewFromUnsigned b27b450

### 1.3.0 Aug 2 2014

 - Added NanNew<v8::String, std::string>(std::string)
 - Added NanNew<v8::String, std::string&>(std::string&)
 - Added NanAsciiString helper class
 - Added NanUtf8String helper class
 - Added NanUcs2String helper class
 - Deprecated NanRawString()
 - Deprecated NanCString()
 - Added NanGetIsolateData(v8::Isolate *isolate)
 - Added NanMakeCallback(v8::Handle<v8::Object> target, v8::Handle<v8::Function> func, int argc, v8::Handle<v8::Value>* argv)
 - Added NanMakeCallback(v8::Handle<v8::Object> target, v8::Handle<v8::String> symbol, int argc, v8::Handle<v8::Value>* argv)
 - Added NanMakeCallback(v8::Handle<v8::Object> target, const char* method, int argc, v8::Handle<v8::Value>* argv)
 - Added NanSetTemplate(v8::Handle<v8::Template> templ, v8::Handle<v8::String> name , v8::Handle<v8::Data> value, v8::PropertyAttribute attributes)
 - Added NanSetPrototypeTemplate(v8::Local<v8::FunctionTemplate> templ, v8::Handle<v8::String> name, v8::Handle<v8::Data> value, v8::PropertyAttribute attributes)
 - Added NanSetInstanceTemplate(v8::Local<v8::FunctionTemplate> templ, const char *name, v8::Handle<v8::Data> value)
 - Added NanSetInstanceTemplate(v8::Local<v8::FunctionTemplate> templ, v8::Handle<v8::String> name, v8::Handle<v8::Data> value, v8::PropertyAttribute attributes)

### 1.2.0 Jun 5 2014

 - Add NanSetPrototypeTemplate
 - Changed NAN_WEAK_CALLBACK internals, switched _NanWeakCallbackData to class,
     introduced _NanWeakCallbackDispatcher
 - Removed -Wno-unused-local-typedefs from test builds
 - Made test builds Windows compatible ('Sleep()')

### 1.1.2 May 28 2014

 - Release to fix more stuff-ups in 1.1.1

### 1.1.1 May 28 2014

 - Release to fix version mismatch in nan.h and lack of changelog entry for 1.1.0

### 1.1.0 May 25 2014

 - Remove nan_isolate, use v8::Isolate::GetCurrent() internally instead
 - Additional explicit overloads for NanNew(): (char*,int), (uint8_t*[,int]),
     (uint16_t*[,int), double, int, unsigned int, bool, v8::String::ExternalStringResource*,
     v8::String::ExternalAsciiStringResource*
 - Deprecate NanSymbol()
 - Added SetErrorMessage() and ErrorMessage() to NanAsyncWorker

### 1.0.0 May 4 2014

 - Heavy API changes for V8 3.25 / Node 0.11.13
 - Use cpplint.py
 - Removed NanInitPersistent
 - Removed NanPersistentToLocal
 - Removed NanFromV8String
 - Removed NanMakeWeak
 - Removed NanNewLocal
 - Removed NAN_WEAK_CALLBACK_OBJECT
 - Removed NAN_WEAK_CALLBACK_DATA
 - Introduce NanNew, replaces NanNewLocal, NanPersistentToLocal, adds many overloaded typed versions
 - Introduce NanUndefined, NanNull, NanTrue and NanFalse
 - Introduce NanEscapableScope and NanEscapeScope
 - Introduce NanMakeWeakPersistent (requires a special callback to work on both old and new node)
 - Introduce NanMakeCallback for node::MakeCallback
 - Introduce NanSetTemplate
 - Introduce NanGetCurrentContext
 - Introduce NanCompileScript and NanRunScript
 - Introduce NanAdjustExternalMemory
 - Introduce NanAddGCEpilogueCallback, NanAddGCPrologueCallback, NanRemoveGCEpilogueCallback, NanRemoveGCPrologueCallback
 - Introduce NanGetHeapStatistics
 - Rename NanAsyncWorker#SavePersistent() to SaveToPersistent()

### 0.8.0 Jan 9 2014

 - NanDispose -> NanDisposePersistent, deprecate NanDispose
 - Extract _NAN_*_RETURN_TYPE, pull up NAN_*()

### 0.7.1 Jan 9 2014

 - Fixes to work against debug builds of Node
 - Safer NanPersistentToLocal (avoid reinterpret_cast)
 - Speed up common NanRawString case by only extracting flattened string when necessary

### 0.7.0 Dec 17 2013

 - New no-arg form of NanCallback() constructor.
 - NanCallback#Call takes Handle rather than Local
 - Removed deprecated NanCallback#Run method, use NanCallback#Call instead
 - Split off _NAN_*_ARGS_TYPE from _NAN_*_ARGS
 - Restore (unofficial) Node 0.6 compatibility at NanCallback#Call()
 - Introduce NanRawString() for char* (or appropriate void*) from v8::String
     (replacement for NanFromV8String)
 - Introduce NanCString() for null-terminated char* from v8::String

### 0.6.0 Nov 21 2013

 - Introduce NanNewLocal<T>(v8::Handle<T> value) for use in place of
     v8::Local<T>::New(...) since v8 started requiring isolate in Node 0.11.9

### 0.5.2 Nov 16 2013

 - Convert SavePersistent and GetFromPersistent in NanAsyncWorker from protected and public

### 0.5.1 Nov 12 2013

 - Use node::MakeCallback() instead of direct v8::Function::Call()

### 0.5.0 Nov 11 2013

 - Added @TooTallNate as collaborator
 - New, much simpler, "include_dirs" for binding.gyp
 - Added full range of NAN_INDEX_* macros to match NAN_PROPERTY_* macros

### 0.4.4 Nov 2 2013

 - Isolate argument from v8::Persistent::MakeWeak removed for 0.11.8+

### 0.4.3 Nov 2 2013

 - Include node_object_wrap.h, removed from node.h for Node 0.11.8.

### 0.4.2 Nov 2 2013

 - Handle deprecation of v8::Persistent::Dispose(v8::Isolate* isolate)) for
     Node 0.11.8 release.

### 0.4.1 Sep 16 2013

 - Added explicit `#include <uv.h>` as it was removed from node.h for v0.11.8

### 0.4.0 Sep 2 2013

 - Added NAN_INLINE and NAN_DEPRECATED and made use of them
 - Added NanError, NanTypeError and NanRangeError
 - Cleaned up code

### 0.3.2 Aug 30 2013

 - Fix missing scope declaration in GetFromPersistent() and SaveToPersistent
     in NanAsyncWorker

### 0.3.1 Aug 20 2013

 - fix "not all control paths return a value" compile warning on some platforms

### 0.3.0 Aug 19 2013

 - Made NAN work with NPM
 - Lots of fixes to NanFromV8String, pulling in features from new Node core
 - Changed node::encoding to Nan::Encoding in NanFromV8String to unify the API
 - Added optional error number argument for NanThrowError()
 - Added NanInitPersistent()
 - Added NanReturnNull() and NanReturnEmptyString()
 - Added NanLocker and NanUnlocker
 - Added missing scopes
 - Made sure to clear disposed Persistent handles
 - Changed NanAsyncWorker to allocate error messages on the heap
 - Changed NanThrowError(Local<Value>) to NanThrowError(Handle<Value>)
 - Fixed leak in NanAsyncWorker when errmsg is used

### 0.2.2 Aug 5 2013

 - Fixed usage of undefined variable with node::BASE64 in NanFromV8String()

### 0.2.1 Aug 5 2013

 - Fixed 0.8 breakage, node::BUFFER encoding type not available in 0.8 for
     NanFromV8String()

### 0.2.0 Aug 5 2013

 - Added NAN_PROPERTY_GETTER, NAN_PROPERTY_SETTER, NAN_PROPERTY_ENUMERATOR,
     NAN_PROPERTY_DELETER, NAN_PROPERTY_QUERY
 - Extracted _NAN_METHOD_ARGS, _NAN_GETTER_ARGS, _NAN_SETTER_ARGS,
     _NAN_PROPERTY_GETTER_ARGS, _NAN_PROPERTY_SETTER_ARGS,
     _NAN_PROPERTY_ENUMERATOR_ARGS, _NAN_PROPERTY_DELETER_ARGS,
     _NAN_PROPERTY_QUERY_ARGS
 - Added NanGetInternalFieldPointer, NanSetInternalFieldPointer
 - Added NAN_WEAK_CALLBACK, NAN_WEAK_CALLBACK_OBJECT,
     NAN_WEAK_CALLBACK_DATA, NanMakeWeak
 - Renamed THROW_ERROR to _NAN_THROW_ERROR
 - Added NanNewBufferHandle(char*, size_t, node::smalloc::FreeCallback, void*)
 - Added NanBufferUse(char*, uint32_t)
 - Added NanNewContextHandle(v8::ExtensionConfiguration*,
       v8::Handle<v8::ObjectTemplate>, v8::Handle<v8::Value>)
 - Fixed broken NanCallback#GetFunction()
 - Added optional encoding and size arguments to NanFromV8String()
 - Added NanGetPointerSafe() and NanSetPointerSafe()
 - Added initial test suite (to be expanded)
 - Allow NanUInt32OptionValue to convert any Number object

### 0.1.0 Jul 21 2013

 - Added `NAN_GETTER`, `NAN_SETTER`
 - Added `NanThrowError` with single Local<Value> argument
 - Added `NanNewBufferHandle` with single uint32_t argument
 - Added `NanHasInstance(Persistent<FunctionTemplate>&, Handle<Value>)`
 - Added `Local<Function> NanCallback#GetFunction()`
 - Added `NanCallback#Call(int, Local<Value>[])`
 - Deprecated `NanCallback#Run(int, Local<Value>[])` in favour of Call
