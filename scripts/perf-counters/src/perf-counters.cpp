/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <node.h>

#include "hardware-counter.h"

namespace PerfCounters {

using HPHP::HardwareCounter;

void Init(const v8::FunctionCallbackInfo<v8::Value>& args) {
  // TODO: Allow customizing recorded events
  bool enable = true;
  std::string events = "";
  bool recordSubprocesses = false;
  HardwareCounter::Init(enable, events, recordSubprocesses);
  HardwareCounter::s_counter.getCheck();
}

void GetCounters(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::Local<v8::Object> obj = v8::Object::New(isolate);
  std::pair<v8::Isolate*, v8::Local<v8::Object>> pair(isolate, obj);

  HardwareCounter::GetPerfEvents(
    [](const std::string& key, int64_t value, void* data) {
      std::pair<v8::Isolate*, v8::Local<v8::Object>>& pair =
        *reinterpret_cast<std::pair<v8::Isolate*, v8::Local<v8::Object>>*>(data);
      v8::Isolate* isolate = pair.first;
      v8::Local<v8::Object> obj = pair.second;
      obj->Set(
        v8::String::NewFromUtf8(isolate, key.c_str()),
        v8::Number::New(isolate, value)
      );
    },
    &pair);

  args.GetReturnValue().Set(obj);
}

void InitModule(v8::Local<v8::Object> exports) {
  NODE_SET_METHOD(exports, "init", Init);
  NODE_SET_METHOD(exports, "getCounters", GetCounters);
}

NODE_MODULE(perfcounters, InitModule)

}
