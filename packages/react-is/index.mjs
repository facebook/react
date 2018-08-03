import * as dev from './esm/react-is.development.js';
import * as prod from './esm/react-is.production.min.js';

export var typeOf =
  process.env.NODE_ENV !== 'production' ? dev.typeOf : prod.typeOf;
export var AsyncMode =
  process.env.NODE_ENV !== 'production' ? dev.AsyncMode : prod.AsyncMode;
export var ContextConsumer =
  process.env.NODE_ENV !== 'production' ? dev.ContextConsumer : prod.ContextConsumer;
export var ContextProvider =
  process.env.NODE_ENV !== 'production' ? dev.ContextProvider : prod.ContextProvider;
export var Element =
  process.env.NODE_ENV !== 'production' ? dev.Element : prod.Element;
export var ForwardRef =
  process.env.NODE_ENV !== 'production' ? dev.ForwardRef : prod.ForwardRef;
export var Fragment =
  process.env.NODE_ENV !== 'production' ? dev.Fragment : prod.Fragment;
export var Fragment =
  process.env.NODE_ENV !== 'production' ? dev.Fragment : prod.Fragment;
export var Profiler =
  process.env.NODE_ENV !== 'production' ? dev.Profiler : prod.Profiler;
export var Portal =
  process.env.NODE_ENV !== 'production' ? dev.Portal : prod.Portal;
export var StrictMode =
  process.env.NODE_ENV !== 'production' ? dev.StrictMode : prod.StrictMode;
export var isValidElementType =
  process.env.NODE_ENV !== 'production' ? dev.isValidElementType : prod.isValidElementType;
export var isAsyncMode =
  process.env.NODE_ENV !== 'production' ? dev.isAsyncMode : prod.isAsyncMode;
export var isContextConsumer =
  process.env.NODE_ENV !== 'production' ? dev.isContextConsumer : prod.isContextConsumer;
export var isContextProvider =
  process.env.NODE_ENV !== 'production' ? dev.isContextProvider : prod.isContextProvider;
export var isElement =
  process.env.NODE_ENV !== 'production' ? dev.isElement : prod.isElement;
export var isForwardRef =
  process.env.NODE_ENV !== 'production' ? dev.isForwardRef : prod.isForwardRef;
export var isFragment =
  process.env.NODE_ENV !== 'production' ? dev.isFragment : prod.isFragment;
export var isProfiler =
  process.env.NODE_ENV !== 'production' ? dev.isProfiler : prod.isProfiler;
export var isPortal =
  process.env.NODE_ENV !== 'production' ? dev.isPortal : prod.isPortal;
export var isStrictMode =
  process.env.NODE_ENV !== 'production' ? dev.isStrictMode : prod.isStrictMode;
