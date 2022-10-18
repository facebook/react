/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <errno.h>
#include <stdlib.h>
#include <string.h>

#include <fstream>
#include <iostream>
#include <string>

#include <JavaScriptCore/JavaScript.h>

#include "hardware-counter.h"

using HPHP::HardwareCounter;

void add_native_hook(
  JSContextRef ctx,
  JSObjectRef obj,
  const char *name,
  JSObjectCallAsFunctionCallback hook
) {
  JSStringRef jsName = JSStringCreateWithUTF8CString(name);
  JSObjectSetProperty(
    ctx,
    obj,
    jsName,
    JSObjectMakeFunctionWithCallback(ctx, jsName, hook),
    kJSPropertyAttributeNone,
    NULL
  );
  JSStringRelease(jsName);
}

static void fprint_value(
  FILE *file,
  JSContextRef context,
  JSValueRef obj
) {
  JSStringRef jsStr = JSValueToStringCopy(context, obj, NULL);
  size_t size = JSStringGetMaximumUTF8CStringSize(jsStr);
  char *str = (char *) calloc(
    size,
    1
  );
  JSStringGetUTF8CString(
    jsStr,
    str,
    size
  );
  JSStringRelease(jsStr);
  fprintf(file, "%s", str);
  free(str);
}

static JSValueRef js_print(
  JSContextRef context,
  JSObjectRef object,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception
) {
  for (int i = 0; i < argumentCount; i++) {
    if (i != 0) {
      printf(" ");
    }
    fprint_value(stdout, context, arguments[i]);
  }
  printf("\n");
  return JSValueMakeUndefined(context);
}

static JSValueRef js_perf_counters_init(
  JSContextRef context,
  JSObjectRef object,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception
) {
  // TODO: Allow customizing recorded events
  bool enable = true;
  std::string events = "";
  bool recordSubprocesses = false;
  HardwareCounter::Init(enable, events, recordSubprocesses);
  HardwareCounter::s_counter.getCheck();

  return JSValueMakeUndefined(context);
}

static JSValueRef js_perf_counters_get_counters(
  JSContextRef context,
  JSObjectRef object,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception
) {
  JSObjectRef result = JSObjectMake(context, NULL, NULL);
  std::pair<JSContextRef, JSObjectRef> pair(context, result);

  HardwareCounter::GetPerfEvents(
    [](const std::string& key, int64_t value, void* data) {
      std::pair<JSContextRef, JSObjectRef>& pair =
        *reinterpret_cast<std::pair<JSContextRef, JSObjectRef>*>(data);
      JSContextRef context = pair.first;
      JSObjectRef result = pair.second;

      JSObjectSetProperty(
        context,
        result,
        JSStringCreateWithUTF8CString(key.c_str()),
        JSValueMakeNumber(context, value),
        kJSPropertyAttributeNone,
        NULL
      );
    },
    &pair);

  return result;
}

int main(int argc, char **argv) {
  if (argc != 2) {
    fprintf(stderr, "usage: jsc-runner file\n");
    exit(1);
  }

  char *filename = argv[1];
  std::ifstream ifs(filename);
  if (ifs.fail()) {
    std::cerr << "Error opening \"" << filename << "\": " << strerror(errno) << "\n";
    exit(1);
  }
  std::string script(
    (std::istreambuf_iterator<char>(ifs)),
    (std::istreambuf_iterator<char>())
  );
  JSStringRef jsScript = JSStringCreateWithUTF8CString(script.c_str());
  JSStringRef jsURL = JSStringCreateWithUTF8CString(argv[1]);

  JSGlobalContextRef ctx = JSGlobalContextCreate(NULL);
  add_native_hook(
    ctx,
    JSContextGetGlobalObject(ctx),
    "print",
    js_print
  );

  JSObjectRef jsPerfCounters = JSObjectMake(ctx, NULL, NULL);
  add_native_hook(
    ctx,
    jsPerfCounters,
    "init",
    js_perf_counters_init
  );
  add_native_hook(
    ctx,
    jsPerfCounters,
    "getCounters",
    js_perf_counters_get_counters
  );
  JSObjectSetProperty(
    ctx,
    JSContextGetGlobalObject(ctx),
    JSStringCreateWithUTF8CString("PerfCounters"),
    jsPerfCounters,
    kJSPropertyAttributeNone,
    NULL
  );

  JSValueRef jsError = NULL;
  JSValueRef result = JSEvaluateScript(
    ctx,
    jsScript,
    NULL,
    jsURL,
    0,
    &jsError
  );
  if (!result) {
    fprintf(stderr, "Exception: ");
    fprint_value(stderr, ctx, jsError);
    fprintf(stderr, "\n");
    JSStringRef jsStackStr = JSStringCreateWithUTF8CString("stack");
    if (JSValueIsObject(ctx, jsError)) {
      JSValueRef jsStack = JSObjectGetProperty(ctx, (JSObjectRef)jsError, jsStackStr, NULL);
      JSStringRelease(jsStackStr);
      fprint_value(stderr, ctx, jsStack);
      fprintf(stderr, "\n");
    }
    exit(1);
  }

  JSGlobalContextRelease(ctx);
}
