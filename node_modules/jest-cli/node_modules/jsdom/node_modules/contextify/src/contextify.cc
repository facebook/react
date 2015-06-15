#include "node.h"
#include "node_version.h"
#include "nan.h"
#include <string>
using namespace v8;
using namespace node;

class ContextWrap;

class ContextifyContext : public ObjectWrap {
public:
    Persistent<Context> context;
    Persistent<Object>  sandbox;
    Persistent<Object>  proxyGlobal;

    static Persistent<FunctionTemplate> jsTmpl;

    ContextifyContext(Local<Object> sbox) {
        NanScope();
        NanAssignPersistent(sandbox, sbox);
    }

    ~ContextifyContext() {
        NanDisposePersistent(context);
        NanDisposePersistent(proxyGlobal);
        NanDisposePersistent(sandbox);

        // Provide a GC hint that the context has gone away. Without this call it
        // does not seem that the collector will touch the context until under extreme
        // stress.
        NanContextDisposedNotification();
    }

    // We override ObjectWrap::Wrap so that we can create our context after
    // we have a reference to our "host" JavaScript object.  If we try to use
    // handle_ in the ContextifyContext constructor, it will be empty since it's
    // set in ObjectWrap::Wrap.
    void Wrap(Handle<Object> handle);

    static void Init(Handle<Object> target) {
        NanScope();

        Local<FunctionTemplate> ljsTmpl = NanNew<FunctionTemplate>(New);
        ljsTmpl->InstanceTemplate()->SetInternalFieldCount(1);
        ljsTmpl->SetClassName(NanNew("ContextifyContext"));
        NODE_SET_PROTOTYPE_METHOD(ljsTmpl, "run",       ContextifyContext::Run);
        NODE_SET_PROTOTYPE_METHOD(ljsTmpl, "getGlobal", ContextifyContext::GetGlobal);

        NanAssignPersistent(jsTmpl, ljsTmpl);
        target->Set(NanNew("ContextifyContext"), ljsTmpl->GetFunction());
    }

    static NAN_METHOD(New) {
        NanScope();

        if (args.Length() < 1) {
            NanThrowError("Wrong number of arguments passed to ContextifyContext constructor");
            NanReturnUndefined();
        }

        if (!args[0]->IsObject()) {
            NanThrowTypeError("Argument to ContextifyContext constructor must be an object.");
            NanReturnUndefined();
        }

        ContextifyContext* ctx = new ContextifyContext(args[0]->ToObject());
        ctx->Wrap(args.This());
        NanReturnValue(args.This());
    }

    static NAN_METHOD(Run) {
        NanScope();
        if (args.Length() == 0) {
            NanThrowError("Must supply at least 1 argument to run");
        }
        if (!args[0]->IsString()) {
            NanThrowTypeError("First argument to run must be a String.");
            NanReturnUndefined();
        }
        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextifyContext>(args.This());
        Local<Context> lcontext = NanNew(ctx->context);
        lcontext->Enter();
        Local<String> code = args[0]->ToString();

        TryCatch trycatch;
        Local<NanBoundScript> script;

        if (args.Length() > 1 && args[1]->IsString()) {
            ScriptOrigin origin(args[1]->ToString());
            script = NanCompileScript(code, origin);
        } else {
            script = NanCompileScript(code);
        }

        if (script.IsEmpty()) {
          lcontext->Exit();
          NanReturnValue(trycatch.ReThrow());
        }

        Handle<Value> result = NanRunScript(script);
        lcontext->Exit();

        if (result.IsEmpty()) {
            NanReturnValue(trycatch.ReThrow());
        }

        NanReturnValue(result);
    }

    static bool InstanceOf(Handle<Value> value) {
      return NanHasInstance(jsTmpl, value);
    }

    static NAN_METHOD(GetGlobal) {
        NanScope();
        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextifyContext>(args.This());
        NanReturnValue(NanNew(ctx->proxyGlobal));
    }
};

// This is an object that just keeps an internal pointer to this
// ContextifyContext.  It's passed to the NamedPropertyHandler.  If we
// pass the main JavaScript context object we're embedded in, then the
// NamedPropertyHandler will store a reference to it forever and keep it
// from getting gc'd.
class ContextWrap : public ObjectWrap {
public:
    static void Init(void) {
        NanScope();
        Local<FunctionTemplate> tmpl = NanNew<FunctionTemplate>();
        tmpl->InstanceTemplate()->SetInternalFieldCount(1);
        NanAssignPersistent(functionTemplate, tmpl);
        NanAssignPersistent(constructor, tmpl->GetFunction());
    }

    static Local<Context> createV8Context(Handle<Object> jsContextify) {
        NanEscapableScope();
        Local<Object> wrapper = NanNew(constructor)->NewInstance();

        ContextWrap *contextWrapper = new ContextWrap();
        contextWrapper->Wrap(wrapper);

        Local<Object> obj = NanNew(jsContextify);
        NanMakeWeakPersistent(obj, contextWrapper, &weakCallback);
        contextWrapper->ctx = ObjectWrap::Unwrap<ContextifyContext>(jsContextify);

        Local<FunctionTemplate> ftmpl = NanNew<FunctionTemplate>();
        ftmpl->SetHiddenPrototype(true);
        ftmpl->SetClassName(NanNew(contextWrapper->ctx->sandbox)->GetConstructorName());
        Local<ObjectTemplate> otmpl = ftmpl->InstanceTemplate();
        otmpl->SetNamedPropertyHandler(GlobalPropertyGetter,
                                       GlobalPropertySetter,
                                       GlobalPropertyQuery,
                                       GlobalPropertyDeleter,
                                       GlobalPropertyEnumerator,
                                       wrapper);
        otmpl->SetAccessCheckCallbacks(GlobalPropertyNamedAccessCheck,
                                       GlobalPropertyIndexedAccessCheck);
        return NanEscapeScope(NanNew<Context>(
            static_cast<ExtensionConfiguration*>(NULL), otmpl));
    }

private:
    ContextWrap() :ctx(NULL) {}

    ~ContextWrap() {
    }

    static bool GlobalPropertyNamedAccessCheck(Local<Object> host,
                                               Local<Value>  key,
                                               AccessType    type,
                                               Local<Value>  data) {
        return true;
    }

    static bool GlobalPropertyIndexedAccessCheck(Local<Object> host,
                                                 uint32_t      key,
                                                 AccessType    type,
                                                 Local<Value>  data) {
        return true;
    }

    static NAN_PROPERTY_GETTER(GlobalPropertyGetter) {
        NanScope();
        Local<Object> data = args.Data()->ToObject();
        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextWrap>(data)->ctx;
        if (!ctx)
            NanReturnUndefined();
        Local<Value> rv = NanNew(ctx->sandbox)->GetRealNamedProperty(property);
        if (rv.IsEmpty()) {
            rv = NanNew(ctx->proxyGlobal)->GetRealNamedProperty(property);
        }
        NanReturnValue(rv);
    }

    static NAN_PROPERTY_SETTER(GlobalPropertySetter) {
        NanScope();
        Local<Object> data = args.Data()->ToObject();
        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextWrap>(data)->ctx;
        if (!ctx)
            NanReturnUndefined();
        NanNew(ctx->sandbox)->Set(property, value);
        NanReturnValue(value);
    }

    static NAN_PROPERTY_QUERY(GlobalPropertyQuery) {
        NanScope();
        Local<Object> data = args.Data()->ToObject();
        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextWrap>(data)->ctx;
        if (!ctx)
            NanReturnValue(NanNew<Integer>(None));
        if (!NanNew(ctx->sandbox)->GetRealNamedProperty(property).IsEmpty() ||
            !NanNew(ctx->proxyGlobal)->GetRealNamedProperty(property).IsEmpty()) {
            NanReturnValue(NanNew<Integer>(None));
         } else {
            NanReturnValue(Handle<Integer>());
         }
    }

    static NAN_PROPERTY_DELETER(GlobalPropertyDeleter) {
        NanScope();
        Local<Object> data = args.Data()->ToObject();
        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextWrap>(data)->ctx;
        if (!ctx)
            NanReturnValue(NanNew<Boolean>(false));
        bool success = NanNew(ctx->sandbox)->Delete(property);
        NanReturnValue(NanNew<Boolean>(success));
    }

    static NAN_PROPERTY_ENUMERATOR(GlobalPropertyEnumerator) {
        NanScope();
        Local<Object> data = args.Data()->ToObject();
        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextWrap>(data)->ctx;
        if (!ctx) {
            Local<Array> blank = Array::New(0);
            NanReturnValue(blank);
        }
        NanReturnValue(NanNew(ctx->sandbox)->GetPropertyNames());
    }

    NAN_WEAK_CALLBACK(weakCallback) {
        ContextWrap *self = data.GetParameter();
        self->ctx = NULL;
    }

    static Persistent<FunctionTemplate> functionTemplate;
    static Persistent<Function>         constructor;
    ContextifyContext                   *ctx;
};

Persistent<FunctionTemplate> ContextWrap::functionTemplate;
Persistent<Function>         ContextWrap::constructor;

void ContextifyContext::Wrap(Handle<Object> handle) {
    ObjectWrap::Wrap(handle);
    Local<Context> lcontext = ContextWrap::createV8Context(handle);
    NanAssignPersistent(context, lcontext);
    NanAssignPersistent(proxyGlobal, lcontext->Global());
}

class ContextifyScript : public ObjectWrap {
public:
    static Persistent<FunctionTemplate> scriptTmpl;
    Persistent<NanUnboundScript> script;

    static void Init(Handle<Object> target) {
        NanScope();
        Local<FunctionTemplate> lscriptTmpl = NanNew<FunctionTemplate>(New);
        lscriptTmpl->InstanceTemplate()->SetInternalFieldCount(1);
        lscriptTmpl->SetClassName(NanNew("ContextifyScript"));

        NODE_SET_PROTOTYPE_METHOD(lscriptTmpl, "runInContext", RunInContext);

        NanAssignPersistent(scriptTmpl, lscriptTmpl);
        target->Set(NanNew("ContextifyScript"),
                    lscriptTmpl->GetFunction());
    }
    static NAN_METHOD(New) {
        NanScope();
        ContextifyScript *contextify_script = new ContextifyScript();
        contextify_script->Wrap(args.Holder());

        if (args.Length() < 1) {
          NanThrowTypeError("needs at least 'code' argument.");
          NanReturnUndefined();
        }

        Local<String> code = args[0]->ToString();
        Local<String> filename = args.Length() > 1
                               ? args[1]->ToString()
                               : NanNew<String>("ContextifyScript.<anonymous>");

        Handle<Context> context = NanGetCurrentContext();
        Context::Scope context_scope(context);

        // Catch errors
        TryCatch trycatch;

        ScriptOrigin origin(filename);
        Handle<NanUnboundScript> v8_script = NanNew<NanUnboundScript>(code, origin);

        if (v8_script.IsEmpty()) {
          NanReturnValue(trycatch.ReThrow());
        }

        NanAssignPersistent(contextify_script->script, v8_script);

        NanReturnValue(args.This());
    }

    static NAN_METHOD(RunInContext) {
        NanScope();
        if (args.Length() == 0) {
            NanThrowError("Must supply at least 1 argument to runInContext");
            NanReturnUndefined();
        }
        if (!ContextifyContext::InstanceOf(args[0]->ToObject())) {
            NanThrowTypeError("First argument must be a ContextifyContext.");
            NanReturnUndefined();
        }

        ContextifyContext* ctx = ObjectWrap::Unwrap<ContextifyContext>(args[0]->ToObject());
        Local<Context> lcontext = NanNew(ctx->context);
        lcontext->Enter();
        ContextifyScript* wrapped_script = ObjectWrap::Unwrap<ContextifyScript>(args.This());
        Local<NanUnboundScript> script = NanNew(wrapped_script->script);
        TryCatch trycatch;
        if (script.IsEmpty()) {
          lcontext->Exit();
          NanReturnValue(trycatch.ReThrow());
        }
        Handle<Value> result = NanRunScript(script);
        lcontext->Exit();
        if (result.IsEmpty()) {
            NanReturnValue(trycatch.ReThrow());
        }
        NanReturnValue(result);
    }

    ~ContextifyScript() {
        NanDisposePersistent(script);
    }
};

Persistent<FunctionTemplate> ContextifyContext::jsTmpl;
Persistent<FunctionTemplate> ContextifyScript::scriptTmpl;

extern "C" {
    static void init(Handle<Object> target) {
        ContextifyContext::Init(target);
        ContextifyScript::Init(target);
        ContextWrap::Init();
    }
    NODE_MODULE(contextify, init)
};
