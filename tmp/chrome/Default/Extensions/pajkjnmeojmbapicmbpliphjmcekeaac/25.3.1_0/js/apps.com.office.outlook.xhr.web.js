!function() {
  const blob = new Blob([ '/******/ (() => { // webpackBootstrap\n/******/ \t"use strict";\n\n;// ./src/services/webworker-communication.ts\nconst webworker_communication_dispatchOnWebWorker = (eventType, data, webworker = self) => {\n    webworker.postMessage({ type: eventType, eventData: data });\n};\nconst listenOnWebWorker = (eventType, callback) => {\n    self.onmessage = (event) => {\n        const { type, eventData } = event.data;\n        if (type === eventType) {\n            callback(eventData);\n        }\n    };\n};\n\n;// ./src/libs/fetch-intercept/index.ts\nlet interceptors = [];\nfunction interceptor(fetch, ...args) {\n    const reversedInterceptors = interceptors.reduce((array, interceptor) => [interceptor].concat(array), []);\n    let promise = Promise.resolve(args);\n    // Register request interceptors\n    reversedInterceptors.forEach(({ request, requestError }) => {\n        if (request || requestError) {\n            promise = promise.then((args) => (request ? request(...args) : args), requestError);\n        }\n    });\n    // Register fetch call\n    const fetchPromise = promise.then(([url, config]) => {\n        const request = new Request(url, config);\n        return fetch(request)\n            .then((response) => {\n            const fetchResponse = response;\n            fetchResponse.request = url instanceof Request ? url : request;\n            return fetchResponse;\n        })\n            .catch((error) => {\n            error.request = request; // Add request to error for debugging\n            return Promise.reject(error);\n        });\n    });\n    // Register response interceptors\n    let finalPromise = fetchPromise;\n    reversedInterceptors.forEach(({ response, responseError }) => {\n        if (response || responseError) {\n            finalPromise = finalPromise.then(response, responseError);\n        }\n    });\n    return finalPromise;\n}\nfunction attach(env) {\n    // Ensure fetch is available in the given environment\n    if (!env.fetch) {\n        throw new Error("No fetch available. Unable to register fetch-intercept");\n    }\n    env.fetch = (function (fetch) {\n        return function (...args) {\n            return interceptor(fetch, ...args);\n        };\n    })(env.fetch);\n    return {\n        register: function (interceptor) {\n            interceptors.push(interceptor);\n            return () => {\n                const index = interceptors.indexOf(interceptor);\n                if (index >= 0) {\n                    interceptors.splice(index, 1);\n                }\n            };\n        },\n        clear: function () {\n            interceptors = [];\n        },\n    };\n}\nconst ENVIRONMENT_IS_WORKER = typeof importScripts === "function";\n/* harmony default export */ const fetch_intercept = (attach(ENVIRONMENT_IS_WORKER ?\n    self\n    : window));\n\n;// ./node_modules/webext-detect/index.js\nlet cache = true;\nfunction disableWebextDetectPageCache() {\n    cache = false;\n}\nfunction isCurrentPathname(path) {\n    if (!path) {\n        return false;\n    }\n    try {\n        const { pathname } = new URL(path, location.origin);\n        return pathname === location.pathname;\n    }\n    catch {\n        return false;\n    }\n}\nfunction getManifest(_version) {\n    return globalThis.chrome?.runtime?.getManifest?.();\n}\nfunction once(function_) {\n    let result;\n    return () => {\n        if (!cache || result === undefined) {\n            result = function_();\n        }\n        return result;\n    };\n}\n/** Indicates whether the code is being run on http(s):// pages (it could be in a content script or regular web context) */\nconst isWebPage = once(() => [\'about:\', \'http:\', \'https:\'].includes(location.protocol));\n/** Indicates whether you\'re in extension contexts that have access to the chrome API */\nconst isExtensionContext = once(() => typeof globalThis.chrome?.runtime?.id === \'string\');\n/** Indicates whether you\'re in a sandboxed page (-extension:// URL protocol, but no chrome.* API access) */\nconst isSandboxedPage = once(() => location.protocol.endsWith(\'-extension:\') && !isExtensionContext());\n/** Indicates whether you\'re in a content script. Note that the MAIN world is not considered a content script. */\nconst isContentScript = once(() => isExtensionContext() && isWebPage());\n/** Indicates whether you\'re in a background context */\nconst isBackground = () => isBackgroundPage() || isBackgroundWorker();\n/** Indicates whether you\'re in a background page */\nconst isBackgroundPage = once(() => {\n    const manifest = getManifest(2);\n    if (!manifest) {\n        return false;\n    }\n    if (isCurrentPathname(manifest.background_page ?? manifest.background?.page)) {\n        return true;\n    }\n    return Boolean(manifest.background?.scripts\n        && isCurrentPathname(\'/_generated_background_page.html\'));\n});\n/** Indicates whether you\'re in a background worker */\nconst isBackgroundWorker = once(() => isCurrentPathname(getManifest(3)?.background?.service_worker));\n/** Indicates whether you\'re in a persistent background page (as opposed to an Event Page or Background Worker, both of which can be unloaded by the browser) */\nconst isPersistentBackgroundPage = once(() => isBackgroundPage()\n    && getManifest(2)?.manifest_version === 2 // Firefox can have a background page on MV3, but can\'t be persistent\n    && getManifest(2)?.background?.persistent !== false);\n/** Indicates whether you\'re in an options page. This only works if the current page’s URL matches the one specified in the extension\'s `manifest.json` */\nconst isOptionsPage = once(() => isCurrentPathname(getManifest()?.options_ui?.page ?? getManifest()?.options_page));\n/** Indicates whether you\'re in a side panel. This only works if the current page’s URL matches the one specified in the extension\'s `manifest.json` */\nconst isSidePanel = once(() => \n// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Not yet in @types/chrome\nisCurrentPathname(getManifest(3)?.[\'side_panel\']?.default_path));\nconst isActionPopup = once(() => {\n    // Chrome-only; Firefox uses the whole window…\n    if (globalThis.outerHeight - globalThis.innerHeight === 14) {\n        return true;\n    }\n    return isCurrentPathname(getManifest(3)?.action?.default_popup ?? getManifest(2)?.browser_action?.default_popup);\n});\n/** Indicates whether you\'re in the main dev tools page, the one specified in the extension\'s `manifest.json` `devtools_page` field. */\nconst isMainDevToolsPage = once(() => isExtensionContext()\n    && Boolean(chrome.devtools)\n    && isCurrentPathname(getManifest()?.devtools_page));\n// TODO: When dropping this, also rename the `devToolsPage` context name below\n/** @deprecated Use `isMainDevToolsPage` instead */\nconst isDevToolsPage = isMainDevToolsPage;\n/** Indicates whether you\'re in the dev tools page. Unlike `isDevToolsPage`, this works in any page that has the `chrome.devTools` API */\nconst isDevTools = () => Boolean(globalThis.chrome?.devtools);\n/** Indicates whether you\'re in a document created via chrome.offscreen */\nconst isOffscreenDocument = once(() => isExtensionContext()\n    && \'document\' in globalThis\n    && globalThis.chrome?.extension === undefined);\n/** Loosely detect Firefox via user agent */\nconst isFirefox = () => globalThis.navigator?.userAgent.includes(\'Firefox\');\n/** Loosely detect Chrome via user agent (might also include Chromium and forks like Opera) */\nconst isChrome = () => globalThis.navigator?.userAgent.includes(\'Chrome\');\n/** Loosely detect Safari via user agent */\nconst isSafari = () => !isChrome() && globalThis.navigator?.userAgent.includes(\'Safari\');\n/** Loosely detect Mobile Safari via user agent */\nconst isMobileSafari = () => isSafari() && globalThis.navigator?.userAgent.includes(\'Mobile\');\nconst contextChecks = {\n    contentScript: isContentScript,\n    background: isBackground,\n    options: isOptionsPage,\n    sidePanel: isSidePanel,\n    actionPopup: isActionPopup,\n    devTools: isDevTools,\n    devToolsPage: isDevToolsPage,\n    offscreenDocument: isOffscreenDocument,\n    extension: isExtensionContext,\n    sandbox: isSandboxedPage,\n    web: isWebPage,\n};\nconst contextNames = Object.keys(contextChecks);\n/** Returns the first matching context among those defined in `ContextName`, depending on the current context. Returns "unknown" if no match is found. */\nfunction getContextName() {\n    for (const [name, test] of Object.entries(contextChecks)) {\n        if (test()) {\n            return name;\n        }\n    }\n    return \'unknown\';\n}\n\n;// ./src/apps/common/globals.ts\n\nconst globals_isWebWorkerContext = () => {\n    return (typeof importScripts === "function" &&\n        !getContextName().includes("background"));\n};\nconst globals_globals = globals_isWebWorkerContext() ? self : window;\n\n;// ./src/services/promise-timeout.ts\nconst awaitTimeout = (delay, reason, defaultResolve = undefined) => new Promise((resolve, reject) => setTimeout(() => (reason === undefined ? resolve(defaultResolve) : reject(reason)), delay));\n\n;// ./src/apps/common/abort-controller.ts\nconst abortController = new AbortController();\nconst unsubscribe = () => {\n    abortController.abort();\n};\nconst abort_controller_getSignal = () => abortController.signal;\nconst onCleanup = (callback) => {\n    abort_controller_getSignal().addEventListener("abort", callback);\n};\n\n;// ./node_modules/zod/lib/index.mjs\nvar util;\n(function (util) {\n    util.assertEqual = (val) => val;\n    function assertIs(_arg) { }\n    util.assertIs = assertIs;\n    function assertNever(_x) {\n        throw new Error();\n    }\n    util.assertNever = assertNever;\n    util.arrayToEnum = (items) => {\n        const obj = {};\n        for (const item of items) {\n            obj[item] = item;\n        }\n        return obj;\n    };\n    util.getValidEnumValues = (obj) => {\n        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");\n        const filtered = {};\n        for (const k of validKeys) {\n            filtered[k] = obj[k];\n        }\n        return util.objectValues(filtered);\n    };\n    util.objectValues = (obj) => {\n        return util.objectKeys(obj).map(function (e) {\n            return obj[e];\n        });\n    };\n    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban\n        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban\n        : (object) => {\n            const keys = [];\n            for (const key in object) {\n                if (Object.prototype.hasOwnProperty.call(object, key)) {\n                    keys.push(key);\n                }\n            }\n            return keys;\n        };\n    util.find = (arr, checker) => {\n        for (const item of arr) {\n            if (checker(item))\n                return item;\n        }\n        return undefined;\n    };\n    util.isInteger = typeof Number.isInteger === "function"\n        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban\n        : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;\n    function joinValues(array, separator = " | ") {\n        return array\n            .map((val) => (typeof val === "string" ? `\'${val}\'` : val))\n            .join(separator);\n    }\n    util.joinValues = joinValues;\n    util.jsonStringifyReplacer = (_, value) => {\n        if (typeof value === "bigint") {\n            return value.toString();\n        }\n        return value;\n    };\n})(util || (util = {}));\nvar objectUtil;\n(function (objectUtil) {\n    objectUtil.mergeShapes = (first, second) => {\n        return {\n            ...first,\n            ...second, // second overwrites first\n        };\n    };\n})(objectUtil || (objectUtil = {}));\nconst ZodParsedType = util.arrayToEnum([\n    "string",\n    "nan",\n    "number",\n    "integer",\n    "float",\n    "boolean",\n    "date",\n    "bigint",\n    "symbol",\n    "function",\n    "undefined",\n    "null",\n    "array",\n    "object",\n    "unknown",\n    "promise",\n    "void",\n    "never",\n    "map",\n    "set",\n]);\nconst getParsedType = (data) => {\n    const t = typeof data;\n    switch (t) {\n        case "undefined":\n            return ZodParsedType.undefined;\n        case "string":\n            return ZodParsedType.string;\n        case "number":\n            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;\n        case "boolean":\n            return ZodParsedType.boolean;\n        case "function":\n            return ZodParsedType.function;\n        case "bigint":\n            return ZodParsedType.bigint;\n        case "symbol":\n            return ZodParsedType.symbol;\n        case "object":\n            if (Array.isArray(data)) {\n                return ZodParsedType.array;\n            }\n            if (data === null) {\n                return ZodParsedType.null;\n            }\n            if (data.then &&\n                typeof data.then === "function" &&\n                data.catch &&\n                typeof data.catch === "function") {\n                return ZodParsedType.promise;\n            }\n            if (typeof Map !== "undefined" && data instanceof Map) {\n                return ZodParsedType.map;\n            }\n            if (typeof Set !== "undefined" && data instanceof Set) {\n                return ZodParsedType.set;\n            }\n            if (typeof Date !== "undefined" && data instanceof Date) {\n                return ZodParsedType.date;\n            }\n            return ZodParsedType.object;\n        default:\n            return ZodParsedType.unknown;\n    }\n};\n\nconst ZodIssueCode = util.arrayToEnum([\n    "invalid_type",\n    "invalid_literal",\n    "custom",\n    "invalid_union",\n    "invalid_union_discriminator",\n    "invalid_enum_value",\n    "unrecognized_keys",\n    "invalid_arguments",\n    "invalid_return_type",\n    "invalid_date",\n    "invalid_string",\n    "too_small",\n    "too_big",\n    "invalid_intersection_types",\n    "not_multiple_of",\n    "not_finite",\n]);\nconst quotelessJson = (obj) => {\n    const json = JSON.stringify(obj, null, 2);\n    return json.replace(/"([^"]+)":/g, "$1:");\n};\nclass ZodError extends Error {\n    constructor(issues) {\n        super();\n        this.issues = [];\n        this.addIssue = (sub) => {\n            this.issues = [...this.issues, sub];\n        };\n        this.addIssues = (subs = []) => {\n            this.issues = [...this.issues, ...subs];\n        };\n        const actualProto = new.target.prototype;\n        if (Object.setPrototypeOf) {\n            // eslint-disable-next-line ban/ban\n            Object.setPrototypeOf(this, actualProto);\n        }\n        else {\n            this.__proto__ = actualProto;\n        }\n        this.name = "ZodError";\n        this.issues = issues;\n    }\n    get errors() {\n        return this.issues;\n    }\n    format(_mapper) {\n        const mapper = _mapper ||\n            function (issue) {\n                return issue.message;\n            };\n        const fieldErrors = { _errors: [] };\n        const processError = (error) => {\n            for (const issue of error.issues) {\n                if (issue.code === "invalid_union") {\n                    issue.unionErrors.map(processError);\n                }\n                else if (issue.code === "invalid_return_type") {\n                    processError(issue.returnTypeError);\n                }\n                else if (issue.code === "invalid_arguments") {\n                    processError(issue.argumentsError);\n                }\n                else if (issue.path.length === 0) {\n                    fieldErrors._errors.push(mapper(issue));\n                }\n                else {\n                    let curr = fieldErrors;\n                    let i = 0;\n                    while (i < issue.path.length) {\n                        const el = issue.path[i];\n                        const terminal = i === issue.path.length - 1;\n                        if (!terminal) {\n                            curr[el] = curr[el] || { _errors: [] };\n                            // if (typeof el === "string") {\n                            //   curr[el] = curr[el] || { _errors: [] };\n                            // } else if (typeof el === "number") {\n                            //   const errorArray: any = [];\n                            //   errorArray._errors = [];\n                            //   curr[el] = curr[el] || errorArray;\n                            // }\n                        }\n                        else {\n                            curr[el] = curr[el] || { _errors: [] };\n                            curr[el]._errors.push(mapper(issue));\n                        }\n                        curr = curr[el];\n                        i++;\n                    }\n                }\n            }\n        };\n        processError(this);\n        return fieldErrors;\n    }\n    static assert(value) {\n        if (!(value instanceof ZodError)) {\n            throw new Error(`Not a ZodError: ${value}`);\n        }\n    }\n    toString() {\n        return this.message;\n    }\n    get message() {\n        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);\n    }\n    get isEmpty() {\n        return this.issues.length === 0;\n    }\n    flatten(mapper = (issue) => issue.message) {\n        const fieldErrors = {};\n        const formErrors = [];\n        for (const sub of this.issues) {\n            if (sub.path.length > 0) {\n                fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];\n                fieldErrors[sub.path[0]].push(mapper(sub));\n            }\n            else {\n                formErrors.push(mapper(sub));\n            }\n        }\n        return { formErrors, fieldErrors };\n    }\n    get formErrors() {\n        return this.flatten();\n    }\n}\nZodError.create = (issues) => {\n    const error = new ZodError(issues);\n    return error;\n};\n\nconst errorMap = (issue, _ctx) => {\n    let message;\n    switch (issue.code) {\n        case ZodIssueCode.invalid_type:\n            if (issue.received === ZodParsedType.undefined) {\n                message = "Required";\n            }\n            else {\n                message = `Expected ${issue.expected}, received ${issue.received}`;\n            }\n            break;\n        case ZodIssueCode.invalid_literal:\n            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;\n            break;\n        case ZodIssueCode.unrecognized_keys:\n            message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;\n            break;\n        case ZodIssueCode.invalid_union:\n            message = `Invalid input`;\n            break;\n        case ZodIssueCode.invalid_union_discriminator:\n            message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;\n            break;\n        case ZodIssueCode.invalid_enum_value:\n            message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received \'${issue.received}\'`;\n            break;\n        case ZodIssueCode.invalid_arguments:\n            message = `Invalid function arguments`;\n            break;\n        case ZodIssueCode.invalid_return_type:\n            message = `Invalid function return type`;\n            break;\n        case ZodIssueCode.invalid_date:\n            message = `Invalid date`;\n            break;\n        case ZodIssueCode.invalid_string:\n            if (typeof issue.validation === "object") {\n                if ("includes" in issue.validation) {\n                    message = `Invalid input: must include "${issue.validation.includes}"`;\n                    if (typeof issue.validation.position === "number") {\n                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;\n                    }\n                }\n                else if ("startsWith" in issue.validation) {\n                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;\n                }\n                else if ("endsWith" in issue.validation) {\n                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;\n                }\n                else {\n                    util.assertNever(issue.validation);\n                }\n            }\n            else if (issue.validation !== "regex") {\n                message = `Invalid ${issue.validation}`;\n            }\n            else {\n                message = "Invalid";\n            }\n            break;\n        case ZodIssueCode.too_small:\n            if (issue.type === "array")\n                message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;\n            else if (issue.type === "string")\n                message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;\n            else if (issue.type === "number")\n                message = `Number must be ${issue.exact\n                    ? `exactly equal to `\n                    : issue.inclusive\n                        ? `greater than or equal to `\n                        : `greater than `}${issue.minimum}`;\n            else if (issue.type === "date")\n                message = `Date must be ${issue.exact\n                    ? `exactly equal to `\n                    : issue.inclusive\n                        ? `greater than or equal to `\n                        : `greater than `}${new Date(Number(issue.minimum))}`;\n            else\n                message = "Invalid input";\n            break;\n        case ZodIssueCode.too_big:\n            if (issue.type === "array")\n                message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;\n            else if (issue.type === "string")\n                message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;\n            else if (issue.type === "number")\n                message = `Number must be ${issue.exact\n                    ? `exactly`\n                    : issue.inclusive\n                        ? `less than or equal to`\n                        : `less than`} ${issue.maximum}`;\n            else if (issue.type === "bigint")\n                message = `BigInt must be ${issue.exact\n                    ? `exactly`\n                    : issue.inclusive\n                        ? `less than or equal to`\n                        : `less than`} ${issue.maximum}`;\n            else if (issue.type === "date")\n                message = `Date must be ${issue.exact\n                    ? `exactly`\n                    : issue.inclusive\n                        ? `smaller than or equal to`\n                        : `smaller than`} ${new Date(Number(issue.maximum))}`;\n            else\n                message = "Invalid input";\n            break;\n        case ZodIssueCode.custom:\n            message = `Invalid input`;\n            break;\n        case ZodIssueCode.invalid_intersection_types:\n            message = `Intersection results could not be merged`;\n            break;\n        case ZodIssueCode.not_multiple_of:\n            message = `Number must be a multiple of ${issue.multipleOf}`;\n            break;\n        case ZodIssueCode.not_finite:\n            message = "Number must be finite";\n            break;\n        default:\n            message = _ctx.defaultError;\n            util.assertNever(issue);\n    }\n    return { message };\n};\n\nlet overrideErrorMap = errorMap;\nfunction setErrorMap(map) {\n    overrideErrorMap = map;\n}\nfunction getErrorMap() {\n    return overrideErrorMap;\n}\n\nconst makeIssue = (params) => {\n    const { data, path, errorMaps, issueData } = params;\n    const fullPath = [...path, ...(issueData.path || [])];\n    const fullIssue = {\n        ...issueData,\n        path: fullPath,\n    };\n    if (issueData.message !== undefined) {\n        return {\n            ...issueData,\n            path: fullPath,\n            message: issueData.message,\n        };\n    }\n    let errorMessage = "";\n    const maps = errorMaps\n        .filter((m) => !!m)\n        .slice()\n        .reverse();\n    for (const map of maps) {\n        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;\n    }\n    return {\n        ...issueData,\n        path: fullPath,\n        message: errorMessage,\n    };\n};\nconst EMPTY_PATH = [];\nfunction addIssueToContext(ctx, issueData) {\n    const overrideMap = getErrorMap();\n    const issue = makeIssue({\n        issueData: issueData,\n        data: ctx.data,\n        path: ctx.path,\n        errorMaps: [\n            ctx.common.contextualErrorMap,\n            ctx.schemaErrorMap,\n            overrideMap,\n            overrideMap === errorMap ? undefined : errorMap, // then global default map\n        ].filter((x) => !!x),\n    });\n    ctx.common.issues.push(issue);\n}\nclass ParseStatus {\n    constructor() {\n        this.value = "valid";\n    }\n    dirty() {\n        if (this.value === "valid")\n            this.value = "dirty";\n    }\n    abort() {\n        if (this.value !== "aborted")\n            this.value = "aborted";\n    }\n    static mergeArray(status, results) {\n        const arrayValue = [];\n        for (const s of results) {\n            if (s.status === "aborted")\n                return INVALID;\n            if (s.status === "dirty")\n                status.dirty();\n            arrayValue.push(s.value);\n        }\n        return { status: status.value, value: arrayValue };\n    }\n    static async mergeObjectAsync(status, pairs) {\n        const syncPairs = [];\n        for (const pair of pairs) {\n            const key = await pair.key;\n            const value = await pair.value;\n            syncPairs.push({\n                key,\n                value,\n            });\n        }\n        return ParseStatus.mergeObjectSync(status, syncPairs);\n    }\n    static mergeObjectSync(status, pairs) {\n        const finalObject = {};\n        for (const pair of pairs) {\n            const { key, value } = pair;\n            if (key.status === "aborted")\n                return INVALID;\n            if (value.status === "aborted")\n                return INVALID;\n            if (key.status === "dirty")\n                status.dirty();\n            if (value.status === "dirty")\n                status.dirty();\n            if (key.value !== "__proto__" &&\n                (typeof value.value !== "undefined" || pair.alwaysSet)) {\n                finalObject[key.value] = value.value;\n            }\n        }\n        return { status: status.value, value: finalObject };\n    }\n}\nconst INVALID = Object.freeze({\n    status: "aborted",\n});\nconst DIRTY = (value) => ({ status: "dirty", value });\nconst OK = (value) => ({ status: "valid", value });\nconst isAborted = (x) => x.status === "aborted";\nconst isDirty = (x) => x.status === "dirty";\nconst isValid = (x) => x.status === "valid";\nconst isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;\n\n/******************************************************************************\nCopyright (c) Microsoft Corporation.\n\nPermission to use, copy, modify, and/or distribute this software for any\npurpose with or without fee is hereby granted.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\nAND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM\nLOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR\nOTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR\nPERFORMANCE OF THIS SOFTWARE.\n***************************************************************************** */\n\nfunction __classPrivateFieldGet(receiver, state, kind, f) {\n    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");\n    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");\n    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);\n}\n\nfunction __classPrivateFieldSet(receiver, state, value, kind, f) {\n    if (kind === "m") throw new TypeError("Private method is not writable");\n    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");\n    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");\n    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;\n}\n\ntypeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {\n    var e = new Error(message);\n    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;\n};\n\nvar errorUtil;\n(function (errorUtil) {\n    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};\n    errorUtil.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;\n})(errorUtil || (errorUtil = {}));\n\nvar _ZodEnum_cache, _ZodNativeEnum_cache;\nclass ParseInputLazyPath {\n    constructor(parent, value, path, key) {\n        this._cachedPath = [];\n        this.parent = parent;\n        this.data = value;\n        this._path = path;\n        this._key = key;\n    }\n    get path() {\n        if (!this._cachedPath.length) {\n            if (this._key instanceof Array) {\n                this._cachedPath.push(...this._path, ...this._key);\n            }\n            else {\n                this._cachedPath.push(...this._path, this._key);\n            }\n        }\n        return this._cachedPath;\n    }\n}\nconst handleResult = (ctx, result) => {\n    if (isValid(result)) {\n        return { success: true, data: result.value };\n    }\n    else {\n        if (!ctx.common.issues.length) {\n            throw new Error("Validation failed but no issues detected.");\n        }\n        return {\n            success: false,\n            get error() {\n                if (this._error)\n                    return this._error;\n                const error = new ZodError(ctx.common.issues);\n                this._error = error;\n                return this._error;\n            },\n        };\n    }\n};\nfunction processCreateParams(params) {\n    if (!params)\n        return {};\n    const { errorMap, invalid_type_error, required_error, description } = params;\n    if (errorMap && (invalid_type_error || required_error)) {\n        throw new Error(`Can\'t use "invalid_type_error" or "required_error" in conjunction with custom error map.`);\n    }\n    if (errorMap)\n        return { errorMap: errorMap, description };\n    const customMap = (iss, ctx) => {\n        var _a, _b;\n        const { message } = params;\n        if (iss.code === "invalid_enum_value") {\n            return { message: message !== null && message !== void 0 ? message : ctx.defaultError };\n        }\n        if (typeof ctx.data === "undefined") {\n            return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };\n        }\n        if (iss.code !== "invalid_type")\n            return { message: ctx.defaultError };\n        return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };\n    };\n    return { errorMap: customMap, description };\n}\nclass ZodType {\n    constructor(def) {\n        /** Alias of safeParseAsync */\n        this.spa = this.safeParseAsync;\n        this._def = def;\n        this.parse = this.parse.bind(this);\n        this.safeParse = this.safeParse.bind(this);\n        this.parseAsync = this.parseAsync.bind(this);\n        this.safeParseAsync = this.safeParseAsync.bind(this);\n        this.spa = this.spa.bind(this);\n        this.refine = this.refine.bind(this);\n        this.refinement = this.refinement.bind(this);\n        this.superRefine = this.superRefine.bind(this);\n        this.optional = this.optional.bind(this);\n        this.nullable = this.nullable.bind(this);\n        this.nullish = this.nullish.bind(this);\n        this.array = this.array.bind(this);\n        this.promise = this.promise.bind(this);\n        this.or = this.or.bind(this);\n        this.and = this.and.bind(this);\n        this.transform = this.transform.bind(this);\n        this.brand = this.brand.bind(this);\n        this.default = this.default.bind(this);\n        this.catch = this.catch.bind(this);\n        this.describe = this.describe.bind(this);\n        this.pipe = this.pipe.bind(this);\n        this.readonly = this.readonly.bind(this);\n        this.isNullable = this.isNullable.bind(this);\n        this.isOptional = this.isOptional.bind(this);\n    }\n    get description() {\n        return this._def.description;\n    }\n    _getType(input) {\n        return getParsedType(input.data);\n    }\n    _getOrReturnCtx(input, ctx) {\n        return (ctx || {\n            common: input.parent.common,\n            data: input.data,\n            parsedType: getParsedType(input.data),\n            schemaErrorMap: this._def.errorMap,\n            path: input.path,\n            parent: input.parent,\n        });\n    }\n    _processInputParams(input) {\n        return {\n            status: new ParseStatus(),\n            ctx: {\n                common: input.parent.common,\n                data: input.data,\n                parsedType: getParsedType(input.data),\n                schemaErrorMap: this._def.errorMap,\n                path: input.path,\n                parent: input.parent,\n            },\n        };\n    }\n    _parseSync(input) {\n        const result = this._parse(input);\n        if (isAsync(result)) {\n            throw new Error("Synchronous parse encountered promise.");\n        }\n        return result;\n    }\n    _parseAsync(input) {\n        const result = this._parse(input);\n        return Promise.resolve(result);\n    }\n    parse(data, params) {\n        const result = this.safeParse(data, params);\n        if (result.success)\n            return result.data;\n        throw result.error;\n    }\n    safeParse(data, params) {\n        var _a;\n        const ctx = {\n            common: {\n                issues: [],\n                async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,\n                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,\n            },\n            path: (params === null || params === void 0 ? void 0 : params.path) || [],\n            schemaErrorMap: this._def.errorMap,\n            parent: null,\n            data,\n            parsedType: getParsedType(data),\n        };\n        const result = this._parseSync({ data, path: ctx.path, parent: ctx });\n        return handleResult(ctx, result);\n    }\n    async parseAsync(data, params) {\n        const result = await this.safeParseAsync(data, params);\n        if (result.success)\n            return result.data;\n        throw result.error;\n    }\n    async safeParseAsync(data, params) {\n        const ctx = {\n            common: {\n                issues: [],\n                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,\n                async: true,\n            },\n            path: (params === null || params === void 0 ? void 0 : params.path) || [],\n            schemaErrorMap: this._def.errorMap,\n            parent: null,\n            data,\n            parsedType: getParsedType(data),\n        };\n        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });\n        const result = await (isAsync(maybeAsyncResult)\n            ? maybeAsyncResult\n            : Promise.resolve(maybeAsyncResult));\n        return handleResult(ctx, result);\n    }\n    refine(check, message) {\n        const getIssueProperties = (val) => {\n            if (typeof message === "string" || typeof message === "undefined") {\n                return { message };\n            }\n            else if (typeof message === "function") {\n                return message(val);\n            }\n            else {\n                return message;\n            }\n        };\n        return this._refinement((val, ctx) => {\n            const result = check(val);\n            const setError = () => ctx.addIssue({\n                code: ZodIssueCode.custom,\n                ...getIssueProperties(val),\n            });\n            if (typeof Promise !== "undefined" && result instanceof Promise) {\n                return result.then((data) => {\n                    if (!data) {\n                        setError();\n                        return false;\n                    }\n                    else {\n                        return true;\n                    }\n                });\n            }\n            if (!result) {\n                setError();\n                return false;\n            }\n            else {\n                return true;\n            }\n        });\n    }\n    refinement(check, refinementData) {\n        return this._refinement((val, ctx) => {\n            if (!check(val)) {\n                ctx.addIssue(typeof refinementData === "function"\n                    ? refinementData(val, ctx)\n                    : refinementData);\n                return false;\n            }\n            else {\n                return true;\n            }\n        });\n    }\n    _refinement(refinement) {\n        return new ZodEffects({\n            schema: this,\n            typeName: ZodFirstPartyTypeKind.ZodEffects,\n            effect: { type: "refinement", refinement },\n        });\n    }\n    superRefine(refinement) {\n        return this._refinement(refinement);\n    }\n    optional() {\n        return ZodOptional.create(this, this._def);\n    }\n    nullable() {\n        return ZodNullable.create(this, this._def);\n    }\n    nullish() {\n        return this.nullable().optional();\n    }\n    array() {\n        return ZodArray.create(this, this._def);\n    }\n    promise() {\n        return ZodPromise.create(this, this._def);\n    }\n    or(option) {\n        return ZodUnion.create([this, option], this._def);\n    }\n    and(incoming) {\n        return ZodIntersection.create(this, incoming, this._def);\n    }\n    transform(transform) {\n        return new ZodEffects({\n            ...processCreateParams(this._def),\n            schema: this,\n            typeName: ZodFirstPartyTypeKind.ZodEffects,\n            effect: { type: "transform", transform },\n        });\n    }\n    default(def) {\n        const defaultValueFunc = typeof def === "function" ? def : () => def;\n        return new ZodDefault({\n            ...processCreateParams(this._def),\n            innerType: this,\n            defaultValue: defaultValueFunc,\n            typeName: ZodFirstPartyTypeKind.ZodDefault,\n        });\n    }\n    brand() {\n        return new ZodBranded({\n            typeName: ZodFirstPartyTypeKind.ZodBranded,\n            type: this,\n            ...processCreateParams(this._def),\n        });\n    }\n    catch(def) {\n        const catchValueFunc = typeof def === "function" ? def : () => def;\n        return new ZodCatch({\n            ...processCreateParams(this._def),\n            innerType: this,\n            catchValue: catchValueFunc,\n            typeName: ZodFirstPartyTypeKind.ZodCatch,\n        });\n    }\n    describe(description) {\n        const This = this.constructor;\n        return new This({\n            ...this._def,\n            description,\n        });\n    }\n    pipe(target) {\n        return ZodPipeline.create(this, target);\n    }\n    readonly() {\n        return ZodReadonly.create(this);\n    }\n    isOptional() {\n        return this.safeParse(undefined).success;\n    }\n    isNullable() {\n        return this.safeParse(null).success;\n    }\n}\nconst cuidRegex = /^c[^\\s-]{8,}$/i;\nconst cuid2Regex = /^[0-9a-z]+$/;\nconst ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;\n// const uuidRegex =\n//   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;\nconst uuidRegex = /^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}$/i;\nconst nanoidRegex = /^[a-z0-9_-]{21}$/i;\nconst durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\\d+Y)|(?:[-+]?\\d+[.,]\\d+Y$))?(?:(?:[-+]?\\d+M)|(?:[-+]?\\d+[.,]\\d+M$))?(?:(?:[-+]?\\d+W)|(?:[-+]?\\d+[.,]\\d+W$))?(?:(?:[-+]?\\d+D)|(?:[-+]?\\d+[.,]\\d+D$))?(?:T(?=[\\d+-])(?:(?:[-+]?\\d+H)|(?:[-+]?\\d+[.,]\\d+H$))?(?:(?:[-+]?\\d+M)|(?:[-+]?\\d+[.,]\\d+M$))?(?:[-+]?\\d+(?:[.,]\\d+)?S)?)??$/;\n// from https://stackoverflow.com/a/46181/1550155\n// old version: too slow, didn\'t support unicode\n// const emailRegex = /^((([a-z]|\\d|[!#\\$%&\'\\*\\+\\-\\/=\\?\\^_`{\\|}~]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])+(\\.([a-z]|\\d|[!#\\$%&\'\\*\\+\\-\\/=\\?\\^_`{\\|}~]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])+)*)|((\\x22)((((\\x20|\\x09)*(\\x0d\\x0a))?(\\x20|\\x09)+)?(([\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]|\\x21|[\\x23-\\x5b]|[\\x5d-\\x7e]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])|(\\\\([\\x01-\\x09\\x0b\\x0c\\x0d-\\x7f]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]))))*(((\\x20|\\x09)*(\\x0d\\x0a))?(\\x20|\\x09)+)?(\\x22)))@((([a-z]|\\d|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])|(([a-z]|\\d|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])([a-z]|\\d|-|\\.|_|~|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])*([a-z]|\\d|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])))\\.)+(([a-z]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])|(([a-z]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])([a-z]|\\d|-|\\.|_|~|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])*([a-z]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])))$/i;\n//old email regex\n// const emailRegex = /^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))@((?!-)([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{1,})[^-<>()[\\].,;:\\s@"]$/i;\n// eslint-disable-next-line\n// const emailRegex =\n//   /^(([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\\])|(\\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\\.[A-Za-z]{2,})+))$/;\n// const emailRegex =\n//   /^[a-zA-Z0-9\\.\\!\\#\\$\\%\\&\\\'\\*\\+\\/\\=\\?\\^\\_\\`\\{\\|\\}\\~\\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;\n// const emailRegex =\n//   /^(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])$/i;\nconst emailRegex = /^(?!\\.)(?!.*\\.\\.)([A-Z0-9_\'+\\-\\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\\-]*\\.)+[A-Z]{2,}$/i;\n// const emailRegex =\n//   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\\.[a-z0-9\\-]+)*$/i;\n// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression\nconst _emojiRegex = `^(\\\\p{Extended_Pictographic}|\\\\p{Emoji_Component})+$`;\nlet emojiRegex;\n// faster, simpler, safer\nconst ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;\nconst ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;\n// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript\nconst base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;\n// simple\n// const dateRegexSource = `\\\\d{4}-\\\\d{2}-\\\\d{2}`;\n// no leap year validation\n// const dateRegexSource = `\\\\d{4}-((0[13578]|10|12)-31|(0[13-9]|1[0-2])-30|(0[1-9]|1[0-2])-(0[1-9]|1\\\\d|2\\\\d))`;\n// with leap year validation\nconst dateRegexSource = `((\\\\d\\\\d[2468][048]|\\\\d\\\\d[13579][26]|\\\\d\\\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\\\d|30)|(02)-(0[1-9]|1\\\\d|2[0-8])))`;\nconst dateRegex = new RegExp(`^${dateRegexSource}$`);\nfunction timeRegexSource(args) {\n    // let regex = `\\\\d{2}:\\\\d{2}:\\\\d{2}`;\n    let regex = `([01]\\\\d|2[0-3]):[0-5]\\\\d:[0-5]\\\\d`;\n    if (args.precision) {\n        regex = `${regex}\\\\.\\\\d{${args.precision}}`;\n    }\n    else if (args.precision == null) {\n        regex = `${regex}(\\\\.\\\\d+)?`;\n    }\n    return regex;\n}\nfunction timeRegex(args) {\n    return new RegExp(`^${timeRegexSource(args)}$`);\n}\n// Adapted from https://stackoverflow.com/a/3143231\nfunction datetimeRegex(args) {\n    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;\n    const opts = [];\n    opts.push(args.local ? `Z?` : `Z`);\n    if (args.offset)\n        opts.push(`([+-]\\\\d{2}:?\\\\d{2})`);\n    regex = `${regex}(${opts.join("|")})`;\n    return new RegExp(`^${regex}$`);\n}\nfunction isValidIP(ip, version) {\n    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {\n        return true;\n    }\n    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {\n        return true;\n    }\n    return false;\n}\nclass ZodString extends ZodType {\n    _parse(input) {\n        if (this._def.coerce) {\n            input.data = String(input.data);\n        }\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.string) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.string,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        const status = new ParseStatus();\n        let ctx = undefined;\n        for (const check of this._def.checks) {\n            if (check.kind === "min") {\n                if (input.data.length < check.value) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_small,\n                        minimum: check.value,\n                        type: "string",\n                        inclusive: true,\n                        exact: false,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "max") {\n                if (input.data.length > check.value) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_big,\n                        maximum: check.value,\n                        type: "string",\n                        inclusive: true,\n                        exact: false,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "length") {\n                const tooBig = input.data.length > check.value;\n                const tooSmall = input.data.length < check.value;\n                if (tooBig || tooSmall) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    if (tooBig) {\n                        addIssueToContext(ctx, {\n                            code: ZodIssueCode.too_big,\n                            maximum: check.value,\n                            type: "string",\n                            inclusive: true,\n                            exact: true,\n                            message: check.message,\n                        });\n                    }\n                    else if (tooSmall) {\n                        addIssueToContext(ctx, {\n                            code: ZodIssueCode.too_small,\n                            minimum: check.value,\n                            type: "string",\n                            inclusive: true,\n                            exact: true,\n                            message: check.message,\n                        });\n                    }\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "email") {\n                if (!emailRegex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "email",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "emoji") {\n                if (!emojiRegex) {\n                    emojiRegex = new RegExp(_emojiRegex, "u");\n                }\n                if (!emojiRegex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "emoji",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "uuid") {\n                if (!uuidRegex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "uuid",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "nanoid") {\n                if (!nanoidRegex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "nanoid",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "cuid") {\n                if (!cuidRegex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "cuid",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "cuid2") {\n                if (!cuid2Regex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "cuid2",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "ulid") {\n                if (!ulidRegex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "ulid",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "url") {\n                try {\n                    new URL(input.data);\n                }\n                catch (_a) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "url",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "regex") {\n                check.regex.lastIndex = 0;\n                const testResult = check.regex.test(input.data);\n                if (!testResult) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "regex",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "trim") {\n                input.data = input.data.trim();\n            }\n            else if (check.kind === "includes") {\n                if (!input.data.includes(check.value, check.position)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.invalid_string,\n                        validation: { includes: check.value, position: check.position },\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "toLowerCase") {\n                input.data = input.data.toLowerCase();\n            }\n            else if (check.kind === "toUpperCase") {\n                input.data = input.data.toUpperCase();\n            }\n            else if (check.kind === "startsWith") {\n                if (!input.data.startsWith(check.value)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.invalid_string,\n                        validation: { startsWith: check.value },\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "endsWith") {\n                if (!input.data.endsWith(check.value)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.invalid_string,\n                        validation: { endsWith: check.value },\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "datetime") {\n                const regex = datetimeRegex(check);\n                if (!regex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.invalid_string,\n                        validation: "datetime",\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "date") {\n                const regex = dateRegex;\n                if (!regex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.invalid_string,\n                        validation: "date",\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "time") {\n                const regex = timeRegex(check);\n                if (!regex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.invalid_string,\n                        validation: "time",\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "duration") {\n                if (!durationRegex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "duration",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "ip") {\n                if (!isValidIP(input.data, check.version)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "ip",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "base64") {\n                if (!base64Regex.test(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        validation: "base64",\n                        code: ZodIssueCode.invalid_string,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else {\n                util.assertNever(check);\n            }\n        }\n        return { status: status.value, value: input.data };\n    }\n    _regex(regex, validation, message) {\n        return this.refinement((data) => regex.test(data), {\n            validation,\n            code: ZodIssueCode.invalid_string,\n            ...errorUtil.errToObj(message),\n        });\n    }\n    _addCheck(check) {\n        return new ZodString({\n            ...this._def,\n            checks: [...this._def.checks, check],\n        });\n    }\n    email(message) {\n        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });\n    }\n    url(message) {\n        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });\n    }\n    emoji(message) {\n        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });\n    }\n    uuid(message) {\n        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });\n    }\n    nanoid(message) {\n        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });\n    }\n    cuid(message) {\n        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });\n    }\n    cuid2(message) {\n        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });\n    }\n    ulid(message) {\n        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });\n    }\n    base64(message) {\n        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });\n    }\n    ip(options) {\n        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });\n    }\n    datetime(options) {\n        var _a, _b;\n        if (typeof options === "string") {\n            return this._addCheck({\n                kind: "datetime",\n                precision: null,\n                offset: false,\n                local: false,\n                message: options,\n            });\n        }\n        return this._addCheck({\n            kind: "datetime",\n            precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,\n            offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,\n            local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,\n            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),\n        });\n    }\n    date(message) {\n        return this._addCheck({ kind: "date", message });\n    }\n    time(options) {\n        if (typeof options === "string") {\n            return this._addCheck({\n                kind: "time",\n                precision: null,\n                message: options,\n            });\n        }\n        return this._addCheck({\n            kind: "time",\n            precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,\n            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),\n        });\n    }\n    duration(message) {\n        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });\n    }\n    regex(regex, message) {\n        return this._addCheck({\n            kind: "regex",\n            regex: regex,\n            ...errorUtil.errToObj(message),\n        });\n    }\n    includes(value, options) {\n        return this._addCheck({\n            kind: "includes",\n            value: value,\n            position: options === null || options === void 0 ? void 0 : options.position,\n            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),\n        });\n    }\n    startsWith(value, message) {\n        return this._addCheck({\n            kind: "startsWith",\n            value: value,\n            ...errorUtil.errToObj(message),\n        });\n    }\n    endsWith(value, message) {\n        return this._addCheck({\n            kind: "endsWith",\n            value: value,\n            ...errorUtil.errToObj(message),\n        });\n    }\n    min(minLength, message) {\n        return this._addCheck({\n            kind: "min",\n            value: minLength,\n            ...errorUtil.errToObj(message),\n        });\n    }\n    max(maxLength, message) {\n        return this._addCheck({\n            kind: "max",\n            value: maxLength,\n            ...errorUtil.errToObj(message),\n        });\n    }\n    length(len, message) {\n        return this._addCheck({\n            kind: "length",\n            value: len,\n            ...errorUtil.errToObj(message),\n        });\n    }\n    /**\n     * @deprecated Use z.string().min(1) instead.\n     * @see {@link ZodString.min}\n     */\n    nonempty(message) {\n        return this.min(1, errorUtil.errToObj(message));\n    }\n    trim() {\n        return new ZodString({\n            ...this._def,\n            checks: [...this._def.checks, { kind: "trim" }],\n        });\n    }\n    toLowerCase() {\n        return new ZodString({\n            ...this._def,\n            checks: [...this._def.checks, { kind: "toLowerCase" }],\n        });\n    }\n    toUpperCase() {\n        return new ZodString({\n            ...this._def,\n            checks: [...this._def.checks, { kind: "toUpperCase" }],\n        });\n    }\n    get isDatetime() {\n        return !!this._def.checks.find((ch) => ch.kind === "datetime");\n    }\n    get isDate() {\n        return !!this._def.checks.find((ch) => ch.kind === "date");\n    }\n    get isTime() {\n        return !!this._def.checks.find((ch) => ch.kind === "time");\n    }\n    get isDuration() {\n        return !!this._def.checks.find((ch) => ch.kind === "duration");\n    }\n    get isEmail() {\n        return !!this._def.checks.find((ch) => ch.kind === "email");\n    }\n    get isURL() {\n        return !!this._def.checks.find((ch) => ch.kind === "url");\n    }\n    get isEmoji() {\n        return !!this._def.checks.find((ch) => ch.kind === "emoji");\n    }\n    get isUUID() {\n        return !!this._def.checks.find((ch) => ch.kind === "uuid");\n    }\n    get isNANOID() {\n        return !!this._def.checks.find((ch) => ch.kind === "nanoid");\n    }\n    get isCUID() {\n        return !!this._def.checks.find((ch) => ch.kind === "cuid");\n    }\n    get isCUID2() {\n        return !!this._def.checks.find((ch) => ch.kind === "cuid2");\n    }\n    get isULID() {\n        return !!this._def.checks.find((ch) => ch.kind === "ulid");\n    }\n    get isIP() {\n        return !!this._def.checks.find((ch) => ch.kind === "ip");\n    }\n    get isBase64() {\n        return !!this._def.checks.find((ch) => ch.kind === "base64");\n    }\n    get minLength() {\n        let min = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "min") {\n                if (min === null || ch.value > min)\n                    min = ch.value;\n            }\n        }\n        return min;\n    }\n    get maxLength() {\n        let max = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "max") {\n                if (max === null || ch.value < max)\n                    max = ch.value;\n            }\n        }\n        return max;\n    }\n}\nZodString.create = (params) => {\n    var _a;\n    return new ZodString({\n        checks: [],\n        typeName: ZodFirstPartyTypeKind.ZodString,\n        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,\n        ...processCreateParams(params),\n    });\n};\n// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034\nfunction floatSafeRemainder(val, step) {\n    const valDecCount = (val.toString().split(".")[1] || "").length;\n    const stepDecCount = (step.toString().split(".")[1] || "").length;\n    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;\n    const valInt = parseInt(val.toFixed(decCount).replace(".", ""));\n    const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));\n    return (valInt % stepInt) / Math.pow(10, decCount);\n}\nclass ZodNumber extends ZodType {\n    constructor() {\n        super(...arguments);\n        this.min = this.gte;\n        this.max = this.lte;\n        this.step = this.multipleOf;\n    }\n    _parse(input) {\n        if (this._def.coerce) {\n            input.data = Number(input.data);\n        }\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.number) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.number,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        let ctx = undefined;\n        const status = new ParseStatus();\n        for (const check of this._def.checks) {\n            if (check.kind === "int") {\n                if (!util.isInteger(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.invalid_type,\n                        expected: "integer",\n                        received: "float",\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "min") {\n                const tooSmall = check.inclusive\n                    ? input.data < check.value\n                    : input.data <= check.value;\n                if (tooSmall) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_small,\n                        minimum: check.value,\n                        type: "number",\n                        inclusive: check.inclusive,\n                        exact: false,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "max") {\n                const tooBig = check.inclusive\n                    ? input.data > check.value\n                    : input.data >= check.value;\n                if (tooBig) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_big,\n                        maximum: check.value,\n                        type: "number",\n                        inclusive: check.inclusive,\n                        exact: false,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "multipleOf") {\n                if (floatSafeRemainder(input.data, check.value) !== 0) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.not_multiple_of,\n                        multipleOf: check.value,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "finite") {\n                if (!Number.isFinite(input.data)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.not_finite,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else {\n                util.assertNever(check);\n            }\n        }\n        return { status: status.value, value: input.data };\n    }\n    gte(value, message) {\n        return this.setLimit("min", value, true, errorUtil.toString(message));\n    }\n    gt(value, message) {\n        return this.setLimit("min", value, false, errorUtil.toString(message));\n    }\n    lte(value, message) {\n        return this.setLimit("max", value, true, errorUtil.toString(message));\n    }\n    lt(value, message) {\n        return this.setLimit("max", value, false, errorUtil.toString(message));\n    }\n    setLimit(kind, value, inclusive, message) {\n        return new ZodNumber({\n            ...this._def,\n            checks: [\n                ...this._def.checks,\n                {\n                    kind,\n                    value,\n                    inclusive,\n                    message: errorUtil.toString(message),\n                },\n            ],\n        });\n    }\n    _addCheck(check) {\n        return new ZodNumber({\n            ...this._def,\n            checks: [...this._def.checks, check],\n        });\n    }\n    int(message) {\n        return this._addCheck({\n            kind: "int",\n            message: errorUtil.toString(message),\n        });\n    }\n    positive(message) {\n        return this._addCheck({\n            kind: "min",\n            value: 0,\n            inclusive: false,\n            message: errorUtil.toString(message),\n        });\n    }\n    negative(message) {\n        return this._addCheck({\n            kind: "max",\n            value: 0,\n            inclusive: false,\n            message: errorUtil.toString(message),\n        });\n    }\n    nonpositive(message) {\n        return this._addCheck({\n            kind: "max",\n            value: 0,\n            inclusive: true,\n            message: errorUtil.toString(message),\n        });\n    }\n    nonnegative(message) {\n        return this._addCheck({\n            kind: "min",\n            value: 0,\n            inclusive: true,\n            message: errorUtil.toString(message),\n        });\n    }\n    multipleOf(value, message) {\n        return this._addCheck({\n            kind: "multipleOf",\n            value: value,\n            message: errorUtil.toString(message),\n        });\n    }\n    finite(message) {\n        return this._addCheck({\n            kind: "finite",\n            message: errorUtil.toString(message),\n        });\n    }\n    safe(message) {\n        return this._addCheck({\n            kind: "min",\n            inclusive: true,\n            value: Number.MIN_SAFE_INTEGER,\n            message: errorUtil.toString(message),\n        })._addCheck({\n            kind: "max",\n            inclusive: true,\n            value: Number.MAX_SAFE_INTEGER,\n            message: errorUtil.toString(message),\n        });\n    }\n    get minValue() {\n        let min = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "min") {\n                if (min === null || ch.value > min)\n                    min = ch.value;\n            }\n        }\n        return min;\n    }\n    get maxValue() {\n        let max = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "max") {\n                if (max === null || ch.value < max)\n                    max = ch.value;\n            }\n        }\n        return max;\n    }\n    get isInt() {\n        return !!this._def.checks.find((ch) => ch.kind === "int" ||\n            (ch.kind === "multipleOf" && util.isInteger(ch.value)));\n    }\n    get isFinite() {\n        let max = null, min = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "finite" ||\n                ch.kind === "int" ||\n                ch.kind === "multipleOf") {\n                return true;\n            }\n            else if (ch.kind === "min") {\n                if (min === null || ch.value > min)\n                    min = ch.value;\n            }\n            else if (ch.kind === "max") {\n                if (max === null || ch.value < max)\n                    max = ch.value;\n            }\n        }\n        return Number.isFinite(min) && Number.isFinite(max);\n    }\n}\nZodNumber.create = (params) => {\n    return new ZodNumber({\n        checks: [],\n        typeName: ZodFirstPartyTypeKind.ZodNumber,\n        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,\n        ...processCreateParams(params),\n    });\n};\nclass ZodBigInt extends ZodType {\n    constructor() {\n        super(...arguments);\n        this.min = this.gte;\n        this.max = this.lte;\n    }\n    _parse(input) {\n        if (this._def.coerce) {\n            input.data = BigInt(input.data);\n        }\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.bigint) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.bigint,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        let ctx = undefined;\n        const status = new ParseStatus();\n        for (const check of this._def.checks) {\n            if (check.kind === "min") {\n                const tooSmall = check.inclusive\n                    ? input.data < check.value\n                    : input.data <= check.value;\n                if (tooSmall) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_small,\n                        type: "bigint",\n                        minimum: check.value,\n                        inclusive: check.inclusive,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "max") {\n                const tooBig = check.inclusive\n                    ? input.data > check.value\n                    : input.data >= check.value;\n                if (tooBig) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_big,\n                        type: "bigint",\n                        maximum: check.value,\n                        inclusive: check.inclusive,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "multipleOf") {\n                if (input.data % check.value !== BigInt(0)) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.not_multiple_of,\n                        multipleOf: check.value,\n                        message: check.message,\n                    });\n                    status.dirty();\n                }\n            }\n            else {\n                util.assertNever(check);\n            }\n        }\n        return { status: status.value, value: input.data };\n    }\n    gte(value, message) {\n        return this.setLimit("min", value, true, errorUtil.toString(message));\n    }\n    gt(value, message) {\n        return this.setLimit("min", value, false, errorUtil.toString(message));\n    }\n    lte(value, message) {\n        return this.setLimit("max", value, true, errorUtil.toString(message));\n    }\n    lt(value, message) {\n        return this.setLimit("max", value, false, errorUtil.toString(message));\n    }\n    setLimit(kind, value, inclusive, message) {\n        return new ZodBigInt({\n            ...this._def,\n            checks: [\n                ...this._def.checks,\n                {\n                    kind,\n                    value,\n                    inclusive,\n                    message: errorUtil.toString(message),\n                },\n            ],\n        });\n    }\n    _addCheck(check) {\n        return new ZodBigInt({\n            ...this._def,\n            checks: [...this._def.checks, check],\n        });\n    }\n    positive(message) {\n        return this._addCheck({\n            kind: "min",\n            value: BigInt(0),\n            inclusive: false,\n            message: errorUtil.toString(message),\n        });\n    }\n    negative(message) {\n        return this._addCheck({\n            kind: "max",\n            value: BigInt(0),\n            inclusive: false,\n            message: errorUtil.toString(message),\n        });\n    }\n    nonpositive(message) {\n        return this._addCheck({\n            kind: "max",\n            value: BigInt(0),\n            inclusive: true,\n            message: errorUtil.toString(message),\n        });\n    }\n    nonnegative(message) {\n        return this._addCheck({\n            kind: "min",\n            value: BigInt(0),\n            inclusive: true,\n            message: errorUtil.toString(message),\n        });\n    }\n    multipleOf(value, message) {\n        return this._addCheck({\n            kind: "multipleOf",\n            value,\n            message: errorUtil.toString(message),\n        });\n    }\n    get minValue() {\n        let min = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "min") {\n                if (min === null || ch.value > min)\n                    min = ch.value;\n            }\n        }\n        return min;\n    }\n    get maxValue() {\n        let max = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "max") {\n                if (max === null || ch.value < max)\n                    max = ch.value;\n            }\n        }\n        return max;\n    }\n}\nZodBigInt.create = (params) => {\n    var _a;\n    return new ZodBigInt({\n        checks: [],\n        typeName: ZodFirstPartyTypeKind.ZodBigInt,\n        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,\n        ...processCreateParams(params),\n    });\n};\nclass ZodBoolean extends ZodType {\n    _parse(input) {\n        if (this._def.coerce) {\n            input.data = Boolean(input.data);\n        }\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.boolean) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.boolean,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        return OK(input.data);\n    }\n}\nZodBoolean.create = (params) => {\n    return new ZodBoolean({\n        typeName: ZodFirstPartyTypeKind.ZodBoolean,\n        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,\n        ...processCreateParams(params),\n    });\n};\nclass ZodDate extends ZodType {\n    _parse(input) {\n        if (this._def.coerce) {\n            input.data = new Date(input.data);\n        }\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.date) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.date,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        if (isNaN(input.data.getTime())) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_date,\n            });\n            return INVALID;\n        }\n        const status = new ParseStatus();\n        let ctx = undefined;\n        for (const check of this._def.checks) {\n            if (check.kind === "min") {\n                if (input.data.getTime() < check.value) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_small,\n                        message: check.message,\n                        inclusive: true,\n                        exact: false,\n                        minimum: check.value,\n                        type: "date",\n                    });\n                    status.dirty();\n                }\n            }\n            else if (check.kind === "max") {\n                if (input.data.getTime() > check.value) {\n                    ctx = this._getOrReturnCtx(input, ctx);\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.too_big,\n                        message: check.message,\n                        inclusive: true,\n                        exact: false,\n                        maximum: check.value,\n                        type: "date",\n                    });\n                    status.dirty();\n                }\n            }\n            else {\n                util.assertNever(check);\n            }\n        }\n        return {\n            status: status.value,\n            value: new Date(input.data.getTime()),\n        };\n    }\n    _addCheck(check) {\n        return new ZodDate({\n            ...this._def,\n            checks: [...this._def.checks, check],\n        });\n    }\n    min(minDate, message) {\n        return this._addCheck({\n            kind: "min",\n            value: minDate.getTime(),\n            message: errorUtil.toString(message),\n        });\n    }\n    max(maxDate, message) {\n        return this._addCheck({\n            kind: "max",\n            value: maxDate.getTime(),\n            message: errorUtil.toString(message),\n        });\n    }\n    get minDate() {\n        let min = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "min") {\n                if (min === null || ch.value > min)\n                    min = ch.value;\n            }\n        }\n        return min != null ? new Date(min) : null;\n    }\n    get maxDate() {\n        let max = null;\n        for (const ch of this._def.checks) {\n            if (ch.kind === "max") {\n                if (max === null || ch.value < max)\n                    max = ch.value;\n            }\n        }\n        return max != null ? new Date(max) : null;\n    }\n}\nZodDate.create = (params) => {\n    return new ZodDate({\n        checks: [],\n        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,\n        typeName: ZodFirstPartyTypeKind.ZodDate,\n        ...processCreateParams(params),\n    });\n};\nclass ZodSymbol extends ZodType {\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.symbol) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.symbol,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        return OK(input.data);\n    }\n}\nZodSymbol.create = (params) => {\n    return new ZodSymbol({\n        typeName: ZodFirstPartyTypeKind.ZodSymbol,\n        ...processCreateParams(params),\n    });\n};\nclass ZodUndefined extends ZodType {\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.undefined) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.undefined,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        return OK(input.data);\n    }\n}\nZodUndefined.create = (params) => {\n    return new ZodUndefined({\n        typeName: ZodFirstPartyTypeKind.ZodUndefined,\n        ...processCreateParams(params),\n    });\n};\nclass ZodNull extends ZodType {\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.null) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.null,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        return OK(input.data);\n    }\n}\nZodNull.create = (params) => {\n    return new ZodNull({\n        typeName: ZodFirstPartyTypeKind.ZodNull,\n        ...processCreateParams(params),\n    });\n};\nclass ZodAny extends ZodType {\n    constructor() {\n        super(...arguments);\n        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.\n        this._any = true;\n    }\n    _parse(input) {\n        return OK(input.data);\n    }\n}\nZodAny.create = (params) => {\n    return new ZodAny({\n        typeName: ZodFirstPartyTypeKind.ZodAny,\n        ...processCreateParams(params),\n    });\n};\nclass ZodUnknown extends ZodType {\n    constructor() {\n        super(...arguments);\n        // required\n        this._unknown = true;\n    }\n    _parse(input) {\n        return OK(input.data);\n    }\n}\nZodUnknown.create = (params) => {\n    return new ZodUnknown({\n        typeName: ZodFirstPartyTypeKind.ZodUnknown,\n        ...processCreateParams(params),\n    });\n};\nclass ZodNever extends ZodType {\n    _parse(input) {\n        const ctx = this._getOrReturnCtx(input);\n        addIssueToContext(ctx, {\n            code: ZodIssueCode.invalid_type,\n            expected: ZodParsedType.never,\n            received: ctx.parsedType,\n        });\n        return INVALID;\n    }\n}\nZodNever.create = (params) => {\n    return new ZodNever({\n        typeName: ZodFirstPartyTypeKind.ZodNever,\n        ...processCreateParams(params),\n    });\n};\nclass ZodVoid extends ZodType {\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.undefined) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.void,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        return OK(input.data);\n    }\n}\nZodVoid.create = (params) => {\n    return new ZodVoid({\n        typeName: ZodFirstPartyTypeKind.ZodVoid,\n        ...processCreateParams(params),\n    });\n};\nclass ZodArray extends ZodType {\n    _parse(input) {\n        const { ctx, status } = this._processInputParams(input);\n        const def = this._def;\n        if (ctx.parsedType !== ZodParsedType.array) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.array,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        if (def.exactLength !== null) {\n            const tooBig = ctx.data.length > def.exactLength.value;\n            const tooSmall = ctx.data.length < def.exactLength.value;\n            if (tooBig || tooSmall) {\n                addIssueToContext(ctx, {\n                    code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,\n                    minimum: (tooSmall ? def.exactLength.value : undefined),\n                    maximum: (tooBig ? def.exactLength.value : undefined),\n                    type: "array",\n                    inclusive: true,\n                    exact: true,\n                    message: def.exactLength.message,\n                });\n                status.dirty();\n            }\n        }\n        if (def.minLength !== null) {\n            if (ctx.data.length < def.minLength.value) {\n                addIssueToContext(ctx, {\n                    code: ZodIssueCode.too_small,\n                    minimum: def.minLength.value,\n                    type: "array",\n                    inclusive: true,\n                    exact: false,\n                    message: def.minLength.message,\n                });\n                status.dirty();\n            }\n        }\n        if (def.maxLength !== null) {\n            if (ctx.data.length > def.maxLength.value) {\n                addIssueToContext(ctx, {\n                    code: ZodIssueCode.too_big,\n                    maximum: def.maxLength.value,\n                    type: "array",\n                    inclusive: true,\n                    exact: false,\n                    message: def.maxLength.message,\n                });\n                status.dirty();\n            }\n        }\n        if (ctx.common.async) {\n            return Promise.all([...ctx.data].map((item, i) => {\n                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));\n            })).then((result) => {\n                return ParseStatus.mergeArray(status, result);\n            });\n        }\n        const result = [...ctx.data].map((item, i) => {\n            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));\n        });\n        return ParseStatus.mergeArray(status, result);\n    }\n    get element() {\n        return this._def.type;\n    }\n    min(minLength, message) {\n        return new ZodArray({\n            ...this._def,\n            minLength: { value: minLength, message: errorUtil.toString(message) },\n        });\n    }\n    max(maxLength, message) {\n        return new ZodArray({\n            ...this._def,\n            maxLength: { value: maxLength, message: errorUtil.toString(message) },\n        });\n    }\n    length(len, message) {\n        return new ZodArray({\n            ...this._def,\n            exactLength: { value: len, message: errorUtil.toString(message) },\n        });\n    }\n    nonempty(message) {\n        return this.min(1, message);\n    }\n}\nZodArray.create = (schema, params) => {\n    return new ZodArray({\n        type: schema,\n        minLength: null,\n        maxLength: null,\n        exactLength: null,\n        typeName: ZodFirstPartyTypeKind.ZodArray,\n        ...processCreateParams(params),\n    });\n};\nfunction deepPartialify(schema) {\n    if (schema instanceof ZodObject) {\n        const newShape = {};\n        for (const key in schema.shape) {\n            const fieldSchema = schema.shape[key];\n            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));\n        }\n        return new ZodObject({\n            ...schema._def,\n            shape: () => newShape,\n        });\n    }\n    else if (schema instanceof ZodArray) {\n        return new ZodArray({\n            ...schema._def,\n            type: deepPartialify(schema.element),\n        });\n    }\n    else if (schema instanceof ZodOptional) {\n        return ZodOptional.create(deepPartialify(schema.unwrap()));\n    }\n    else if (schema instanceof ZodNullable) {\n        return ZodNullable.create(deepPartialify(schema.unwrap()));\n    }\n    else if (schema instanceof ZodTuple) {\n        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));\n    }\n    else {\n        return schema;\n    }\n}\nclass ZodObject extends ZodType {\n    constructor() {\n        super(...arguments);\n        this._cached = null;\n        /**\n         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.\n         * If you want to pass through unknown properties, use `.passthrough()` instead.\n         */\n        this.nonstrict = this.passthrough;\n        // extend<\n        //   Augmentation extends ZodRawShape,\n        //   NewOutput extends util.flatten<{\n        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation\n        //       ? Augmentation[k]["_output"]\n        //       : k extends keyof Output\n        //       ? Output[k]\n        //       : never;\n        //   }>,\n        //   NewInput extends util.flatten<{\n        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation\n        //       ? Augmentation[k]["_input"]\n        //       : k extends keyof Input\n        //       ? Input[k]\n        //       : never;\n        //   }>\n        // >(\n        //   augmentation: Augmentation\n        // ): ZodObject<\n        //   extendShape<T, Augmentation>,\n        //   UnknownKeys,\n        //   Catchall,\n        //   NewOutput,\n        //   NewInput\n        // > {\n        //   return new ZodObject({\n        //     ...this._def,\n        //     shape: () => ({\n        //       ...this._def.shape(),\n        //       ...augmentation,\n        //     }),\n        //   }) as any;\n        // }\n        /**\n         * @deprecated Use `.extend` instead\n         *  */\n        this.augment = this.extend;\n    }\n    _getCached() {\n        if (this._cached !== null)\n            return this._cached;\n        const shape = this._def.shape();\n        const keys = util.objectKeys(shape);\n        return (this._cached = { shape, keys });\n    }\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.object) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.object,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        const { status, ctx } = this._processInputParams(input);\n        const { shape, keys: shapeKeys } = this._getCached();\n        const extraKeys = [];\n        if (!(this._def.catchall instanceof ZodNever &&\n            this._def.unknownKeys === "strip")) {\n            for (const key in ctx.data) {\n                if (!shapeKeys.includes(key)) {\n                    extraKeys.push(key);\n                }\n            }\n        }\n        const pairs = [];\n        for (const key of shapeKeys) {\n            const keyValidator = shape[key];\n            const value = ctx.data[key];\n            pairs.push({\n                key: { status: "valid", value: key },\n                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),\n                alwaysSet: key in ctx.data,\n            });\n        }\n        if (this._def.catchall instanceof ZodNever) {\n            const unknownKeys = this._def.unknownKeys;\n            if (unknownKeys === "passthrough") {\n                for (const key of extraKeys) {\n                    pairs.push({\n                        key: { status: "valid", value: key },\n                        value: { status: "valid", value: ctx.data[key] },\n                    });\n                }\n            }\n            else if (unknownKeys === "strict") {\n                if (extraKeys.length > 0) {\n                    addIssueToContext(ctx, {\n                        code: ZodIssueCode.unrecognized_keys,\n                        keys: extraKeys,\n                    });\n                    status.dirty();\n                }\n            }\n            else if (unknownKeys === "strip") ;\n            else {\n                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);\n            }\n        }\n        else {\n            // run catchall validation\n            const catchall = this._def.catchall;\n            for (const key of extraKeys) {\n                const value = ctx.data[key];\n                pairs.push({\n                    key: { status: "valid", value: key },\n                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)\n                    ),\n                    alwaysSet: key in ctx.data,\n                });\n            }\n        }\n        if (ctx.common.async) {\n            return Promise.resolve()\n                .then(async () => {\n                const syncPairs = [];\n                for (const pair of pairs) {\n                    const key = await pair.key;\n                    const value = await pair.value;\n                    syncPairs.push({\n                        key,\n                        value,\n                        alwaysSet: pair.alwaysSet,\n                    });\n                }\n                return syncPairs;\n            })\n                .then((syncPairs) => {\n                return ParseStatus.mergeObjectSync(status, syncPairs);\n            });\n        }\n        else {\n            return ParseStatus.mergeObjectSync(status, pairs);\n        }\n    }\n    get shape() {\n        return this._def.shape();\n    }\n    strict(message) {\n        errorUtil.errToObj;\n        return new ZodObject({\n            ...this._def,\n            unknownKeys: "strict",\n            ...(message !== undefined\n                ? {\n                    errorMap: (issue, ctx) => {\n                        var _a, _b, _c, _d;\n                        const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;\n                        if (issue.code === "unrecognized_keys")\n                            return {\n                                message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError,\n                            };\n                        return {\n                            message: defaultError,\n                        };\n                    },\n                }\n                : {}),\n        });\n    }\n    strip() {\n        return new ZodObject({\n            ...this._def,\n            unknownKeys: "strip",\n        });\n    }\n    passthrough() {\n        return new ZodObject({\n            ...this._def,\n            unknownKeys: "passthrough",\n        });\n    }\n    // const AugmentFactory =\n    //   <Def extends ZodObjectDef>(def: Def) =>\n    //   <Augmentation extends ZodRawShape>(\n    //     augmentation: Augmentation\n    //   ): ZodObject<\n    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,\n    //     Def["unknownKeys"],\n    //     Def["catchall"]\n    //   > => {\n    //     return new ZodObject({\n    //       ...def,\n    //       shape: () => ({\n    //         ...def.shape(),\n    //         ...augmentation,\n    //       }),\n    //     }) as any;\n    //   };\n    extend(augmentation) {\n        return new ZodObject({\n            ...this._def,\n            shape: () => ({\n                ...this._def.shape(),\n                ...augmentation,\n            }),\n        });\n    }\n    /**\n     * Prior to zod@1.0.12 there was a bug in the\n     * inferred type of merged objects. Please\n     * upgrade if you are experiencing issues.\n     */\n    merge(merging) {\n        const merged = new ZodObject({\n            unknownKeys: merging._def.unknownKeys,\n            catchall: merging._def.catchall,\n            shape: () => ({\n                ...this._def.shape(),\n                ...merging._def.shape(),\n            }),\n            typeName: ZodFirstPartyTypeKind.ZodObject,\n        });\n        return merged;\n    }\n    // merge<\n    //   Incoming extends AnyZodObject,\n    //   Augmentation extends Incoming["shape"],\n    //   NewOutput extends {\n    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation\n    //       ? Augmentation[k]["_output"]\n    //       : k extends keyof Output\n    //       ? Output[k]\n    //       : never;\n    //   },\n    //   NewInput extends {\n    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation\n    //       ? Augmentation[k]["_input"]\n    //       : k extends keyof Input\n    //       ? Input[k]\n    //       : never;\n    //   }\n    // >(\n    //   merging: Incoming\n    // ): ZodObject<\n    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,\n    //   Incoming["_def"]["unknownKeys"],\n    //   Incoming["_def"]["catchall"],\n    //   NewOutput,\n    //   NewInput\n    // > {\n    //   const merged: any = new ZodObject({\n    //     unknownKeys: merging._def.unknownKeys,\n    //     catchall: merging._def.catchall,\n    //     shape: () =>\n    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),\n    //     typeName: ZodFirstPartyTypeKind.ZodObject,\n    //   }) as any;\n    //   return merged;\n    // }\n    setKey(key, schema) {\n        return this.augment({ [key]: schema });\n    }\n    // merge<Incoming extends AnyZodObject>(\n    //   merging: Incoming\n    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {\n    // ZodObject<\n    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,\n    //   Incoming["_def"]["unknownKeys"],\n    //   Incoming["_def"]["catchall"]\n    // > {\n    //   // const mergedShape = objectUtil.mergeShapes(\n    //   //   this._def.shape(),\n    //   //   merging._def.shape()\n    //   // );\n    //   const merged: any = new ZodObject({\n    //     unknownKeys: merging._def.unknownKeys,\n    //     catchall: merging._def.catchall,\n    //     shape: () =>\n    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),\n    //     typeName: ZodFirstPartyTypeKind.ZodObject,\n    //   }) as any;\n    //   return merged;\n    // }\n    catchall(index) {\n        return new ZodObject({\n            ...this._def,\n            catchall: index,\n        });\n    }\n    pick(mask) {\n        const shape = {};\n        util.objectKeys(mask).forEach((key) => {\n            if (mask[key] && this.shape[key]) {\n                shape[key] = this.shape[key];\n            }\n        });\n        return new ZodObject({\n            ...this._def,\n            shape: () => shape,\n        });\n    }\n    omit(mask) {\n        const shape = {};\n        util.objectKeys(this.shape).forEach((key) => {\n            if (!mask[key]) {\n                shape[key] = this.shape[key];\n            }\n        });\n        return new ZodObject({\n            ...this._def,\n            shape: () => shape,\n        });\n    }\n    /**\n     * @deprecated\n     */\n    deepPartial() {\n        return deepPartialify(this);\n    }\n    partial(mask) {\n        const newShape = {};\n        util.objectKeys(this.shape).forEach((key) => {\n            const fieldSchema = this.shape[key];\n            if (mask && !mask[key]) {\n                newShape[key] = fieldSchema;\n            }\n            else {\n                newShape[key] = fieldSchema.optional();\n            }\n        });\n        return new ZodObject({\n            ...this._def,\n            shape: () => newShape,\n        });\n    }\n    required(mask) {\n        const newShape = {};\n        util.objectKeys(this.shape).forEach((key) => {\n            if (mask && !mask[key]) {\n                newShape[key] = this.shape[key];\n            }\n            else {\n                const fieldSchema = this.shape[key];\n                let newField = fieldSchema;\n                while (newField instanceof ZodOptional) {\n                    newField = newField._def.innerType;\n                }\n                newShape[key] = newField;\n            }\n        });\n        return new ZodObject({\n            ...this._def,\n            shape: () => newShape,\n        });\n    }\n    keyof() {\n        return createZodEnum(util.objectKeys(this.shape));\n    }\n}\nZodObject.create = (shape, params) => {\n    return new ZodObject({\n        shape: () => shape,\n        unknownKeys: "strip",\n        catchall: ZodNever.create(),\n        typeName: ZodFirstPartyTypeKind.ZodObject,\n        ...processCreateParams(params),\n    });\n};\nZodObject.strictCreate = (shape, params) => {\n    return new ZodObject({\n        shape: () => shape,\n        unknownKeys: "strict",\n        catchall: ZodNever.create(),\n        typeName: ZodFirstPartyTypeKind.ZodObject,\n        ...processCreateParams(params),\n    });\n};\nZodObject.lazycreate = (shape, params) => {\n    return new ZodObject({\n        shape,\n        unknownKeys: "strip",\n        catchall: ZodNever.create(),\n        typeName: ZodFirstPartyTypeKind.ZodObject,\n        ...processCreateParams(params),\n    });\n};\nclass ZodUnion extends ZodType {\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        const options = this._def.options;\n        function handleResults(results) {\n            // return first issue-free validation if it exists\n            for (const result of results) {\n                if (result.result.status === "valid") {\n                    return result.result;\n                }\n            }\n            for (const result of results) {\n                if (result.result.status === "dirty") {\n                    // add issues from dirty option\n                    ctx.common.issues.push(...result.ctx.common.issues);\n                    return result.result;\n                }\n            }\n            // return invalid\n            const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_union,\n                unionErrors,\n            });\n            return INVALID;\n        }\n        if (ctx.common.async) {\n            return Promise.all(options.map(async (option) => {\n                const childCtx = {\n                    ...ctx,\n                    common: {\n                        ...ctx.common,\n                        issues: [],\n                    },\n                    parent: null,\n                };\n                return {\n                    result: await option._parseAsync({\n                        data: ctx.data,\n                        path: ctx.path,\n                        parent: childCtx,\n                    }),\n                    ctx: childCtx,\n                };\n            })).then(handleResults);\n        }\n        else {\n            let dirty = undefined;\n            const issues = [];\n            for (const option of options) {\n                const childCtx = {\n                    ...ctx,\n                    common: {\n                        ...ctx.common,\n                        issues: [],\n                    },\n                    parent: null,\n                };\n                const result = option._parseSync({\n                    data: ctx.data,\n                    path: ctx.path,\n                    parent: childCtx,\n                });\n                if (result.status === "valid") {\n                    return result;\n                }\n                else if (result.status === "dirty" && !dirty) {\n                    dirty = { result, ctx: childCtx };\n                }\n                if (childCtx.common.issues.length) {\n                    issues.push(childCtx.common.issues);\n                }\n            }\n            if (dirty) {\n                ctx.common.issues.push(...dirty.ctx.common.issues);\n                return dirty.result;\n            }\n            const unionErrors = issues.map((issues) => new ZodError(issues));\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_union,\n                unionErrors,\n            });\n            return INVALID;\n        }\n    }\n    get options() {\n        return this._def.options;\n    }\n}\nZodUnion.create = (types, params) => {\n    return new ZodUnion({\n        options: types,\n        typeName: ZodFirstPartyTypeKind.ZodUnion,\n        ...processCreateParams(params),\n    });\n};\n/////////////////////////////////////////////////////\n/////////////////////////////////////////////////////\n//////////                                 //////////\n//////////      ZodDiscriminatedUnion      //////////\n//////////                                 //////////\n/////////////////////////////////////////////////////\n/////////////////////////////////////////////////////\nconst getDiscriminator = (type) => {\n    if (type instanceof ZodLazy) {\n        return getDiscriminator(type.schema);\n    }\n    else if (type instanceof ZodEffects) {\n        return getDiscriminator(type.innerType());\n    }\n    else if (type instanceof ZodLiteral) {\n        return [type.value];\n    }\n    else if (type instanceof ZodEnum) {\n        return type.options;\n    }\n    else if (type instanceof ZodNativeEnum) {\n        // eslint-disable-next-line ban/ban\n        return util.objectValues(type.enum);\n    }\n    else if (type instanceof ZodDefault) {\n        return getDiscriminator(type._def.innerType);\n    }\n    else if (type instanceof ZodUndefined) {\n        return [undefined];\n    }\n    else if (type instanceof ZodNull) {\n        return [null];\n    }\n    else if (type instanceof ZodOptional) {\n        return [undefined, ...getDiscriminator(type.unwrap())];\n    }\n    else if (type instanceof ZodNullable) {\n        return [null, ...getDiscriminator(type.unwrap())];\n    }\n    else if (type instanceof ZodBranded) {\n        return getDiscriminator(type.unwrap());\n    }\n    else if (type instanceof ZodReadonly) {\n        return getDiscriminator(type.unwrap());\n    }\n    else if (type instanceof ZodCatch) {\n        return getDiscriminator(type._def.innerType);\n    }\n    else {\n        return [];\n    }\n};\nclass ZodDiscriminatedUnion extends ZodType {\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        if (ctx.parsedType !== ZodParsedType.object) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.object,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        const discriminator = this.discriminator;\n        const discriminatorValue = ctx.data[discriminator];\n        const option = this.optionsMap.get(discriminatorValue);\n        if (!option) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_union_discriminator,\n                options: Array.from(this.optionsMap.keys()),\n                path: [discriminator],\n            });\n            return INVALID;\n        }\n        if (ctx.common.async) {\n            return option._parseAsync({\n                data: ctx.data,\n                path: ctx.path,\n                parent: ctx,\n            });\n        }\n        else {\n            return option._parseSync({\n                data: ctx.data,\n                path: ctx.path,\n                parent: ctx,\n            });\n        }\n    }\n    get discriminator() {\n        return this._def.discriminator;\n    }\n    get options() {\n        return this._def.options;\n    }\n    get optionsMap() {\n        return this._def.optionsMap;\n    }\n    /**\n     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.\n     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must\n     * have a different value for each object in the union.\n     * @param discriminator the name of the discriminator property\n     * @param types an array of object schemas\n     * @param params\n     */\n    static create(discriminator, options, params) {\n        // Get all the valid discriminator values\n        const optionsMap = new Map();\n        // try {\n        for (const type of options) {\n            const discriminatorValues = getDiscriminator(type.shape[discriminator]);\n            if (!discriminatorValues.length) {\n                throw new Error(`A discriminator value for key \\`${discriminator}\\` could not be extracted from all schema options`);\n            }\n            for (const value of discriminatorValues) {\n                if (optionsMap.has(value)) {\n                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);\n                }\n                optionsMap.set(value, type);\n            }\n        }\n        return new ZodDiscriminatedUnion({\n            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,\n            discriminator,\n            options,\n            optionsMap,\n            ...processCreateParams(params),\n        });\n    }\n}\nfunction mergeValues(a, b) {\n    const aType = getParsedType(a);\n    const bType = getParsedType(b);\n    if (a === b) {\n        return { valid: true, data: a };\n    }\n    else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {\n        const bKeys = util.objectKeys(b);\n        const sharedKeys = util\n            .objectKeys(a)\n            .filter((key) => bKeys.indexOf(key) !== -1);\n        const newObj = { ...a, ...b };\n        for (const key of sharedKeys) {\n            const sharedValue = mergeValues(a[key], b[key]);\n            if (!sharedValue.valid) {\n                return { valid: false };\n            }\n            newObj[key] = sharedValue.data;\n        }\n        return { valid: true, data: newObj };\n    }\n    else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {\n        if (a.length !== b.length) {\n            return { valid: false };\n        }\n        const newArray = [];\n        for (let index = 0; index < a.length; index++) {\n            const itemA = a[index];\n            const itemB = b[index];\n            const sharedValue = mergeValues(itemA, itemB);\n            if (!sharedValue.valid) {\n                return { valid: false };\n            }\n            newArray.push(sharedValue.data);\n        }\n        return { valid: true, data: newArray };\n    }\n    else if (aType === ZodParsedType.date &&\n        bType === ZodParsedType.date &&\n        +a === +b) {\n        return { valid: true, data: a };\n    }\n    else {\n        return { valid: false };\n    }\n}\nclass ZodIntersection extends ZodType {\n    _parse(input) {\n        const { status, ctx } = this._processInputParams(input);\n        const handleParsed = (parsedLeft, parsedRight) => {\n            if (isAborted(parsedLeft) || isAborted(parsedRight)) {\n                return INVALID;\n            }\n            const merged = mergeValues(parsedLeft.value, parsedRight.value);\n            if (!merged.valid) {\n                addIssueToContext(ctx, {\n                    code: ZodIssueCode.invalid_intersection_types,\n                });\n                return INVALID;\n            }\n            if (isDirty(parsedLeft) || isDirty(parsedRight)) {\n                status.dirty();\n            }\n            return { status: status.value, value: merged.data };\n        };\n        if (ctx.common.async) {\n            return Promise.all([\n                this._def.left._parseAsync({\n                    data: ctx.data,\n                    path: ctx.path,\n                    parent: ctx,\n                }),\n                this._def.right._parseAsync({\n                    data: ctx.data,\n                    path: ctx.path,\n                    parent: ctx,\n                }),\n            ]).then(([left, right]) => handleParsed(left, right));\n        }\n        else {\n            return handleParsed(this._def.left._parseSync({\n                data: ctx.data,\n                path: ctx.path,\n                parent: ctx,\n            }), this._def.right._parseSync({\n                data: ctx.data,\n                path: ctx.path,\n                parent: ctx,\n            }));\n        }\n    }\n}\nZodIntersection.create = (left, right, params) => {\n    return new ZodIntersection({\n        left: left,\n        right: right,\n        typeName: ZodFirstPartyTypeKind.ZodIntersection,\n        ...processCreateParams(params),\n    });\n};\nclass ZodTuple extends ZodType {\n    _parse(input) {\n        const { status, ctx } = this._processInputParams(input);\n        if (ctx.parsedType !== ZodParsedType.array) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.array,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        if (ctx.data.length < this._def.items.length) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.too_small,\n                minimum: this._def.items.length,\n                inclusive: true,\n                exact: false,\n                type: "array",\n            });\n            return INVALID;\n        }\n        const rest = this._def.rest;\n        if (!rest && ctx.data.length > this._def.items.length) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.too_big,\n                maximum: this._def.items.length,\n                inclusive: true,\n                exact: false,\n                type: "array",\n            });\n            status.dirty();\n        }\n        const items = [...ctx.data]\n            .map((item, itemIndex) => {\n            const schema = this._def.items[itemIndex] || this._def.rest;\n            if (!schema)\n                return null;\n            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));\n        })\n            .filter((x) => !!x); // filter nulls\n        if (ctx.common.async) {\n            return Promise.all(items).then((results) => {\n                return ParseStatus.mergeArray(status, results);\n            });\n        }\n        else {\n            return ParseStatus.mergeArray(status, items);\n        }\n    }\n    get items() {\n        return this._def.items;\n    }\n    rest(rest) {\n        return new ZodTuple({\n            ...this._def,\n            rest,\n        });\n    }\n}\nZodTuple.create = (schemas, params) => {\n    if (!Array.isArray(schemas)) {\n        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");\n    }\n    return new ZodTuple({\n        items: schemas,\n        typeName: ZodFirstPartyTypeKind.ZodTuple,\n        rest: null,\n        ...processCreateParams(params),\n    });\n};\nclass ZodRecord extends ZodType {\n    get keySchema() {\n        return this._def.keyType;\n    }\n    get valueSchema() {\n        return this._def.valueType;\n    }\n    _parse(input) {\n        const { status, ctx } = this._processInputParams(input);\n        if (ctx.parsedType !== ZodParsedType.object) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.object,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        const pairs = [];\n        const keyType = this._def.keyType;\n        const valueType = this._def.valueType;\n        for (const key in ctx.data) {\n            pairs.push({\n                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),\n                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),\n                alwaysSet: key in ctx.data,\n            });\n        }\n        if (ctx.common.async) {\n            return ParseStatus.mergeObjectAsync(status, pairs);\n        }\n        else {\n            return ParseStatus.mergeObjectSync(status, pairs);\n        }\n    }\n    get element() {\n        return this._def.valueType;\n    }\n    static create(first, second, third) {\n        if (second instanceof ZodType) {\n            return new ZodRecord({\n                keyType: first,\n                valueType: second,\n                typeName: ZodFirstPartyTypeKind.ZodRecord,\n                ...processCreateParams(third),\n            });\n        }\n        return new ZodRecord({\n            keyType: ZodString.create(),\n            valueType: first,\n            typeName: ZodFirstPartyTypeKind.ZodRecord,\n            ...processCreateParams(second),\n        });\n    }\n}\nclass ZodMap extends ZodType {\n    get keySchema() {\n        return this._def.keyType;\n    }\n    get valueSchema() {\n        return this._def.valueType;\n    }\n    _parse(input) {\n        const { status, ctx } = this._processInputParams(input);\n        if (ctx.parsedType !== ZodParsedType.map) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.map,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        const keyType = this._def.keyType;\n        const valueType = this._def.valueType;\n        const pairs = [...ctx.data.entries()].map(([key, value], index) => {\n            return {\n                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),\n                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),\n            };\n        });\n        if (ctx.common.async) {\n            const finalMap = new Map();\n            return Promise.resolve().then(async () => {\n                for (const pair of pairs) {\n                    const key = await pair.key;\n                    const value = await pair.value;\n                    if (key.status === "aborted" || value.status === "aborted") {\n                        return INVALID;\n                    }\n                    if (key.status === "dirty" || value.status === "dirty") {\n                        status.dirty();\n                    }\n                    finalMap.set(key.value, value.value);\n                }\n                return { status: status.value, value: finalMap };\n            });\n        }\n        else {\n            const finalMap = new Map();\n            for (const pair of pairs) {\n                const key = pair.key;\n                const value = pair.value;\n                if (key.status === "aborted" || value.status === "aborted") {\n                    return INVALID;\n                }\n                if (key.status === "dirty" || value.status === "dirty") {\n                    status.dirty();\n                }\n                finalMap.set(key.value, value.value);\n            }\n            return { status: status.value, value: finalMap };\n        }\n    }\n}\nZodMap.create = (keyType, valueType, params) => {\n    return new ZodMap({\n        valueType,\n        keyType,\n        typeName: ZodFirstPartyTypeKind.ZodMap,\n        ...processCreateParams(params),\n    });\n};\nclass ZodSet extends ZodType {\n    _parse(input) {\n        const { status, ctx } = this._processInputParams(input);\n        if (ctx.parsedType !== ZodParsedType.set) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.set,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        const def = this._def;\n        if (def.minSize !== null) {\n            if (ctx.data.size < def.minSize.value) {\n                addIssueToContext(ctx, {\n                    code: ZodIssueCode.too_small,\n                    minimum: def.minSize.value,\n                    type: "set",\n                    inclusive: true,\n                    exact: false,\n                    message: def.minSize.message,\n                });\n                status.dirty();\n            }\n        }\n        if (def.maxSize !== null) {\n            if (ctx.data.size > def.maxSize.value) {\n                addIssueToContext(ctx, {\n                    code: ZodIssueCode.too_big,\n                    maximum: def.maxSize.value,\n                    type: "set",\n                    inclusive: true,\n                    exact: false,\n                    message: def.maxSize.message,\n                });\n                status.dirty();\n            }\n        }\n        const valueType = this._def.valueType;\n        function finalizeSet(elements) {\n            const parsedSet = new Set();\n            for (const element of elements) {\n                if (element.status === "aborted")\n                    return INVALID;\n                if (element.status === "dirty")\n                    status.dirty();\n                parsedSet.add(element.value);\n            }\n            return { status: status.value, value: parsedSet };\n        }\n        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));\n        if (ctx.common.async) {\n            return Promise.all(elements).then((elements) => finalizeSet(elements));\n        }\n        else {\n            return finalizeSet(elements);\n        }\n    }\n    min(minSize, message) {\n        return new ZodSet({\n            ...this._def,\n            minSize: { value: minSize, message: errorUtil.toString(message) },\n        });\n    }\n    max(maxSize, message) {\n        return new ZodSet({\n            ...this._def,\n            maxSize: { value: maxSize, message: errorUtil.toString(message) },\n        });\n    }\n    size(size, message) {\n        return this.min(size, message).max(size, message);\n    }\n    nonempty(message) {\n        return this.min(1, message);\n    }\n}\nZodSet.create = (valueType, params) => {\n    return new ZodSet({\n        valueType,\n        minSize: null,\n        maxSize: null,\n        typeName: ZodFirstPartyTypeKind.ZodSet,\n        ...processCreateParams(params),\n    });\n};\nclass ZodFunction extends ZodType {\n    constructor() {\n        super(...arguments);\n        this.validate = this.implement;\n    }\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        if (ctx.parsedType !== ZodParsedType.function) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.function,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        function makeArgsIssue(args, error) {\n            return makeIssue({\n                data: args,\n                path: ctx.path,\n                errorMaps: [\n                    ctx.common.contextualErrorMap,\n                    ctx.schemaErrorMap,\n                    getErrorMap(),\n                    errorMap,\n                ].filter((x) => !!x),\n                issueData: {\n                    code: ZodIssueCode.invalid_arguments,\n                    argumentsError: error,\n                },\n            });\n        }\n        function makeReturnsIssue(returns, error) {\n            return makeIssue({\n                data: returns,\n                path: ctx.path,\n                errorMaps: [\n                    ctx.common.contextualErrorMap,\n                    ctx.schemaErrorMap,\n                    getErrorMap(),\n                    errorMap,\n                ].filter((x) => !!x),\n                issueData: {\n                    code: ZodIssueCode.invalid_return_type,\n                    returnTypeError: error,\n                },\n            });\n        }\n        const params = { errorMap: ctx.common.contextualErrorMap };\n        const fn = ctx.data;\n        if (this._def.returns instanceof ZodPromise) {\n            // Would love a way to avoid disabling this rule, but we need\n            // an alias (using an arrow function was what caused 2651).\n            // eslint-disable-next-line @typescript-eslint/no-this-alias\n            const me = this;\n            return OK(async function (...args) {\n                const error = new ZodError([]);\n                const parsedArgs = await me._def.args\n                    .parseAsync(args, params)\n                    .catch((e) => {\n                    error.addIssue(makeArgsIssue(args, e));\n                    throw error;\n                });\n                const result = await Reflect.apply(fn, this, parsedArgs);\n                const parsedReturns = await me._def.returns._def.type\n                    .parseAsync(result, params)\n                    .catch((e) => {\n                    error.addIssue(makeReturnsIssue(result, e));\n                    throw error;\n                });\n                return parsedReturns;\n            });\n        }\n        else {\n            // Would love a way to avoid disabling this rule, but we need\n            // an alias (using an arrow function was what caused 2651).\n            // eslint-disable-next-line @typescript-eslint/no-this-alias\n            const me = this;\n            return OK(function (...args) {\n                const parsedArgs = me._def.args.safeParse(args, params);\n                if (!parsedArgs.success) {\n                    throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);\n                }\n                const result = Reflect.apply(fn, this, parsedArgs.data);\n                const parsedReturns = me._def.returns.safeParse(result, params);\n                if (!parsedReturns.success) {\n                    throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);\n                }\n                return parsedReturns.data;\n            });\n        }\n    }\n    parameters() {\n        return this._def.args;\n    }\n    returnType() {\n        return this._def.returns;\n    }\n    args(...items) {\n        return new ZodFunction({\n            ...this._def,\n            args: ZodTuple.create(items).rest(ZodUnknown.create()),\n        });\n    }\n    returns(returnType) {\n        return new ZodFunction({\n            ...this._def,\n            returns: returnType,\n        });\n    }\n    implement(func) {\n        const validatedFunc = this.parse(func);\n        return validatedFunc;\n    }\n    strictImplement(func) {\n        const validatedFunc = this.parse(func);\n        return validatedFunc;\n    }\n    static create(args, returns, params) {\n        return new ZodFunction({\n            args: (args\n                ? args\n                : ZodTuple.create([]).rest(ZodUnknown.create())),\n            returns: returns || ZodUnknown.create(),\n            typeName: ZodFirstPartyTypeKind.ZodFunction,\n            ...processCreateParams(params),\n        });\n    }\n}\nclass ZodLazy extends ZodType {\n    get schema() {\n        return this._def.getter();\n    }\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        const lazySchema = this._def.getter();\n        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });\n    }\n}\nZodLazy.create = (getter, params) => {\n    return new ZodLazy({\n        getter: getter,\n        typeName: ZodFirstPartyTypeKind.ZodLazy,\n        ...processCreateParams(params),\n    });\n};\nclass ZodLiteral extends ZodType {\n    _parse(input) {\n        if (input.data !== this._def.value) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                received: ctx.data,\n                code: ZodIssueCode.invalid_literal,\n                expected: this._def.value,\n            });\n            return INVALID;\n        }\n        return { status: "valid", value: input.data };\n    }\n    get value() {\n        return this._def.value;\n    }\n}\nZodLiteral.create = (value, params) => {\n    return new ZodLiteral({\n        value: value,\n        typeName: ZodFirstPartyTypeKind.ZodLiteral,\n        ...processCreateParams(params),\n    });\n};\nfunction createZodEnum(values, params) {\n    return new ZodEnum({\n        values,\n        typeName: ZodFirstPartyTypeKind.ZodEnum,\n        ...processCreateParams(params),\n    });\n}\nclass ZodEnum extends ZodType {\n    constructor() {\n        super(...arguments);\n        _ZodEnum_cache.set(this, void 0);\n    }\n    _parse(input) {\n        if (typeof input.data !== "string") {\n            const ctx = this._getOrReturnCtx(input);\n            const expectedValues = this._def.values;\n            addIssueToContext(ctx, {\n                expected: util.joinValues(expectedValues),\n                received: ctx.parsedType,\n                code: ZodIssueCode.invalid_type,\n            });\n            return INVALID;\n        }\n        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {\n            __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");\n        }\n        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {\n            const ctx = this._getOrReturnCtx(input);\n            const expectedValues = this._def.values;\n            addIssueToContext(ctx, {\n                received: ctx.data,\n                code: ZodIssueCode.invalid_enum_value,\n                options: expectedValues,\n            });\n            return INVALID;\n        }\n        return OK(input.data);\n    }\n    get options() {\n        return this._def.values;\n    }\n    get enum() {\n        const enumValues = {};\n        for (const val of this._def.values) {\n            enumValues[val] = val;\n        }\n        return enumValues;\n    }\n    get Values() {\n        const enumValues = {};\n        for (const val of this._def.values) {\n            enumValues[val] = val;\n        }\n        return enumValues;\n    }\n    get Enum() {\n        const enumValues = {};\n        for (const val of this._def.values) {\n            enumValues[val] = val;\n        }\n        return enumValues;\n    }\n    extract(values, newDef = this._def) {\n        return ZodEnum.create(values, {\n            ...this._def,\n            ...newDef,\n        });\n    }\n    exclude(values, newDef = this._def) {\n        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {\n            ...this._def,\n            ...newDef,\n        });\n    }\n}\n_ZodEnum_cache = new WeakMap();\nZodEnum.create = createZodEnum;\nclass ZodNativeEnum extends ZodType {\n    constructor() {\n        super(...arguments);\n        _ZodNativeEnum_cache.set(this, void 0);\n    }\n    _parse(input) {\n        const nativeEnumValues = util.getValidEnumValues(this._def.values);\n        const ctx = this._getOrReturnCtx(input);\n        if (ctx.parsedType !== ZodParsedType.string &&\n            ctx.parsedType !== ZodParsedType.number) {\n            const expectedValues = util.objectValues(nativeEnumValues);\n            addIssueToContext(ctx, {\n                expected: util.joinValues(expectedValues),\n                received: ctx.parsedType,\n                code: ZodIssueCode.invalid_type,\n            });\n            return INVALID;\n        }\n        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {\n            __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");\n        }\n        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {\n            const expectedValues = util.objectValues(nativeEnumValues);\n            addIssueToContext(ctx, {\n                received: ctx.data,\n                code: ZodIssueCode.invalid_enum_value,\n                options: expectedValues,\n            });\n            return INVALID;\n        }\n        return OK(input.data);\n    }\n    get enum() {\n        return this._def.values;\n    }\n}\n_ZodNativeEnum_cache = new WeakMap();\nZodNativeEnum.create = (values, params) => {\n    return new ZodNativeEnum({\n        values: values,\n        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,\n        ...processCreateParams(params),\n    });\n};\nclass ZodPromise extends ZodType {\n    unwrap() {\n        return this._def.type;\n    }\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        if (ctx.parsedType !== ZodParsedType.promise &&\n            ctx.common.async === false) {\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.promise,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        const promisified = ctx.parsedType === ZodParsedType.promise\n            ? ctx.data\n            : Promise.resolve(ctx.data);\n        return OK(promisified.then((data) => {\n            return this._def.type.parseAsync(data, {\n                path: ctx.path,\n                errorMap: ctx.common.contextualErrorMap,\n            });\n        }));\n    }\n}\nZodPromise.create = (schema, params) => {\n    return new ZodPromise({\n        type: schema,\n        typeName: ZodFirstPartyTypeKind.ZodPromise,\n        ...processCreateParams(params),\n    });\n};\nclass ZodEffects extends ZodType {\n    innerType() {\n        return this._def.schema;\n    }\n    sourceType() {\n        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects\n            ? this._def.schema.sourceType()\n            : this._def.schema;\n    }\n    _parse(input) {\n        const { status, ctx } = this._processInputParams(input);\n        const effect = this._def.effect || null;\n        const checkCtx = {\n            addIssue: (arg) => {\n                addIssueToContext(ctx, arg);\n                if (arg.fatal) {\n                    status.abort();\n                }\n                else {\n                    status.dirty();\n                }\n            },\n            get path() {\n                return ctx.path;\n            },\n        };\n        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);\n        if (effect.type === "preprocess") {\n            const processed = effect.transform(ctx.data, checkCtx);\n            if (ctx.common.async) {\n                return Promise.resolve(processed).then(async (processed) => {\n                    if (status.value === "aborted")\n                        return INVALID;\n                    const result = await this._def.schema._parseAsync({\n                        data: processed,\n                        path: ctx.path,\n                        parent: ctx,\n                    });\n                    if (result.status === "aborted")\n                        return INVALID;\n                    if (result.status === "dirty")\n                        return DIRTY(result.value);\n                    if (status.value === "dirty")\n                        return DIRTY(result.value);\n                    return result;\n                });\n            }\n            else {\n                if (status.value === "aborted")\n                    return INVALID;\n                const result = this._def.schema._parseSync({\n                    data: processed,\n                    path: ctx.path,\n                    parent: ctx,\n                });\n                if (result.status === "aborted")\n                    return INVALID;\n                if (result.status === "dirty")\n                    return DIRTY(result.value);\n                if (status.value === "dirty")\n                    return DIRTY(result.value);\n                return result;\n            }\n        }\n        if (effect.type === "refinement") {\n            const executeRefinement = (acc) => {\n                const result = effect.refinement(acc, checkCtx);\n                if (ctx.common.async) {\n                    return Promise.resolve(result);\n                }\n                if (result instanceof Promise) {\n                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");\n                }\n                return acc;\n            };\n            if (ctx.common.async === false) {\n                const inner = this._def.schema._parseSync({\n                    data: ctx.data,\n                    path: ctx.path,\n                    parent: ctx,\n                });\n                if (inner.status === "aborted")\n                    return INVALID;\n                if (inner.status === "dirty")\n                    status.dirty();\n                // return value is ignored\n                executeRefinement(inner.value);\n                return { status: status.value, value: inner.value };\n            }\n            else {\n                return this._def.schema\n                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })\n                    .then((inner) => {\n                    if (inner.status === "aborted")\n                        return INVALID;\n                    if (inner.status === "dirty")\n                        status.dirty();\n                    return executeRefinement(inner.value).then(() => {\n                        return { status: status.value, value: inner.value };\n                    });\n                });\n            }\n        }\n        if (effect.type === "transform") {\n            if (ctx.common.async === false) {\n                const base = this._def.schema._parseSync({\n                    data: ctx.data,\n                    path: ctx.path,\n                    parent: ctx,\n                });\n                if (!isValid(base))\n                    return base;\n                const result = effect.transform(base.value, checkCtx);\n                if (result instanceof Promise) {\n                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);\n                }\n                return { status: status.value, value: result };\n            }\n            else {\n                return this._def.schema\n                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })\n                    .then((base) => {\n                    if (!isValid(base))\n                        return base;\n                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));\n                });\n            }\n        }\n        util.assertNever(effect);\n    }\n}\nZodEffects.create = (schema, effect, params) => {\n    return new ZodEffects({\n        schema,\n        typeName: ZodFirstPartyTypeKind.ZodEffects,\n        effect,\n        ...processCreateParams(params),\n    });\n};\nZodEffects.createWithPreprocess = (preprocess, schema, params) => {\n    return new ZodEffects({\n        schema,\n        effect: { type: "preprocess", transform: preprocess },\n        typeName: ZodFirstPartyTypeKind.ZodEffects,\n        ...processCreateParams(params),\n    });\n};\nclass ZodOptional extends ZodType {\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType === ZodParsedType.undefined) {\n            return OK(undefined);\n        }\n        return this._def.innerType._parse(input);\n    }\n    unwrap() {\n        return this._def.innerType;\n    }\n}\nZodOptional.create = (type, params) => {\n    return new ZodOptional({\n        innerType: type,\n        typeName: ZodFirstPartyTypeKind.ZodOptional,\n        ...processCreateParams(params),\n    });\n};\nclass ZodNullable extends ZodType {\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType === ZodParsedType.null) {\n            return OK(null);\n        }\n        return this._def.innerType._parse(input);\n    }\n    unwrap() {\n        return this._def.innerType;\n    }\n}\nZodNullable.create = (type, params) => {\n    return new ZodNullable({\n        innerType: type,\n        typeName: ZodFirstPartyTypeKind.ZodNullable,\n        ...processCreateParams(params),\n    });\n};\nclass ZodDefault extends ZodType {\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        let data = ctx.data;\n        if (ctx.parsedType === ZodParsedType.undefined) {\n            data = this._def.defaultValue();\n        }\n        return this._def.innerType._parse({\n            data,\n            path: ctx.path,\n            parent: ctx,\n        });\n    }\n    removeDefault() {\n        return this._def.innerType;\n    }\n}\nZodDefault.create = (type, params) => {\n    return new ZodDefault({\n        innerType: type,\n        typeName: ZodFirstPartyTypeKind.ZodDefault,\n        defaultValue: typeof params.default === "function"\n            ? params.default\n            : () => params.default,\n        ...processCreateParams(params),\n    });\n};\nclass ZodCatch extends ZodType {\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        // newCtx is used to not collect issues from inner types in ctx\n        const newCtx = {\n            ...ctx,\n            common: {\n                ...ctx.common,\n                issues: [],\n            },\n        };\n        const result = this._def.innerType._parse({\n            data: newCtx.data,\n            path: newCtx.path,\n            parent: {\n                ...newCtx,\n            },\n        });\n        if (isAsync(result)) {\n            return result.then((result) => {\n                return {\n                    status: "valid",\n                    value: result.status === "valid"\n                        ? result.value\n                        : this._def.catchValue({\n                            get error() {\n                                return new ZodError(newCtx.common.issues);\n                            },\n                            input: newCtx.data,\n                        }),\n                };\n            });\n        }\n        else {\n            return {\n                status: "valid",\n                value: result.status === "valid"\n                    ? result.value\n                    : this._def.catchValue({\n                        get error() {\n                            return new ZodError(newCtx.common.issues);\n                        },\n                        input: newCtx.data,\n                    }),\n            };\n        }\n    }\n    removeCatch() {\n        return this._def.innerType;\n    }\n}\nZodCatch.create = (type, params) => {\n    return new ZodCatch({\n        innerType: type,\n        typeName: ZodFirstPartyTypeKind.ZodCatch,\n        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,\n        ...processCreateParams(params),\n    });\n};\nclass ZodNaN extends ZodType {\n    _parse(input) {\n        const parsedType = this._getType(input);\n        if (parsedType !== ZodParsedType.nan) {\n            const ctx = this._getOrReturnCtx(input);\n            addIssueToContext(ctx, {\n                code: ZodIssueCode.invalid_type,\n                expected: ZodParsedType.nan,\n                received: ctx.parsedType,\n            });\n            return INVALID;\n        }\n        return { status: "valid", value: input.data };\n    }\n}\nZodNaN.create = (params) => {\n    return new ZodNaN({\n        typeName: ZodFirstPartyTypeKind.ZodNaN,\n        ...processCreateParams(params),\n    });\n};\nconst BRAND = Symbol("zod_brand");\nclass ZodBranded extends ZodType {\n    _parse(input) {\n        const { ctx } = this._processInputParams(input);\n        const data = ctx.data;\n        return this._def.type._parse({\n            data,\n            path: ctx.path,\n            parent: ctx,\n        });\n    }\n    unwrap() {\n        return this._def.type;\n    }\n}\nclass ZodPipeline extends ZodType {\n    _parse(input) {\n        const { status, ctx } = this._processInputParams(input);\n        if (ctx.common.async) {\n            const handleAsync = async () => {\n                const inResult = await this._def.in._parseAsync({\n                    data: ctx.data,\n                    path: ctx.path,\n                    parent: ctx,\n                });\n                if (inResult.status === "aborted")\n                    return INVALID;\n                if (inResult.status === "dirty") {\n                    status.dirty();\n                    return DIRTY(inResult.value);\n                }\n                else {\n                    return this._def.out._parseAsync({\n                        data: inResult.value,\n                        path: ctx.path,\n                        parent: ctx,\n                    });\n                }\n            };\n            return handleAsync();\n        }\n        else {\n            const inResult = this._def.in._parseSync({\n                data: ctx.data,\n                path: ctx.path,\n                parent: ctx,\n            });\n            if (inResult.status === "aborted")\n                return INVALID;\n            if (inResult.status === "dirty") {\n                status.dirty();\n                return {\n                    status: "dirty",\n                    value: inResult.value,\n                };\n            }\n            else {\n                return this._def.out._parseSync({\n                    data: inResult.value,\n                    path: ctx.path,\n                    parent: ctx,\n                });\n            }\n        }\n    }\n    static create(a, b) {\n        return new ZodPipeline({\n            in: a,\n            out: b,\n            typeName: ZodFirstPartyTypeKind.ZodPipeline,\n        });\n    }\n}\nclass ZodReadonly extends ZodType {\n    _parse(input) {\n        const result = this._def.innerType._parse(input);\n        const freeze = (data) => {\n            if (isValid(data)) {\n                data.value = Object.freeze(data.value);\n            }\n            return data;\n        };\n        return isAsync(result)\n            ? result.then((data) => freeze(data))\n            : freeze(result);\n    }\n    unwrap() {\n        return this._def.innerType;\n    }\n}\nZodReadonly.create = (type, params) => {\n    return new ZodReadonly({\n        innerType: type,\n        typeName: ZodFirstPartyTypeKind.ZodReadonly,\n        ...processCreateParams(params),\n    });\n};\nfunction custom(check, params = {}, \n/**\n * @deprecated\n *\n * Pass `fatal` into the params object instead:\n *\n * ```ts\n * z.string().custom((val) => val.length > 5, { fatal: false })\n * ```\n *\n */\nfatal) {\n    if (check)\n        return ZodAny.create().superRefine((data, ctx) => {\n            var _a, _b;\n            if (!check(data)) {\n                const p = typeof params === "function"\n                    ? params(data)\n                    : typeof params === "string"\n                        ? { message: params }\n                        : params;\n                const _fatal = (_b = (_a = p.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;\n                const p2 = typeof p === "string" ? { message: p } : p;\n                ctx.addIssue({ code: "custom", ...p2, fatal: _fatal });\n            }\n        });\n    return ZodAny.create();\n}\nconst late = {\n    object: ZodObject.lazycreate,\n};\nvar ZodFirstPartyTypeKind;\n(function (ZodFirstPartyTypeKind) {\n    ZodFirstPartyTypeKind["ZodString"] = "ZodString";\n    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";\n    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";\n    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";\n    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";\n    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";\n    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";\n    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";\n    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";\n    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";\n    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";\n    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";\n    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";\n    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";\n    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";\n    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";\n    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";\n    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";\n    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";\n    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";\n    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";\n    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";\n    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";\n    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";\n    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";\n    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";\n    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";\n    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";\n    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";\n    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";\n    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";\n    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";\n    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";\n    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";\n    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";\n    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";\n})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));\nconst instanceOfType = (\n// const instanceOfType = <T extends new (...args: any[]) => any>(\ncls, params = {\n    message: `Input not instance of ${cls.name}`,\n}) => custom((data) => data instanceof cls, params);\nconst stringType = ZodString.create;\nconst numberType = ZodNumber.create;\nconst nanType = ZodNaN.create;\nconst bigIntType = ZodBigInt.create;\nconst booleanType = ZodBoolean.create;\nconst dateType = ZodDate.create;\nconst symbolType = ZodSymbol.create;\nconst undefinedType = ZodUndefined.create;\nconst nullType = ZodNull.create;\nconst anyType = ZodAny.create;\nconst unknownType = ZodUnknown.create;\nconst neverType = ZodNever.create;\nconst voidType = ZodVoid.create;\nconst arrayType = ZodArray.create;\nconst objectType = ZodObject.create;\nconst strictObjectType = ZodObject.strictCreate;\nconst unionType = ZodUnion.create;\nconst discriminatedUnionType = ZodDiscriminatedUnion.create;\nconst intersectionType = ZodIntersection.create;\nconst tupleType = ZodTuple.create;\nconst recordType = ZodRecord.create;\nconst mapType = ZodMap.create;\nconst setType = ZodSet.create;\nconst functionType = ZodFunction.create;\nconst lazyType = ZodLazy.create;\nconst literalType = ZodLiteral.create;\nconst enumType = ZodEnum.create;\nconst nativeEnumType = ZodNativeEnum.create;\nconst promiseType = ZodPromise.create;\nconst effectsType = ZodEffects.create;\nconst optionalType = ZodOptional.create;\nconst nullableType = ZodNullable.create;\nconst preprocessType = ZodEffects.createWithPreprocess;\nconst pipelineType = ZodPipeline.create;\nconst ostring = () => stringType().optional();\nconst onumber = () => numberType().optional();\nconst oboolean = () => booleanType().optional();\nconst coerce = {\n    string: ((arg) => ZodString.create({ ...arg, coerce: true })),\n    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),\n    boolean: ((arg) => ZodBoolean.create({\n        ...arg,\n        coerce: true,\n    })),\n    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),\n    date: ((arg) => ZodDate.create({ ...arg, coerce: true })),\n};\nconst NEVER = INVALID;\n\nvar z = /*#__PURE__*/Object.freeze({\n    __proto__: null,\n    defaultErrorMap: errorMap,\n    setErrorMap: setErrorMap,\n    getErrorMap: getErrorMap,\n    makeIssue: makeIssue,\n    EMPTY_PATH: EMPTY_PATH,\n    addIssueToContext: addIssueToContext,\n    ParseStatus: ParseStatus,\n    INVALID: INVALID,\n    DIRTY: DIRTY,\n    OK: OK,\n    isAborted: isAborted,\n    isDirty: isDirty,\n    isValid: isValid,\n    isAsync: isAsync,\n    get util () { return util; },\n    get objectUtil () { return objectUtil; },\n    ZodParsedType: ZodParsedType,\n    getParsedType: getParsedType,\n    ZodType: ZodType,\n    datetimeRegex: datetimeRegex,\n    ZodString: ZodString,\n    ZodNumber: ZodNumber,\n    ZodBigInt: ZodBigInt,\n    ZodBoolean: ZodBoolean,\n    ZodDate: ZodDate,\n    ZodSymbol: ZodSymbol,\n    ZodUndefined: ZodUndefined,\n    ZodNull: ZodNull,\n    ZodAny: ZodAny,\n    ZodUnknown: ZodUnknown,\n    ZodNever: ZodNever,\n    ZodVoid: ZodVoid,\n    ZodArray: ZodArray,\n    ZodObject: ZodObject,\n    ZodUnion: ZodUnion,\n    ZodDiscriminatedUnion: ZodDiscriminatedUnion,\n    ZodIntersection: ZodIntersection,\n    ZodTuple: ZodTuple,\n    ZodRecord: ZodRecord,\n    ZodMap: ZodMap,\n    ZodSet: ZodSet,\n    ZodFunction: ZodFunction,\n    ZodLazy: ZodLazy,\n    ZodLiteral: ZodLiteral,\n    ZodEnum: ZodEnum,\n    ZodNativeEnum: ZodNativeEnum,\n    ZodPromise: ZodPromise,\n    ZodEffects: ZodEffects,\n    ZodTransformer: ZodEffects,\n    ZodOptional: ZodOptional,\n    ZodNullable: ZodNullable,\n    ZodDefault: ZodDefault,\n    ZodCatch: ZodCatch,\n    ZodNaN: ZodNaN,\n    BRAND: BRAND,\n    ZodBranded: ZodBranded,\n    ZodPipeline: ZodPipeline,\n    ZodReadonly: ZodReadonly,\n    custom: custom,\n    Schema: ZodType,\n    ZodSchema: ZodType,\n    late: late,\n    get ZodFirstPartyTypeKind () { return ZodFirstPartyTypeKind; },\n    coerce: coerce,\n    any: anyType,\n    array: arrayType,\n    bigint: bigIntType,\n    boolean: booleanType,\n    date: dateType,\n    discriminatedUnion: discriminatedUnionType,\n    effect: effectsType,\n    \'enum\': enumType,\n    \'function\': functionType,\n    \'instanceof\': instanceOfType,\n    intersection: intersectionType,\n    lazy: lazyType,\n    literal: literalType,\n    map: mapType,\n    nan: nanType,\n    nativeEnum: nativeEnumType,\n    never: neverType,\n    \'null\': nullType,\n    nullable: nullableType,\n    number: numberType,\n    object: objectType,\n    oboolean: oboolean,\n    onumber: onumber,\n    optional: optionalType,\n    ostring: ostring,\n    pipeline: pipelineType,\n    preprocess: preprocessType,\n    promise: promiseType,\n    record: recordType,\n    set: setType,\n    strictObject: strictObjectType,\n    string: stringType,\n    symbol: symbolType,\n    transformer: effectsType,\n    tuple: tupleType,\n    \'undefined\': undefinedType,\n    union: unionType,\n    unknown: unknownType,\n    \'void\': voidType,\n    NEVER: NEVER,\n    ZodIssueCode: ZodIssueCode,\n    quotelessJson: quotelessJson,\n    ZodError: ZodError\n});\n\n\n\n;// ./node_modules/zod-validation-error/dist/index.mjs\n// lib/isZodErrorLike.ts\nfunction isZodErrorLike(err) {\n  return err instanceof Error && err.name === "ZodError" && "issues" in err && Array.isArray(err.issues);\n}\n\n// lib/ValidationError.ts\nvar ValidationError = class extends Error {\n  name;\n  details;\n  constructor(message, options) {\n    super(message, options);\n    this.name = "ZodValidationError";\n    this.details = getIssuesFromErrorOptions(options);\n  }\n  toString() {\n    return this.message;\n  }\n};\nfunction getIssuesFromErrorOptions(options) {\n  if (options) {\n    const cause = options.cause;\n    if (isZodErrorLike(cause)) {\n      return cause.issues;\n    }\n  }\n  return [];\n}\n\n// lib/isValidationError.ts\nfunction isValidationError(err) {\n  return err instanceof ValidationError;\n}\n\n// lib/isValidationErrorLike.ts\nfunction isValidationErrorLike(err) {\n  return err instanceof Error && err.name === "ZodValidationError";\n}\n\n// lib/fromZodIssue.ts\n\n\n// lib/config.ts\nvar ISSUE_SEPARATOR = "; ";\nvar MAX_ISSUES_IN_MESSAGE = 99;\nvar PREFIX = "Validation error";\nvar PREFIX_SEPARATOR = ": ";\nvar UNION_SEPARATOR = ", or ";\n\n// lib/prefixMessage.ts\nfunction prefixMessage(message, prefix, prefixSeparator) {\n  if (prefix !== null) {\n    if (message.length > 0) {\n      return [prefix, message].join(prefixSeparator);\n    }\n    return prefix;\n  }\n  if (message.length > 0) {\n    return message;\n  }\n  return PREFIX;\n}\n\n// lib/utils/joinPath.ts\nvar identifierRegex = /[$_\\p{ID_Start}][$\\u200c\\u200d\\p{ID_Continue}]*/u;\nfunction joinPath(path) {\n  if (path.length === 1) {\n    return path[0].toString();\n  }\n  return path.reduce((acc, item) => {\n    if (typeof item === "number") {\n      return acc + "[" + item.toString() + "]";\n    }\n    if (item.includes(\'"\')) {\n      return acc + \'["\' + escapeQuotes(item) + \'"]\';\n    }\n    if (!identifierRegex.test(item)) {\n      return acc + \'["\' + item + \'"]\';\n    }\n    const separator = acc.length === 0 ? "" : ".";\n    return acc + separator + item;\n  }, "");\n}\nfunction escapeQuotes(str) {\n  return str.replace(/"/g, \'\\\\"\');\n}\n\n// lib/utils/NonEmptyArray.ts\nfunction isNonEmptyArray(value) {\n  return value.length !== 0;\n}\n\n// lib/fromZodIssue.ts\nfunction getMessageFromZodIssue(props) {\n  const { issue, issueSeparator, unionSeparator, includePath } = props;\n  if (issue.code === "invalid_union") {\n    return issue.unionErrors.reduce((acc, zodError) => {\n      const newIssues = zodError.issues.map(\n        (issue2) => getMessageFromZodIssue({\n          issue: issue2,\n          issueSeparator,\n          unionSeparator,\n          includePath\n        })\n      ).join(issueSeparator);\n      if (!acc.includes(newIssues)) {\n        acc.push(newIssues);\n      }\n      return acc;\n    }, []).join(unionSeparator);\n  }\n  if (issue.code === "invalid_arguments") {\n    return [\n      issue.message,\n      ...issue.argumentsError.issues.map(\n        (issue2) => getMessageFromZodIssue({\n          issue: issue2,\n          issueSeparator,\n          unionSeparator,\n          includePath\n        })\n      )\n    ].join(issueSeparator);\n  }\n  if (issue.code === "invalid_return_type") {\n    return [\n      issue.message,\n      ...issue.returnTypeError.issues.map(\n        (issue2) => getMessageFromZodIssue({\n          issue: issue2,\n          issueSeparator,\n          unionSeparator,\n          includePath\n        })\n      )\n    ].join(issueSeparator);\n  }\n  if (includePath && isNonEmptyArray(issue.path)) {\n    if (issue.path.length === 1) {\n      const identifier = issue.path[0];\n      if (typeof identifier === "number") {\n        return `${issue.message} at index ${identifier}`;\n      }\n    }\n    return `${issue.message} at "${joinPath(issue.path)}"`;\n  }\n  return issue.message;\n}\nfunction fromZodIssue(issue, options = {}) {\n  const {\n    issueSeparator = ISSUE_SEPARATOR,\n    unionSeparator = UNION_SEPARATOR,\n    prefixSeparator = PREFIX_SEPARATOR,\n    prefix = PREFIX,\n    includePath = true\n  } = options;\n  const reason = getMessageFromZodIssue({\n    issue,\n    issueSeparator,\n    unionSeparator,\n    includePath\n  });\n  const message = prefixMessage(reason, prefix, prefixSeparator);\n  return new ValidationError(message, { cause: new zod.ZodError([issue]) });\n}\n\n// lib/errorMap.ts\nvar dist_errorMap = (issue, ctx) => {\n  const error = fromZodIssue({\n    ...issue,\n    // fallback to the default error message\n    // when issue does not have a message\n    message: issue.message ?? ctx.defaultError\n  });\n  return {\n    message: error.message\n  };\n};\n\n// lib/fromZodError.ts\nfunction fromZodError(zodError, options = {}) {\n  if (!isZodErrorLike(zodError)) {\n    throw new TypeError(\n      `Invalid zodError param; expected instance of ZodError. Did you mean to use the "${fromError.name}" method instead?`\n    );\n  }\n  return fromZodErrorWithoutRuntimeCheck(zodError, options);\n}\nfunction fromZodErrorWithoutRuntimeCheck(zodError, options = {}) {\n  const {\n    maxIssuesInMessage = MAX_ISSUES_IN_MESSAGE,\n    issueSeparator = ISSUE_SEPARATOR,\n    unionSeparator = UNION_SEPARATOR,\n    prefixSeparator = PREFIX_SEPARATOR,\n    prefix = PREFIX,\n    includePath = true\n  } = options;\n  const zodIssues = zodError.errors;\n  const reason = zodIssues.length === 0 ? zodError.message : zodIssues.slice(0, maxIssuesInMessage).map(\n    (issue) => getMessageFromZodIssue({\n      issue,\n      issueSeparator,\n      unionSeparator,\n      includePath\n    })\n  ).join(issueSeparator);\n  const message = prefixMessage(reason, prefix, prefixSeparator);\n  return new ValidationError(message, { cause: zodError });\n}\n\n// lib/toValidationError.ts\nvar toValidationError = (options = {}) => (err) => {\n  if (isZodErrorLike(err)) {\n    return fromZodErrorWithoutRuntimeCheck(err, options);\n  }\n  if (err instanceof Error) {\n    return new ValidationError(err.message, { cause: err });\n  }\n  return new ValidationError("Unknown error");\n};\n\n// lib/fromError.ts\nfunction fromError(err, options = {}) {\n  return toValidationError(options)(err);\n}\n\n//# sourceMappingURL=index.mjs.map\n;// ./src/services/context.ts\nconst isContentOrPageScript = () => {\n    return typeof window !== "undefined" && window.document;\n};\n\n;// ./src/services/page-current-script.ts\n\nconst scriptId = globalThis?.document?.currentScript?.getAttribute("scriptid");\nconst getScriptId = () => {\n    return scriptId;\n};\nlet currentScriptAttributes;\nif (isContentOrPageScript()) {\n    currentScriptAttributes = document?.currentScript?.attributes;\n}\nconst getCurrentScriptAttribute = (attribute) => {\n    return (document?.currentScript?.attributes || currentScriptAttributes)?.getNamedItem(attribute)?.value;\n};\n\n;// ./src/services/get-error-message.ts\nvar get_error_message_filename = "src/services/get-error-message.ts";\n\n\n\n\nconst MAX_STACK_TRACE_LENGTH = 500;\nconst getStackLog = (error) => {\n    if (!error.stack)\n        return;\n    // eslint-disable-next-line no-useless-escape\n    const regex = /\\s?\\(chrome-extension:\\/\\/[^\\)]+\\)|\\s+(\\S+\\.js:\\d+:\\d+)/g;\n    let cleanedString = error.stack?.replace(regex, "").replaceAll("async", "");\n    // Stack trace until this point:\n    // Error: Method not implemented.\n    //   at handleAnyWithTokenRequest\n    //   at Object.after\n    //   at XMLHttpRequest.<anonymous>\n    // Remove all text until the first "at"\n    const startIndex = cleanedString.indexOf("at");\n    cleanedString = cleanedString.substring(startIndex);\n    const functionNames = cleanedString.match(/(?:at\\s+)([\\w.<>]+)/g);\n    if (!functionNames) {\n        return "";\n    }\n    const processedStackTrace = functionNames\n        .map((name) => name.replace("at", "").trim())\n        .join(":");\n    return processedStackTrace.substring(0, MAX_STACK_TRACE_LENGTH);\n};\nfunction isErrorWithMessage(error) {\n    return (typeof error === "object" &&\n        error !== null &&\n        "message" in error &&\n        typeof error.message === "string");\n}\nfunction toErrorWithMessage(maybeError) {\n    if (maybeError instanceof z.ZodError) {\n        return fromError(maybeError);\n    }\n    if (isErrorWithMessage(maybeError))\n        return maybeError;\n    try {\n        return new Error(JSON.stringify(maybeError));\n    }\n    catch {\n        // fallback in case there\'s an error stringifying the maybeError\n        // like with circular references for example.\n        return new Error(String(maybeError));\n    }\n}\nfunction getContentScriptURL() {\n    try {\n        throw new Error();\n    }\n    catch (err) {\n        const error = err instanceof Error ? err : new Error(String(err));\n        if (!error.stack)\n            return null;\n        const regexes = [\n            // Chrome/Edge and others using chrome-extension:// or http(s):// URLs.\n            /((https?:\\/\\/|chrome-extension:\\/\\/)[^\\s)]+)/,\n            // Firefox/Safari typically put the URL after an "@".\n            /@((https?:\\/\\/)[^\\s)]+)/,\n        ];\n        let match = null;\n        for (const regex of regexes) {\n            match = error.stack.match(regex);\n            if (match)\n                break;\n        }\n        if (match) {\n            const fileNameMatch = match[1].match(/\\/([^/]+\\.js):/);\n            if (fileNameMatch) {\n                return fileNameMatch[1];\n            }\n            return match[1];\n        }\n    }\n    return null;\n}\nconst getCurrentFilename = () => {\n    if (isContentScript()) {\n        return getContentScriptURL();\n    }\n    else if (isWebPage()) {\n        // content or page script\n        return getScriptId();\n    }\n    else {\n        // background script\n        return get_error_message_filename;\n    }\n};\n// Final error message example:\n// Method not implemented. (/index.js) (handleAnyWithTokenRequest:Object.after:XMLHttpRequest.<anonymous>)\nfunction getErrorMessage(error) {\n    let message = typeof error === "string" ? error : toErrorWithMessage(error).message;\n    try {\n        message = message + ` (${getCurrentFilename()})`;\n        if (error instanceof Error) {\n            message = message + ` (${getStackLog(error)})`;\n        }\n    }\n    catch (e) {\n        console.error("Error in getErrorMessage", e);\n        message = message + ` (Error in getErrorMessage: ${e})`;\n    }\n    return message;\n}\n\n;// ./src/services/page-logging.ts\n\n\n\n\nlet currentDomain = undefined;\nconst setupLogger = (domain) => {\n    currentDomain = domain;\n};\nconst log = (level, data, domain = currentDomain) => {\n    if (false) {}\n    const eventType = "Cyberhaven_Log";\n    const eventData = {\n        level,\n        domain,\n    };\n    if (typeof data === "object") {\n        Object.assign(eventData, data);\n    }\n    else if (typeof data === "string") {\n        const field = level === "error" ? "error" : "message";\n        Object.assign(eventData, { [field]: data });\n    }\n    if (globals_isWebWorkerContext()) {\n        webworker_communication_dispatchOnWebWorker(eventType, eventData);\n    }\n    else {\n        dispatchOnPage(eventType, eventData);\n    }\n};\nconst logInfo = (data, domain = undefined) => log("info", data, domain);\nconst logError = (data, domain = undefined) => log("error", data, domain);\nconst logDebug = (data) => log("debug", data);\nconst logWarning = (data) => log("warning", data);\nconst MAX_ERROR_LENGTH = 1000;\nconst logFeatureError = (eventType, data) => {\n    const { error, ...rest } = data;\n    logError({\n        error: `Error occured in ${eventType}`,\n        errorMessage: getErrorMessage(error).substring(0, MAX_ERROR_LENGTH),\n        ...rest,\n    });\n};\nconst logUploadCloudFileError = (details) => {\n    logFeatureError("site-events/upload", details);\n};\nconst logRenameCloudFileError = (details) => {\n    logFeatureError("site-events/rename", details);\n};\nconst logCopyCloudFileError = (details) => {\n    logFeatureError("site-events/copy", details);\n};\nconst logSaveAsCloudFileError = (details) => {\n    logFeatureError("site-events/save-as", details);\n};\nconst logWebAppFeatureUsage = (webApp, featureName) => {\n    logInfo({\n        web_app: webApp,\n        feature_name: featureName,\n        action: "used",\n    }, "feature_usage");\n};\n\n;// ./src/services/optimistically-injected.ts\n\n// DEPRECATED. do not add new scripts here.\nconst optimisticallyInjectedScripts = ["outlook_web_app_xhr"];\nlet currentScript = !globals_isWebWorkerContext() ? document.currentScript : null;\n// only used by unit tests to update currentScript\nconst setCurrentScript = (updatedScript) => {\n    currentScript = updatedScript;\n};\nconst getCurrentScriptId = () => {\n    return currentScript?.getAttribute("scriptId");\n};\n// for content scripts\nconst getIsOptimisticallyInjected = (scriptId) => {\n    return optimisticallyInjectedScripts.includes(scriptId);\n};\n// for page scripts\nconst optimistically_injected_isCurrentScriptOptimisticallyInjected = () => {\n    if (!getCurrentScriptId() || globals_isWebWorkerContext()) {\n        return false;\n    }\n    return optimisticallyInjectedScripts.includes(getCurrentScriptId());\n};\n\n;// ./src/services/page-communication.ts\n\n// Available only in content script and page script\n// Used for communication between content script and page script within the same iframe\n\n\n\n\nconst COMMUNICATION_TIMEOUT = 1000;\nlet addVersionToEventNameByDefault = true;\nconst setAddVersionToEventNameByDefault = (value = true) => {\n    addVersionToEventNameByDefault =\n        !isCurrentScriptOptimisticallyInjected() && value;\n};\n// Used for debugging reloads\nconst randomScriptId = Math.floor(Math.random() * 1_000);\nfunction addVersion(name) {\n    return `${name}_${"25.3.1"}`;\n}\nif (!globals_isWebWorkerContext() && "production" === "test") {}\nfunction getReplyEventName(name, wrapVersion = true) {\n    const replyEventName = `${name}_reply`;\n    return wrapVersion ? addVersion(replyEventName) : replyEventName;\n}\nfunction listenPageEvent(eventName, callback, { ignoreSignal = false, wrapVersion = addVersionToEventNameByDefault, } = {}) {\n    const replyEvent = getReplyEventName(eventName, wrapVersion);\n    const listenerEventName = wrapVersion ? addVersion(eventName) : eventName;\n    document.addEventListener(listenerEventName, async function (event) {\n        try {\n            const detail = getDetails(event, listenerEventName);\n            let reply = await Promise.resolve(callback({ ...event, detail }));\n            if (reply !== undefined) {\n                reply = setDetail(replyEvent, reply);\n                document.dispatchEvent(new CustomEvent(replyEvent, { detail: reply }));\n            }\n        }\n        catch (error) {\n            console.error("Error in page event listener", error);\n            logFeatureError("page-communication", { error });\n            unsubscribe();\n        }\n    }, { signal: !ignoreSignal ? abort_controller_getSignal() : undefined, capture: true });\n}\n// data should be serializable.\n// Chome only: details may be dispatched as null due to props being functions https://stackoverflow.com/a/53914790\nfunction dispatchOnPage(eventName, data, { wrapVersion = addVersionToEventNameByDefault } = {}) {\n    const finalEventName = wrapVersion ? addVersion(eventName) : eventName;\n    data = setDetail(finalEventName, data);\n    document.dispatchEvent(new CustomEvent(finalEventName, { detail: data }));\n}\n// firefox specific due to content script / page pernmission scoping\nconst getDetails = (event, eventName) => {\n    // firefox specific due to content script / page pernmission scoping\n    const result = window[eventName];\n    return result ? result : event.detail;\n};\nconst setDetail = (eventName, detail) => {\n    // firefox specific due to content script / page pernmission scoping\n    if (typeof cloneInto !== "undefined" && window.wrappedJSObject) {\n        window.wrappedJSObject[eventName] = cloneInto(detail, window);\n    }\n    return detail;\n};\nfunction dispatchOnPageWithReply(eventName, data, { timeout = COMMUNICATION_TIMEOUT, wrapVersion = addVersionToEventNameByDefault, } = {}) {\n    const replyEvent = getReplyEventName(eventName, wrapVersion);\n    const promise = new Promise((resolve) => {\n        document.addEventListener(replyEvent, function pageDataReplyListener(event) {\n            const response = getDetails(event, replyEvent);\n            resolve(response);\n        }, { signal: abort_controller_getSignal(), once: true, capture: true });\n        const finalEventName = wrapVersion ? addVersion(eventName) : eventName;\n        data = setDetail(finalEventName, data);\n        document.dispatchEvent(new CustomEvent(finalEventName, { detail: data ?? {} }));\n    });\n    return Promise.race([promise, awaitTimeout(timeout)]);\n}\n\n;// ./src/apps/common/webworker-injector.ts\n\n\nconst mapUrlToBlob = {};\nfunction concatenateBlobsSync(...args) {\n    return new Blob(args, { type: "application/javascript" });\n}\nconst webWorkerBlob = !globals_isWebWorkerContext() ? window.CH_WEBWORKER_SCRIPT_BLOB : null;\nconst xhrBlob = new Blob([webWorkerBlob], { type: "application/javascript" });\nconst webworker_injector_interceptWebWorker = (xhrConfigs, fetchConfigs, onWebWorkerMessage) => {\n    if (isWebWorkerContext()) {\n        return;\n    }\n    if (!webWorkerBlob) {\n        console.error("Please add the compiled xhr file name script in SUPPORTED_WEBWORKER_SCRIPTS for CH_WEBWORKER_SCRIPT_BLOB to be present ");\n        return;\n    }\n    const originalCreateObjectURL = URL.createObjectURL;\n    // 2. Start saving the blobs of newly created blob urls\n    URL.createObjectURL = (blob) => {\n        // in jest test MediaSource is not defined as a type for some reason\n        if (!(blob instanceof Blob)) {\n            return originalCreateObjectURL(blob);\n        }\n        const url = originalCreateObjectURL(blob);\n        mapUrlToBlob[url] = blob;\n        return url;\n    };\n    // 3. Prepare the blob from the configs provided.\n    const jsSetConfigs = `\n  self.CYBERHAVEN_XHR_CONFIGS = ${(xhrConfigs && JSON.stringify(xhrConfigs)) || "undefined"};\n  self.CYBERHAVEN_FETCH_CONFIGS = ${(fetchConfigs && JSON.stringify(fetchConfigs)) || "undefined"};\n        `;\n    const configsBlob = new Blob([jsSetConfigs], {\n        type: "application/javascript",\n    });\n    // 4. Start intercepting new workers and providing our own blob url consisting of:\n    // - Configs script\n    // - Our own webworker script (xhrBlob)\n    // - The original webworker script (mapUrlToBlob[objectUrl])\n    globals.Worker = new Proxy(Worker, {\n        construct(target, args) {\n            const objectUrl = args[0];\n            if (!mapUrlToBlob[objectUrl]) {\n                return Reflect.construct(target, args);\n            }\n            const newLine = new Blob(["\\n"], { type: "application/javascript" });\n            const concatenatedBlob = concatenateBlobsSync(configsBlob, newLine, xhrBlob, newLine, mapUrlToBlob[objectUrl]);\n            const concatenatedUrl = originalCreateObjectURL(concatenatedBlob);\n            const newWorker = new target(concatenatedUrl, args[1]);\n            newWorker.addEventListener("message", (event) => {\n                onWebWorkerMessage?.(event, newWorker);\n            }, { signal: getSignal() });\n            return newWorker;\n        },\n    });\n};\n\n;// ./src/services/xhr-hooks.ts\n\n\n/* eslint-disable prefer-rest-params */\n/* eslint-disable @typescript-eslint/ban-ts-comment */\n\n\n\n\n\n\n\nconst rawOpen = XMLHttpRequest.prototype.open;\nconst rawSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;\nconst xhr_hooks_randomScriptId = Math.floor(Math.random() * 1_000);\nlet isEnablePreviousHookListenerRegistered = false;\nlet enabled = false;\nlet isFetchHooked = false;\nlet isXhrHooked = false;\nconst requestInfoMap = new WeakMap();\nconst registerEnablePreviousHookListener = () => {\n    if (!isEnablePreviousHookListenerRegistered && !globals_isWebWorkerContext()) {\n        listenPageEvent("Cyberhaven_EnablePreviousHookIfExist", ({ detail: { initiatedByScriptId } }) => {\n            if (xhr_hooks_randomScriptId !== initiatedByScriptId) {\n                enabled = true;\n                return { doesExist: true };\n            }\n            return;\n        }, { ignoreSignal: true });\n        isEnablePreviousHookListenerRegistered = true;\n    }\n};\nconst matchUrlWithConfigs = (configs, method, url) => {\n    return configs.some((config) => config.method === method &&\n        (config.urlRegex ? new RegExp(config.urlRegex).test(url)\n            : config.urlIncludes ? url.includes(config.urlIncludes)\n                : false));\n};\nconst matchHeadersWithConfigs = (configs, headers) => {\n    return configs.some((config) => {\n        for (const key in headers) {\n            if ((config.nameIncludes && key.includes(config.nameIncludes)) ||\n                (config.valueIncludes && headers[key].includes(config.valueIncludes))) {\n                return true;\n            }\n        }\n        return false;\n    });\n};\nconst hookWebWorkers = (xhrOptions, fetchOptions = []) => {\n    const xhrHookConfigs = [];\n    const fetchHookConfigs = [];\n    for (const option of xhrOptions) {\n        xhrHookConfigs.push(pick(option, "matchUrlBeforeConfig", "matchUrlAfterConfig", "matchHeadersAfterConfig"));\n    }\n    for (const option of fetchOptions) {\n        fetchHookConfigs.push(pick(option, "matchUrlBeforeConfig", "matchUrlAfterConfig", "matchHeadersAfterConfig"));\n    }\n    const onWebWorkerMessage = async (event, webWorker) => {\n        if (["ch_xhr_hook", "ch_fetch_hook"].includes(event.data.type)) {\n            const options = event.data.type === "ch_xhr_hook" ? xhrOptions : fetchOptions;\n            const eventData = event.data.eventData;\n            const configIndex = eventData.configIndex;\n            const configType = eventData.configType;\n            if (configType === "before") {\n                const body = await options[configIndex].before?.(eventData.args[0], eventData.args[1]);\n                // respond the with the result of processing before request back to the webworker\n                if (event.data.type === "ch_fetch_hook") {\n                    dispatchOnWebWorker("ch_fetch_hook_reply", { body: body instanceof Object ? JSON.stringify(body) : body }, webWorker);\n                }\n            }\n            else if (eventData.configType === "after") {\n                // TODO: get text from blob body (in args[0].config.body) and check against matchBodyAfter\n                if (options[configIndex].after) {\n                    if (event.data.type === "ch_fetch_hook") {\n                        eventData.args[0].json = () => Promise.resolve(eventData.args[0].jsonData);\n                    }\n                    Reflect.apply(options[configIndex].after, undefined, eventData.args);\n                }\n            }\n        }\n    };\n    if (!isWebWorkerContext()) {\n        interceptWebWorker(xhrHookConfigs, fetchHookConfigs, onWebWorkerMessage);\n    }\n};\nconst filterByUrlOption = (option, type, method, url) => {\n    const matchUrlByConfig = option[type === "before" ? "matchUrlBeforeConfig" : "matchUrlAfterConfig"];\n    return ((option[type] &&\n        option[type === "before" ? "matchUrlBefore" : "matchUrlAfter"]?.(method, url)) ||\n        (matchUrlByConfig &&\n            matchUrlWithConfigs(matchUrlByConfig, method, url.toString())));\n};\nconst getSerializableResponse = (response) => {\n    // very important to clone so that third party app could use response.json() later\n    const responseClone = response.clone();\n    const requestInfo = requestInfoMap.get(response.request);\n    return {\n        json: () => responseClone.json(),\n        status: responseClone.status,\n        statusText: responseClone.statusText,\n        url: responseClone.url,\n        ok: responseClone.ok,\n        requestId: requestInfo?.requestId,\n        body: requestInfo?.body,\n        headers: responseClone.headers &&\n            Array.from(responseClone.headers.entries()).reduce((obj, [key, value]) => {\n                obj[key] = value;\n                return obj;\n            }, {}),\n    };\n};\n// hook always before hookXHR for now\nfunction hookFetch(options) {\n    if (isFetchHooked) {\n        throw Error("Fetch Hooker is already hooked!");\n    }\n    registerEnablePreviousHookListener();\n    isFetchHooked = true;\n    enabled = !optimistically_injected_isCurrentScriptOptimisticallyInjected();\n    const unregisterFetchInterceptor = fetch_intercept.register({\n        async request(url, config) {\n            if (!enabled || !config || !config.body) {\n                return [url, config];\n            }\n            const request = new Request(url, config);\n            const beforeCallers = options.filter((callerOptions) => filterByUrlOption(callerOptions, "before", config?.method, url.toString()));\n            // provide config body to after hook\n            const afterCallersWithBodyRequired = options.filter((callerOptions) => callerOptions.requireRequestBodyInAfter &&\n                filterByUrlOption(callerOptions, "after", config?.method, url.toString()));\n            const requestId = Math.random().toString(36).substring(7);\n            if (afterCallersWithBodyRequired.length) {\n                requestInfoMap.set(request, { body: config.body, requestId });\n            }\n            try {\n                for (const callerOptions of beforeCallers) {\n                    const updatedBody = await callerOptions.before?.(config.body, {\n                        url: url.toString(),\n                        method: config.method,\n                        body: config.body,\n                        requestId,\n                    });\n                    if (updatedBody) {\n                        const updatedConfig = {\n                            ...config,\n                            body: updatedBody instanceof Object ?\n                                JSON.stringify(updatedBody)\n                                : updatedBody,\n                        };\n                        return [request, updatedConfig];\n                    }\n                }\n            }\n            catch (error) {\n                logFeatureError("fetch-hook", {\n                    type: "before",\n                    url: url.toString(),\n                    method: config.method,\n                    error,\n                });\n            }\n            return [request, config];\n        },\n        response(response) {\n            if (!enabled) {\n                return response;\n            }\n            try {\n                if (response.ok) {\n                    const afterCallers = options.filter((callerOptions) => filterByUrlOption(callerOptions, "after", response.request?.method, response.request?.url.toString()));\n                    if (!afterCallers.length) {\n                        return response;\n                    }\n                    const reponseObj = getSerializableResponse(response);\n                    requestInfoMap.delete(response.request);\n                    afterCallers.forEach((callerOptions) => {\n                        callerOptions.after?.(reponseObj);\n                    });\n                }\n            }\n            catch (error) {\n                logFeatureError("fetch-hook", {\n                    type: "after",\n                    url: response.request?.url.toString(),\n                    method: response.request?.method,\n                    error,\n                });\n            }\n            return response;\n        },\n    });\n    return {\n        setIsEnabledFetchHook: (toEnable = true) => {\n            enabled = toEnable;\n        },\n        unhookFetch: () => {\n            unregisterFetchInterceptor();\n        },\n    };\n}\n// export function hookInterceptors\n/**\n * @param {function} options.before called before request is spawn\n * @param {function} options.after called after request body is received\n * @param {function} options.matchUrlBefore must be set if using before - filters requests by method and url\n * @param {function} options.matchUrlAfter same as matchUrlBefore\n * @param {function} [options.matchHeadersAfter] filter requests by requestHeaders\n * @returns {function} unhook xmlhttprequest\n */\nfunction hookXhr(options, { enablePreviousScriptOnReload = false } = {}) {\n    registerEnablePreviousHookListener();\n    // Becase there could be interceptors like ours, and we want to unload\n    // we cannot reassign XMLHTTPRequest.* back to orignal raw function\n    // this way we keep our interceptor, but disable our inner code with condition\n    if (isXhrHooked) {\n        throw Error("XHR Hooker is already hooked!");\n    }\n    isXhrHooked = true;\n    enabled = !optimistically_injected_isCurrentScriptOptimisticallyInjected();\n    function handleXhrOpen(method, url, async) {\n        try {\n            if (enabled) {\n                const startedAt = Date.now();\n                let beforeCallers = [];\n                let afterCallers = [];\n                try {\n                    beforeCallers = options.filter((callerOptions) => filterByUrlOption(callerOptions, "before", method, url.toString()));\n                    afterCallers = options.filter((callerOptions) => filterByUrlOption(callerOptions, "after", method, url.toString()));\n                }\n                catch (error) {\n                    logError({\n                        error: "Error occured in hookXhr filterByUrlOption",\n                        errorMessage: getErrorMessage(error),\n                        url: url.toString(),\n                        method,\n                    });\n                }\n                if (beforeCallers?.length || afterCallers?.length) {\n                    const originalSend = this.send;\n                    this.send = function handleXhrSend(body) {\n                        const config = {\n                            url: url.toString(),\n                            method,\n                            body: body + "",\n                            formData: body instanceof FormData ?\n                                Object.fromEntries(body)\n                                : undefined,\n                            xhr: this,\n                        };\n                        const headers = this._chRequestHeaders;\n                        for (const afterCaller of afterCallers) {\n                            let matchedByHeaders;\n                            let matchedByBody;\n                            try {\n                                matchedByHeaders =\n                                    (!afterCaller.matchHeadersAfter &&\n                                        !afterCaller.matchHeadersAfterConfig) ||\n                                        (afterCaller.matchHeadersAfter &&\n                                            afterCaller.matchHeadersAfter?.(headers)) ||\n                                        (afterCaller.matchHeadersAfterConfig &&\n                                            matchHeadersWithConfigs(afterCaller.matchHeadersAfterConfig, headers));\n                                matchedByBody =\n                                    !afterCaller.matchBodyAfter ||\n                                        afterCaller.matchBodyAfter(body + "");\n                            }\n                            catch (error) {\n                                logError({\n                                    error: "Error occuredin hookXhr after matching",\n                                    errorMessage: getErrorMessage(error),\n                                    url: config.url,\n                                });\n                            }\n                            if (matchedByHeaders && matchedByBody) {\n                                const onReadyStateChange = async () => {\n                                    if (this.readyState === XMLHttpRequest.DONE) {\n                                        const responseText = ["text", ""].includes(this.responseType) ?\n                                            this.responseText\n                                            : ""; // reading responseType throws an error if response is blob\n                                        try {\n                                            await afterCaller.after?.({\n                                                responseText,\n                                                headers,\n                                                startedAt,\n                                                config: {\n                                                    ...config,\n                                                    status: this.status,\n                                                    response: responseText,\n                                                },\n                                            }, this);\n                                        }\n                                        catch (error) {\n                                            logError({\n                                                error: "Error occured in xhr-hooks.after",\n                                                errorMessage: getErrorMessage(error),\n                                                url: config.url,\n                                            });\n                                        }\n                                    }\n                                };\n                                this.addEventListener("readystatechange", onReadyStateChange);\n                            }\n                        }\n                        if (async) {\n                            // TODO: make sure only one caller is called, because we are not waiting for all of them\n                            for (const beforeCaller of beforeCallers) {\n                                const matchedByBody = !beforeCaller.matchBodyBefore ||\n                                    beforeCaller.matchBodyBefore(body + "");\n                                if (matchedByBody) {\n                                    beforeCaller\n                                        .before?.(body, config)\n                                        .catch((error) => {\n                                        logError({\n                                            error: "Error occured in hookXhr before",\n                                            errorMessage: getErrorMessage(error),\n                                            url: config.url,\n                                        });\n                                        originalSend.call(this, body);\n                                    })\n                                        .then((modifiedBody) => {\n                                        if (modifiedBody === null &&\n                                            beforeCaller.beforeAbortOnNull) {\n                                            this.abort();\n                                            return;\n                                        }\n                                        originalSend.call(this, modifiedBody === undefined ? body : modifiedBody); // keep the check for undefined, as we return "null" for blocking purposes\n                                    });\n                                    return;\n                                }\n                            }\n                        }\n                        originalSend.call(this, body);\n                    };\n                }\n            }\n        }\n        catch (error) {\n            logError({\n                error: "Error occured in hookXhr",\n                errorMessage: getErrorMessage(error),\n                url: url.toString(),\n            });\n        }\n        // @ts-ignore\n        rawOpen.apply(this, [].slice.call(arguments));\n    }\n    Object.defineProperty(XMLHttpRequest.prototype, "open", {\n        get() {\n            return this._open;\n        },\n        set(value) {\n            if (value.toString().includes("[native code]")) {\n                this._open = handleXhrOpen;\n                return;\n            }\n            this._open = value;\n        },\n    });\n    // @ts-ignore\n    XMLHttpRequest.prototype.open = handleXhrOpen;\n    XMLHttpRequest.prototype.setRequestHeader = handleSetRequestHeader;\n    return {\n        enableHook: (toEnable = true) => {\n            enabled = toEnable;\n            if (toEnable && enablePreviousScriptOnReload) {\n                // Useful when app has own hook and upon reload original XMLHttpRequest to proxy requests is lost\n                dispatchOnPageWithReply("Cyberhaven_EnablePreviousHookIfExist", {\n                    initiatedByScriptId: xhr_hooks_randomScriptId,\n                }).then(({ doesExist } = { doesExist: false }) => {\n                    if (doesExist) {\n                        enabled = false;\n                    }\n                });\n            }\n        },\n        unhook: () => {\n            enabled = false;\n        },\n    };\n}\nfunction handleSetRequestHeader(name, value) {\n    if (enabled) {\n        if (!this._chRequestHeaders) {\n            this._chRequestHeaders = {};\n        }\n        this._chRequestHeaders[name.toLowerCase()] = value;\n    }\n    rawSetRequestHeader.call(this, name, value);\n}\n\n;// ./src/apps/common/xhr.webworker.web.ts\n\n\n\n\nconst xhrConfigs = self.CYBERHAVEN_XHR_CONFIGS;\nconst fetchConfigs = self.CYBERHAVEN_FETCH_CONFIGS;\nif (fetchConfigs) {\n    for (let i = 0; i < fetchConfigs.length; i++) {\n        fetchConfigs[i].before = async (body, config) => {\n            const promise = new Promise((resolve) => {\n                listenOnWebWorker("ch_fetch_hook_reply", (data) => {\n                    resolve(data.body);\n                });\n                webworker_communication_dispatchOnWebWorker("ch_fetch_hook", {\n                    configIndex: i,\n                    configType: "before",\n                    args: [body, config],\n                });\n            });\n            return await Promise.race([\n                promise,\n                awaitTimeout(1000, undefined, config.body),\n            ]);\n        };\n        fetchConfigs[i].after = (response) => {\n            response.json().then((jsonData) => {\n                const reponseObj = { ...response, jsonData, json: undefined };\n                webworker_communication_dispatchOnWebWorker("ch_fetch_hook", {\n                    configIndex: i,\n                    configType: "after",\n                    args: [reponseObj],\n                });\n            });\n        };\n    }\n    const { unhookFetch } = hookFetch(fetchConfigs);\n    onCleanup(unhookFetch);\n}\nif (xhrConfigs) {\n    for (let i = 0; i < xhrConfigs.length; i++) {\n        xhrConfigs[i].before = async (_body, config) => {\n            // TODO: add support for before\n            return config.body;\n        };\n        xhrConfigs[i].after = (responseObject, _xhr) => {\n            responseObject.config.xhr = undefined;\n            webworker_communication_dispatchOnWebWorker("ch_xhr_hook", {\n                configIndex: i,\n                configType: "after",\n                args: [responseObject],\n            });\n        };\n    }\n    const { unhook } = hookXhr(xhrConfigs);\n    onCleanup(unhook);\n}\n\n/******/ })()\n;' ], {
    type: "application/javascript"
  });
  window.CH_WEBWORKER_SCRIPT_BLOB = blob;
}(), (() => {
  "use strict";
  let cache = !0;
  function isCurrentPathname(path) {
    if (!path) return !1;
    try {
      const {pathname} = new URL(path, location.origin);
      return pathname === location.pathname;
    } catch {
      return !1;
    }
  }
  function getManifest(_version) {
    return globalThis.chrome?.runtime?.getManifest?.();
  }
  function once(function_) {
    let result;
    return () => (cache && void 0 !== result || (result = function_()), result);
  }
  const isWebPage = once((() => [ "about:", "http:", "https:" ].includes(location.protocol))), isExtensionContext = once((() => "string" == typeof globalThis.chrome?.runtime?.id)), isSandboxedPage = once((() => location.protocol.endsWith("-extension:") && !isExtensionContext())), isContentScript = once((() => isExtensionContext() && isWebPage())), isBackgroundPage = once((() => {
    const manifest = getManifest();
    return !!manifest && (!!isCurrentPathname(manifest.background_page ?? manifest.background?.page) || Boolean(manifest.background?.scripts && isCurrentPathname("/_generated_background_page.html")));
  })), isBackgroundWorker = once((() => isCurrentPathname(getManifest()?.background?.service_worker))), isOptionsPage = (once((() => isBackgroundPage() && 2 === getManifest()?.manifest_version && !1 !== getManifest()?.background?.persistent)), 
  once((() => isCurrentPathname(getManifest()?.options_ui?.page ?? getManifest()?.options_page)))), isSidePanel = once((() => isCurrentPathname(getManifest()?.side_panel?.default_path))), isActionPopup = once((() => globalThis.outerHeight - globalThis.innerHeight == 14 || isCurrentPathname(getManifest()?.action?.default_popup ?? getManifest()?.browser_action?.default_popup))), isDevToolsPage = once((() => isExtensionContext() && Boolean(chrome.devtools) && isCurrentPathname(getManifest()?.devtools_page))), isOffscreenDocument = once((() => isExtensionContext() && "document" in globalThis && void 0 === globalThis.chrome?.extension)), contextChecks = {
    contentScript: isContentScript,
    background: () => isBackgroundPage() || isBackgroundWorker(),
    options: isOptionsPage,
    sidePanel: isSidePanel,
    actionPopup: isActionPopup,
    devTools: () => Boolean(globalThis.chrome?.devtools),
    devToolsPage: isDevToolsPage,
    offscreenDocument: isOffscreenDocument,
    extension: isExtensionContext,
    sandbox: isSandboxedPage,
    web: isWebPage
  };
  Object.keys(contextChecks);
  const isWebWorkerContext = () => "function" == typeof importScripts && !function() {
    for (const [name, test] of Object.entries(contextChecks)) if (test()) return name;
    return "unknown";
  }().includes("background"), globals = isWebWorkerContext() ? self : window;
  var util, objectUtil;
  !function(util) {
    util.assertEqual = val => val, util.assertIs = function(_arg) {}, util.assertNever = function(_x) {
      throw new Error;
    }, util.arrayToEnum = items => {
      const obj = {};
      for (const item of items) obj[item] = item;
      return obj;
    }, util.getValidEnumValues = obj => {
      const validKeys = util.objectKeys(obj).filter((k => "number" != typeof obj[obj[k]])), filtered = {};
      for (const k of validKeys) filtered[k] = obj[k];
      return util.objectValues(filtered);
    }, util.objectValues = obj => util.objectKeys(obj).map((function(e) {
      return obj[e];
    })), util.objectKeys = "function" == typeof Object.keys ? obj => Object.keys(obj) : object => {
      const keys = [];
      for (const key in object) Object.prototype.hasOwnProperty.call(object, key) && keys.push(key);
      return keys;
    }, util.find = (arr, checker) => {
      for (const item of arr) if (checker(item)) return item;
    }, util.isInteger = "function" == typeof Number.isInteger ? val => Number.isInteger(val) : val => "number" == typeof val && isFinite(val) && Math.floor(val) === val, 
    util.joinValues = function(array, separator = " | ") {
      return array.map((val => "string" == typeof val ? `'${val}'` : val)).join(separator);
    }, util.jsonStringifyReplacer = (_, value) => "bigint" == typeof value ? value.toString() : value;
  }(util || (util = {})), function(objectUtil) {
    objectUtil.mergeShapes = (first, second) => ({
      ...first,
      ...second
    });
  }(objectUtil || (objectUtil = {}));
  const ZodParsedType = util.arrayToEnum([ "string", "nan", "number", "integer", "float", "boolean", "date", "bigint", "symbol", "function", "undefined", "null", "array", "object", "unknown", "promise", "void", "never", "map", "set" ]), getParsedType = data => {
    switch (typeof data) {
     case "undefined":
      return ZodParsedType.undefined;

     case "string":
      return ZodParsedType.string;

     case "number":
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;

     case "boolean":
      return ZodParsedType.boolean;

     case "function":
      return ZodParsedType.function;

     case "bigint":
      return ZodParsedType.bigint;

     case "symbol":
      return ZodParsedType.symbol;

     case "object":
      return Array.isArray(data) ? ZodParsedType.array : null === data ? ZodParsedType.null : data.then && "function" == typeof data.then && data.catch && "function" == typeof data.catch ? ZodParsedType.promise : "undefined" != typeof Map && data instanceof Map ? ZodParsedType.map : "undefined" != typeof Set && data instanceof Set ? ZodParsedType.set : "undefined" != typeof Date && data instanceof Date ? ZodParsedType.date : ZodParsedType.object;

     default:
      return ZodParsedType.unknown;
    }
  }, ZodIssueCode = util.arrayToEnum([ "invalid_type", "invalid_literal", "custom", "invalid_union", "invalid_union_discriminator", "invalid_enum_value", "unrecognized_keys", "invalid_arguments", "invalid_return_type", "invalid_date", "invalid_string", "too_small", "too_big", "invalid_intersection_types", "not_multiple_of", "not_finite" ]);
  class ZodError extends Error {
    constructor(issues) {
      super(), this.issues = [], this.addIssue = sub => {
        this.issues = [ ...this.issues, sub ];
      }, this.addIssues = (subs = []) => {
        this.issues = [ ...this.issues, ...subs ];
      };
      const actualProto = new.target.prototype;
      Object.setPrototypeOf ? Object.setPrototypeOf(this, actualProto) : this.__proto__ = actualProto, 
      this.name = "ZodError", this.issues = issues;
    }
    get errors() {
      return this.issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      }, fieldErrors = {
        _errors: []
      }, processError = error => {
        for (const issue of error.issues) if ("invalid_union" === issue.code) issue.unionErrors.map(processError); else if ("invalid_return_type" === issue.code) processError(issue.returnTypeError); else if ("invalid_arguments" === issue.code) processError(issue.argumentsError); else if (0 === issue.path.length) fieldErrors._errors.push(mapper(issue)); else {
          let curr = fieldErrors, i = 0;
          for (;i < issue.path.length; ) {
            const el = issue.path[i];
            i === issue.path.length - 1 ? (curr[el] = curr[el] || {
              _errors: []
            }, curr[el]._errors.push(mapper(issue))) : curr[el] = curr[el] || {
              _errors: []
            }, curr = curr[el], i++;
          }
        }
      };
      return processError(this), fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return 0 === this.issues.length;
    }
    flatten(mapper = issue => issue.message) {
      const fieldErrors = {}, formErrors = [];
      for (const sub of this.issues) sub.path.length > 0 ? (fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [], 
      fieldErrors[sub.path[0]].push(mapper(sub))) : formErrors.push(mapper(sub));
      return {
        formErrors,
        fieldErrors
      };
    }
    get formErrors() {
      return this.flatten();
    }
  }
  ZodError.create = issues => new ZodError(issues);
  const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
     case ZodIssueCode.invalid_type:
      message = issue.received === ZodParsedType.undefined ? "Required" : `Expected ${issue.expected}, received ${issue.received}`;
      break;

     case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;

     case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;

     case ZodIssueCode.invalid_union:
      message = "Invalid input";
      break;

     case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;

     case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;

     case ZodIssueCode.invalid_arguments:
      message = "Invalid function arguments";
      break;

     case ZodIssueCode.invalid_return_type:
      message = "Invalid function return type";
      break;

     case ZodIssueCode.invalid_date:
      message = "Invalid date";
      break;

     case ZodIssueCode.invalid_string:
      "object" == typeof issue.validation ? "includes" in issue.validation ? (message = `Invalid input: must include "${issue.validation.includes}"`, 
      "number" == typeof issue.validation.position && (message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`)) : "startsWith" in issue.validation ? message = `Invalid input: must start with "${issue.validation.startsWith}"` : "endsWith" in issue.validation ? message = `Invalid input: must end with "${issue.validation.endsWith}"` : util.assertNever(issue.validation) : message = "regex" !== issue.validation ? `Invalid ${issue.validation}` : "Invalid";
      break;

     case ZodIssueCode.too_small:
      message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "more than"} ${issue.minimum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at least" : "over"} ${issue.minimum} character(s)` : "number" === issue.type ? `Number must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${issue.minimum}` : "date" === issue.type ? `Date must be ${issue.exact ? "exactly equal to " : issue.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(issue.minimum))}` : "Invalid input";
      break;

     case ZodIssueCode.too_big:
      message = "array" === issue.type ? `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "less than"} ${issue.maximum} element(s)` : "string" === issue.type ? `String must contain ${issue.exact ? "exactly" : issue.inclusive ? "at most" : "under"} ${issue.maximum} character(s)` : "number" === issue.type ? `Number must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : "bigint" === issue.type ? `BigInt must be ${issue.exact ? "exactly" : issue.inclusive ? "less than or equal to" : "less than"} ${issue.maximum}` : "date" === issue.type ? `Date must be ${issue.exact ? "exactly" : issue.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(issue.maximum))}` : "Invalid input";
      break;

     case ZodIssueCode.custom:
      message = "Invalid input";
      break;

     case ZodIssueCode.invalid_intersection_types:
      message = "Intersection results could not be merged";
      break;

     case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;

     case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;

     default:
      message = _ctx.defaultError, util.assertNever(issue);
    }
    return {
      message
    };
  };
  let overrideErrorMap = errorMap;
  function getErrorMap() {
    return overrideErrorMap;
  }
  const makeIssue = params => {
    const {data, path, errorMaps, issueData} = params, fullPath = [ ...path, ...issueData.path || [] ], fullIssue = {
      ...issueData,
      path: fullPath
    };
    if (void 0 !== issueData.message) return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
    let errorMessage = "";
    const maps = errorMaps.filter((m => !!m)).slice().reverse();
    for (const map of maps) errorMessage = map(fullIssue, {
      data,
      defaultError: errorMessage
    }).message;
    return {
      ...issueData,
      path: fullPath,
      message: errorMessage
    };
  };
  function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap(), issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, overrideMap, overrideMap === errorMap ? void 0 : errorMap ].filter((x => !!x))
    });
    ctx.common.issues.push(issue);
  }
  class ParseStatus {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      "valid" === this.value && (this.value = "dirty");
    }
    abort() {
      "aborted" !== this.value && (this.value = "aborted");
    }
    static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
        if ("aborted" === s.status) return INVALID;
        "dirty" === s.status && status.dirty(), arrayValue.push(s.value);
      }
      return {
        status: status.value,
        value: arrayValue
      };
    }
    static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key, value = await pair.value;
        syncPairs.push({
          key,
          value
        });
      }
      return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
        const {key, value} = pair;
        if ("aborted" === key.status) return INVALID;
        if ("aborted" === value.status) return INVALID;
        "dirty" === key.status && status.dirty(), "dirty" === value.status && status.dirty(), 
        "__proto__" === key.value || void 0 === value.value && !pair.alwaysSet || (finalObject[key.value] = value.value);
      }
      return {
        status: status.value,
        value: finalObject
      };
    }
  }
  const INVALID = Object.freeze({
    status: "aborted"
  }), DIRTY = value => ({
    status: "dirty",
    value
  }), OK = value => ({
    status: "valid",
    value
  }), isAborted = x => "aborted" === x.status, isDirty = x => "dirty" === x.status, isValid = x => "valid" === x.status, isAsync = x => "undefined" != typeof Promise && x instanceof Promise;
  function __classPrivateFieldGet(receiver, state, kind, f) {
    if ("a" === kind && !f) throw new TypeError("Private accessor was defined without a getter");
    if ("function" == typeof state ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return "m" === kind ? f : "a" === kind ? f.call(receiver) : f ? f.value : state.get(receiver);
  }
  function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if ("m" === kind) throw new TypeError("Private method is not writable");
    if ("a" === kind && !f) throw new TypeError("Private accessor was defined without a setter");
    if ("function" == typeof state ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return "a" === kind ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), 
    value;
  }
  var errorUtil, _ZodEnum_cache, _ZodNativeEnum_cache;
  "function" == typeof SuppressedError && SuppressedError, function(errorUtil) {
    errorUtil.errToObj = message => "string" == typeof message ? {
      message
    } : message || {}, errorUtil.toString = message => "string" == typeof message ? message : null == message ? void 0 : message.message;
  }(errorUtil || (errorUtil = {}));
  class ParseInputLazyPath {
    constructor(parent, value, path, key) {
      this._cachedPath = [], this.parent = parent, this.data = value, this._path = path, 
      this._key = key;
    }
    get path() {
      return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), 
      this._cachedPath;
    }
  }
  const handleResult = (ctx, result) => {
    if (isValid(result)) return {
      success: !0,
      data: result.value
    };
    if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
    return {
      success: !1,
      get error() {
        if (this._error) return this._error;
        const error = new ZodError(ctx.common.issues);
        return this._error = error, this._error;
      }
    };
  };
  function processCreateParams(params) {
    if (!params) return {};
    const {errorMap, invalid_type_error, required_error, description} = params;
    if (errorMap && (invalid_type_error || required_error)) throw new Error('Can\'t use "invalid_type_error" or "required_error" in conjunction with custom error map.');
    if (errorMap) return {
      errorMap,
      description
    };
    return {
      errorMap: (iss, ctx) => {
        var _a, _b;
        const {message} = params;
        return "invalid_enum_value" === iss.code ? {
          message: null != message ? message : ctx.defaultError
        } : void 0 === ctx.data ? {
          message: null !== (_a = null != message ? message : required_error) && void 0 !== _a ? _a : ctx.defaultError
        } : "invalid_type" !== iss.code ? {
          message: ctx.defaultError
        } : {
          message: null !== (_b = null != message ? message : invalid_type_error) && void 0 !== _b ? _b : ctx.defaultError
        };
      },
      description
    };
  }
  class ZodType {
    constructor(def) {
      this.spa = this.safeParseAsync, this._def = def, this.parse = this.parse.bind(this), 
      this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), 
      this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), 
      this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), 
      this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), 
      this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), 
      this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), 
      this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), 
      this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), 
      this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), 
      this.isOptional = this.isOptional.bind(this);
    }
    get description() {
      return this._def.description;
    }
    _getType(input) {
      return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
      return ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      };
    }
    _processInputParams(input) {
      return {
        status: new ParseStatus,
        ctx: {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        }
      };
    }
    _parseSync(input) {
      const result = this._parse(input);
      if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
      return result;
    }
    _parseAsync(input) {
      const result = this._parse(input);
      return Promise.resolve(result);
    }
    parse(data, params) {
      const result = this.safeParse(data, params);
      if (result.success) return result.data;
      throw result.error;
    }
    safeParse(data, params) {
      var _a;
      const ctx = {
        common: {
          issues: [],
          async: null !== (_a = null == params ? void 0 : params.async) && void 0 !== _a && _a,
          contextualErrorMap: null == params ? void 0 : params.errorMap
        },
        path: (null == params ? void 0 : params.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      }, result = this._parseSync({
        data,
        path: ctx.path,
        parent: ctx
      });
      return handleResult(ctx, result);
    }
    async parseAsync(data, params) {
      const result = await this.safeParseAsync(data, params);
      if (result.success) return result.data;
      throw result.error;
    }
    async safeParseAsync(data, params) {
      const ctx = {
        common: {
          issues: [],
          contextualErrorMap: null == params ? void 0 : params.errorMap,
          async: !0
        },
        path: (null == params ? void 0 : params.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      }, maybeAsyncResult = this._parse({
        data,
        path: ctx.path,
        parent: ctx
      }), result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result);
    }
    refine(check, message) {
      const getIssueProperties = val => "string" == typeof message || void 0 === message ? {
        message
      } : "function" == typeof message ? message(val) : message;
      return this._refinement(((val, ctx) => {
        const result = check(val), setError = () => ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val)
        });
        return "undefined" != typeof Promise && result instanceof Promise ? result.then((data => !!data || (setError(), 
        !1))) : !!result || (setError(), !1);
      }));
    }
    refinement(check, refinementData) {
      return this._refinement(((val, ctx) => !!check(val) || (ctx.addIssue("function" == typeof refinementData ? refinementData(val, ctx) : refinementData), 
      !1)));
    }
    _refinement(refinement) {
      return new ZodEffects({
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: {
          type: "refinement",
          refinement
        }
      });
    }
    superRefine(refinement) {
      return this._refinement(refinement);
    }
    optional() {
      return ZodOptional.create(this, this._def);
    }
    nullable() {
      return ZodNullable.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return ZodArray.create(this, this._def);
    }
    promise() {
      return ZodPromise.create(this, this._def);
    }
    or(option) {
      return ZodUnion.create([ this, option ], this._def);
    }
    and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
      return new ZodEffects({
        ...processCreateParams(this._def),
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: {
          type: "transform",
          transform
        }
      });
    }
    default(def) {
      const defaultValueFunc = "function" == typeof def ? def : () => def;
      return new ZodDefault({
        ...processCreateParams(this._def),
        innerType: this,
        defaultValue: defaultValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodDefault
      });
    }
    brand() {
      return new ZodBranded({
        typeName: ZodFirstPartyTypeKind.ZodBranded,
        type: this,
        ...processCreateParams(this._def)
      });
    }
    catch(def) {
      const catchValueFunc = "function" == typeof def ? def : () => def;
      return new ZodCatch({
        ...processCreateParams(this._def),
        innerType: this,
        catchValue: catchValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodCatch
      });
    }
    describe(description) {
      return new (0, this.constructor)({
        ...this._def,
        description
      });
    }
    pipe(target) {
      return ZodPipeline.create(this, target);
    }
    readonly() {
      return ZodReadonly.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  }
  const cuidRegex = /^c[^\s-]{8,}$/i, cuid2Regex = /^[0-9a-z]+$/, ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/, uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, nanoidRegex = /^[a-z0-9_-]{21}$/i, durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  let emojiRegex;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/, base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, dateRegexSource = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", dateRegex = new RegExp(`^${dateRegexSource}$`);
  function timeRegexSource(args) {
    let regex = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
    return args.precision ? regex = `${regex}\\.\\d{${args.precision}}` : null == args.precision && (regex = `${regex}(\\.\\d+)?`), 
    regex;
  }
  function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    return opts.push(args.local ? "Z?" : "Z"), args.offset && opts.push("([+-]\\d{2}:?\\d{2})"), 
    regex = `${regex}(${opts.join("|")})`, new RegExp(`^${regex}$`);
  }
  class ZodString extends ZodType {
    _parse(input) {
      this._def.coerce && (input.data = String(input.data));
      if (this._getType(input) !== ZodParsedType.string) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx.parsedType
        }), INVALID;
      }
      const status = new ParseStatus;
      let ctx;
      for (const check of this._def.checks) if ("min" === check.kind) input.data.length < check.value && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: check.value,
        type: "string",
        inclusive: !0,
        exact: !1,
        message: check.message
      }), status.dirty()); else if ("max" === check.kind) input.data.length > check.value && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: check.value,
        type: "string",
        inclusive: !0,
        exact: !1,
        message: check.message
      }), status.dirty()); else if ("length" === check.kind) {
        const tooBig = input.data.length > check.value, tooSmall = input.data.length < check.value;
        (tooBig || tooSmall) && (ctx = this._getOrReturnCtx(input, ctx), tooBig ? addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check.message
        }) : tooSmall && addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: check.message
        }), status.dirty());
      } else if ("email" === check.kind) emailRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "email",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()); else if ("emoji" === check.kind) emojiRegex || (emojiRegex = new RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u")), 
      emojiRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
        validation: "emoji",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()); else if ("uuid" === check.kind) uuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "uuid",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()); else if ("nanoid" === check.kind) nanoidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "nanoid",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()); else if ("cuid" === check.kind) cuidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "cuid",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()); else if ("cuid2" === check.kind) cuid2Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "cuid2",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()); else if ("ulid" === check.kind) ulidRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "ulid",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()); else if ("url" === check.kind) try {
        new URL(input.data);
      } catch (_a) {
        ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "url",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty();
      } else if ("regex" === check.kind) {
        check.regex.lastIndex = 0;
        check.regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          validation: "regex",
          code: ZodIssueCode.invalid_string,
          message: check.message
        }), status.dirty());
      } else if ("trim" === check.kind) input.data = input.data.trim(); else if ("includes" === check.kind) input.data.includes(check.value, check.position) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: {
          includes: check.value,
          position: check.position
        },
        message: check.message
      }), status.dirty()); else if ("toLowerCase" === check.kind) input.data = input.data.toLowerCase(); else if ("toUpperCase" === check.kind) input.data = input.data.toUpperCase(); else if ("startsWith" === check.kind) input.data.startsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: {
          startsWith: check.value
        },
        message: check.message
      }), status.dirty()); else if ("endsWith" === check.kind) input.data.endsWith(check.value) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_string,
        validation: {
          endsWith: check.value
        },
        message: check.message
      }), status.dirty()); else if ("datetime" === check.kind) {
        datetimeRegex(check).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: "datetime",
          message: check.message
        }), status.dirty());
      } else if ("date" === check.kind) {
        dateRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: "date",
          message: check.message
        }), status.dirty());
      } else if ("time" === check.kind) {
        new RegExp(`^${timeRegexSource(check)}$`).test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: "time",
          message: check.message
        }), status.dirty());
      } else "duration" === check.kind ? durationRegex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "duration",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : "ip" === check.kind ? (ip = input.data, ("v4" !== (version = check.version) && version || !ipv4Regex.test(ip)) && ("v6" !== version && version || !ipv6Regex.test(ip)) && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "ip",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty())) : "base64" === check.kind ? base64Regex.test(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        validation: "base64",
        code: ZodIssueCode.invalid_string,
        message: check.message
      }), status.dirty()) : util.assertNever(check);
      var ip, version;
      return {
        status: status.value,
        value: input.data
      };
    }
    _regex(regex, validation, message) {
      return this.refinement((data => regex.test(data)), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new ZodString({
        ...this._def,
        checks: [ ...this._def.checks, check ]
      });
    }
    email(message) {
      return this._addCheck({
        kind: "email",
        ...errorUtil.errToObj(message)
      });
    }
    url(message) {
      return this._addCheck({
        kind: "url",
        ...errorUtil.errToObj(message)
      });
    }
    emoji(message) {
      return this._addCheck({
        kind: "emoji",
        ...errorUtil.errToObj(message)
      });
    }
    uuid(message) {
      return this._addCheck({
        kind: "uuid",
        ...errorUtil.errToObj(message)
      });
    }
    nanoid(message) {
      return this._addCheck({
        kind: "nanoid",
        ...errorUtil.errToObj(message)
      });
    }
    cuid(message) {
      return this._addCheck({
        kind: "cuid",
        ...errorUtil.errToObj(message)
      });
    }
    cuid2(message) {
      return this._addCheck({
        kind: "cuid2",
        ...errorUtil.errToObj(message)
      });
    }
    ulid(message) {
      return this._addCheck({
        kind: "ulid",
        ...errorUtil.errToObj(message)
      });
    }
    base64(message) {
      return this._addCheck({
        kind: "base64",
        ...errorUtil.errToObj(message)
      });
    }
    ip(options) {
      return this._addCheck({
        kind: "ip",
        ...errorUtil.errToObj(options)
      });
    }
    datetime(options) {
      var _a, _b;
      return "string" == typeof options ? this._addCheck({
        kind: "datetime",
        precision: null,
        offset: !1,
        local: !1,
        message: options
      }) : this._addCheck({
        kind: "datetime",
        precision: void 0 === (null == options ? void 0 : options.precision) ? null : null == options ? void 0 : options.precision,
        offset: null !== (_a = null == options ? void 0 : options.offset) && void 0 !== _a && _a,
        local: null !== (_b = null == options ? void 0 : options.local) && void 0 !== _b && _b,
        ...errorUtil.errToObj(null == options ? void 0 : options.message)
      });
    }
    date(message) {
      return this._addCheck({
        kind: "date",
        message
      });
    }
    time(options) {
      return "string" == typeof options ? this._addCheck({
        kind: "time",
        precision: null,
        message: options
      }) : this._addCheck({
        kind: "time",
        precision: void 0 === (null == options ? void 0 : options.precision) ? null : null == options ? void 0 : options.precision,
        ...errorUtil.errToObj(null == options ? void 0 : options.message)
      });
    }
    duration(message) {
      return this._addCheck({
        kind: "duration",
        ...errorUtil.errToObj(message)
      });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: null == options ? void 0 : options.position,
        ...errorUtil.errToObj(null == options ? void 0 : options.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new ZodString({
        ...this._def,
        checks: [ ...this._def.checks, {
          kind: "trim"
        } ]
      });
    }
    toLowerCase() {
      return new ZodString({
        ...this._def,
        checks: [ ...this._def.checks, {
          kind: "toLowerCase"
        } ]
      });
    }
    toUpperCase() {
      return new ZodString({
        ...this._def,
        checks: [ ...this._def.checks, {
          kind: "toUpperCase"
        } ]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch => "datetime" === ch.kind));
    }
    get isDate() {
      return !!this._def.checks.find((ch => "date" === ch.kind));
    }
    get isTime() {
      return !!this._def.checks.find((ch => "time" === ch.kind));
    }
    get isDuration() {
      return !!this._def.checks.find((ch => "duration" === ch.kind));
    }
    get isEmail() {
      return !!this._def.checks.find((ch => "email" === ch.kind));
    }
    get isURL() {
      return !!this._def.checks.find((ch => "url" === ch.kind));
    }
    get isEmoji() {
      return !!this._def.checks.find((ch => "emoji" === ch.kind));
    }
    get isUUID() {
      return !!this._def.checks.find((ch => "uuid" === ch.kind));
    }
    get isNANOID() {
      return !!this._def.checks.find((ch => "nanoid" === ch.kind));
    }
    get isCUID() {
      return !!this._def.checks.find((ch => "cuid" === ch.kind));
    }
    get isCUID2() {
      return !!this._def.checks.find((ch => "cuid2" === ch.kind));
    }
    get isULID() {
      return !!this._def.checks.find((ch => "ulid" === ch.kind));
    }
    get isIP() {
      return !!this._def.checks.find((ch => "ip" === ch.kind));
    }
    get isBase64() {
      return !!this._def.checks.find((ch => "base64" === ch.kind));
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
      return max;
    }
  }
  function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length, stepDecCount = (step.toString().split(".")[1] || "").length, decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    return parseInt(val.toFixed(decCount).replace(".", "")) % parseInt(step.toFixed(decCount).replace(".", "")) / Math.pow(10, decCount);
  }
  ZodString.create = params => {
    var _a;
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: null !== (_a = null == params ? void 0 : params.coerce) && void 0 !== _a && _a,
      ...processCreateParams(params)
    });
  };
  class ZodNumber extends ZodType {
    constructor() {
      super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
    }
    _parse(input) {
      this._def.coerce && (input.data = Number(input.data));
      if (this._getType(input) !== ZodParsedType.number) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx.parsedType
        }), INVALID;
      }
      let ctx;
      const status = new ParseStatus;
      for (const check of this._def.checks) if ("int" === check.kind) util.isInteger(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: "integer",
        received: "float",
        message: check.message
      }), status.dirty()); else if ("min" === check.kind) {
        (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: "number",
          inclusive: check.inclusive,
          exact: !1,
          message: check.message
        }), status.dirty());
      } else if ("max" === check.kind) {
        (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: "number",
          inclusive: check.inclusive,
          exact: !1,
          message: check.message
        }), status.dirty());
      } else "multipleOf" === check.kind ? 0 !== floatSafeRemainder(input.data, check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.not_multiple_of,
        multipleOf: check.value,
        message: check.message
      }), status.dirty()) : "finite" === check.kind ? Number.isFinite(input.data) || (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.not_finite,
        message: check.message
      }), status.dirty()) : util.assertNever(check);
      return {
        status: status.value,
        value: input.data
      };
    }
    gte(value, message) {
      return this.setLimit("min", value, !0, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, !1, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, !0, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, !1, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new ZodNumber({
        ...this._def,
        checks: [ ...this._def.checks, {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        } ]
      });
    }
    _addCheck(check) {
      return new ZodNumber({
        ...this._def,
        checks: [ ...this._def.checks, check ]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: !1,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: !1,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: !0,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: !0,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: !0,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: !0,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch => "int" === ch.kind || "multipleOf" === ch.kind && util.isInteger(ch.value)));
    }
    get isFinite() {
      let max = null, min = null;
      for (const ch of this._def.checks) {
        if ("finite" === ch.kind || "int" === ch.kind || "multipleOf" === ch.kind) return !0;
        "min" === ch.kind ? (null === min || ch.value > min) && (min = ch.value) : "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  }
  ZodNumber.create = params => new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: (null == params ? void 0 : params.coerce) || !1,
    ...processCreateParams(params)
  });
  class ZodBigInt extends ZodType {
    constructor() {
      super(...arguments), this.min = this.gte, this.max = this.lte;
    }
    _parse(input) {
      this._def.coerce && (input.data = BigInt(input.data));
      if (this._getType(input) !== ZodParsedType.bigint) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.bigint,
          received: ctx.parsedType
        }), INVALID;
      }
      let ctx;
      const status = new ParseStatus;
      for (const check of this._def.checks) if ("min" === check.kind) {
        (check.inclusive ? input.data < check.value : input.data <= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          type: "bigint",
          minimum: check.value,
          inclusive: check.inclusive,
          message: check.message
        }), status.dirty());
      } else if ("max" === check.kind) {
        (check.inclusive ? input.data > check.value : input.data >= check.value) && (ctx = this._getOrReturnCtx(input, ctx), 
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          type: "bigint",
          maximum: check.value,
          inclusive: check.inclusive,
          message: check.message
        }), status.dirty());
      } else "multipleOf" === check.kind ? input.data % check.value !== BigInt(0) && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.not_multiple_of,
        multipleOf: check.value,
        message: check.message
      }), status.dirty()) : util.assertNever(check);
      return {
        status: status.value,
        value: input.data
      };
    }
    gte(value, message) {
      return this.setLimit("min", value, !0, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, !1, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, !0, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, !1, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new ZodBigInt({
        ...this._def,
        checks: [ ...this._def.checks, {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        } ]
      });
    }
    _addCheck(check) {
      return new ZodBigInt({
        ...this._def,
        checks: [ ...this._def.checks, check ]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: !1,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: !1,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: !0,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: !0,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
      return max;
    }
  }
  ZodBigInt.create = params => {
    var _a;
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: null !== (_a = null == params ? void 0 : params.coerce) && void 0 !== _a && _a,
      ...processCreateParams(params)
    });
  };
  class ZodBoolean extends ZodType {
    _parse(input) {
      this._def.coerce && (input.data = Boolean(input.data));
      if (this._getType(input) !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        }), INVALID;
      }
      return OK(input.data);
    }
  }
  ZodBoolean.create = params => new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: (null == params ? void 0 : params.coerce) || !1,
    ...processCreateParams(params)
  });
  class ZodDate extends ZodType {
    _parse(input) {
      this._def.coerce && (input.data = new Date(input.data));
      if (this._getType(input) !== ZodParsedType.date) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx.parsedType
        }), INVALID;
      }
      if (isNaN(input.data.getTime())) {
        return addIssueToContext(this._getOrReturnCtx(input), {
          code: ZodIssueCode.invalid_date
        }), INVALID;
      }
      const status = new ParseStatus;
      let ctx;
      for (const check of this._def.checks) "min" === check.kind ? input.data.getTime() < check.value && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        message: check.message,
        inclusive: !0,
        exact: !1,
        minimum: check.value,
        type: "date"
      }), status.dirty()) : "max" === check.kind ? input.data.getTime() > check.value && (ctx = this._getOrReturnCtx(input, ctx), 
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        message: check.message,
        inclusive: !0,
        exact: !1,
        maximum: check.value,
        type: "date"
      }), status.dirty()) : util.assertNever(check);
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new ZodDate({
        ...this._def,
        checks: [ ...this._def.checks, check ]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) "min" === ch.kind && (null === min || ch.value > min) && (min = ch.value);
      return null != min ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) "max" === ch.kind && (null === max || ch.value < max) && (max = ch.value);
      return null != max ? new Date(max) : null;
    }
  }
  ZodDate.create = params => new ZodDate({
    checks: [],
    coerce: (null == params ? void 0 : params.coerce) || !1,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
  class ZodSymbol extends ZodType {
    _parse(input) {
      if (this._getType(input) !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        }), INVALID;
      }
      return OK(input.data);
    }
  }
  ZodSymbol.create = params => new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
  class ZodUndefined extends ZodType {
    _parse(input) {
      if (this._getType(input) !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        }), INVALID;
      }
      return OK(input.data);
    }
  }
  ZodUndefined.create = params => new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
  class ZodNull extends ZodType {
    _parse(input) {
      if (this._getType(input) !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        }), INVALID;
      }
      return OK(input.data);
    }
  }
  ZodNull.create = params => new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
  class ZodAny extends ZodType {
    constructor() {
      super(...arguments), this._any = !0;
    }
    _parse(input) {
      return OK(input.data);
    }
  }
  ZodAny.create = params => new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
  class ZodUnknown extends ZodType {
    constructor() {
      super(...arguments), this._unknown = !0;
    }
    _parse(input) {
      return OK(input.data);
    }
  }
  ZodUnknown.create = params => new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
  class ZodNever extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      }), INVALID;
    }
  }
  ZodNever.create = params => new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
  class ZodVoid extends ZodType {
    _parse(input) {
      if (this._getType(input) !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        }), INVALID;
      }
      return OK(input.data);
    }
  }
  ZodVoid.create = params => new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
  class ZodArray extends ZodType {
    _parse(input) {
      const {ctx, status} = this._processInputParams(input), def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      }), INVALID;
      if (null !== def.exactLength) {
        const tooBig = ctx.data.length > def.exactLength.value, tooSmall = ctx.data.length < def.exactLength.value;
        (tooBig || tooSmall) && (addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: !0,
          exact: !0,
          message: def.exactLength.message
        }), status.dirty());
      }
      if (null !== def.minLength && ctx.data.length < def.minLength.value && (addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: def.minLength.value,
        type: "array",
        inclusive: !0,
        exact: !1,
        message: def.minLength.message
      }), status.dirty()), null !== def.maxLength && ctx.data.length > def.maxLength.value && (addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: def.maxLength.value,
        type: "array",
        inclusive: !0,
        exact: !1,
        message: def.maxLength.message
      }), status.dirty()), ctx.common.async) return Promise.all([ ...ctx.data ].map(((item, i) => def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i))))).then((result => ParseStatus.mergeArray(status, result)));
      const result = [ ...ctx.data ].map(((item, i) => def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i))));
      return ParseStatus.mergeArray(status, result);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new ZodArray({
        ...this._def,
        minLength: {
          value: minLength,
          message: errorUtil.toString(message)
        }
      });
    }
    max(maxLength, message) {
      return new ZodArray({
        ...this._def,
        maxLength: {
          value: maxLength,
          message: errorUtil.toString(message)
        }
      });
    }
    length(len, message) {
      return new ZodArray({
        ...this._def,
        exactLength: {
          value: len,
          message: errorUtil.toString(message)
        }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  }
  function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
      const newShape = {};
      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape
      });
    }
    return schema instanceof ZodArray ? new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    }) : schema instanceof ZodOptional ? ZodOptional.create(deepPartialify(schema.unwrap())) : schema instanceof ZodNullable ? ZodNullable.create(deepPartialify(schema.unwrap())) : schema instanceof ZodTuple ? ZodTuple.create(schema.items.map((item => deepPartialify(item)))) : schema;
  }
  ZodArray.create = (schema, params) => new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
  class ZodObject extends ZodType {
    constructor() {
      super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
    }
    _getCached() {
      if (null !== this._cached) return this._cached;
      const shape = this._def.shape(), keys = util.objectKeys(shape);
      return this._cached = {
        shape,
        keys
      };
    }
    _parse(input) {
      if (this._getType(input) !== ZodParsedType.object) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        }), INVALID;
      }
      const {status, ctx} = this._processInputParams(input), {shape, keys: shapeKeys} = this._getCached(), extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && "strip" === this._def.unknownKeys)) for (const key in ctx.data) shapeKeys.includes(key) || extraKeys.push(key);
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key], value = ctx.data[key];
        pairs.push({
          key: {
            status: "valid",
            value: key
          },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if ("passthrough" === unknownKeys) for (const key of extraKeys) pairs.push({
          key: {
            status: "valid",
            value: key
          },
          value: {
            status: "valid",
            value: ctx.data[key]
          }
        }); else if ("strict" === unknownKeys) extraKeys.length > 0 && (addIssueToContext(ctx, {
          code: ZodIssueCode.unrecognized_keys,
          keys: extraKeys
        }), status.dirty()); else if ("strip" !== unknownKeys) throw new Error("Internal ZodObject error: invalid unknownKeys value.");
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: {
              status: "valid",
              value: key
            },
            value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
      }
      return ctx.common.async ? Promise.resolve().then((async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key, value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      })).then((syncPairs => ParseStatus.mergeObjectSync(status, syncPairs))) : ParseStatus.mergeObjectSync(status, pairs);
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      return errorUtil.errToObj, new ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...void 0 !== message ? {
          errorMap: (issue, ctx) => {
            var _a, _b, _c, _d;
            const defaultError = null !== (_c = null === (_b = (_a = this._def).errorMap) || void 0 === _b ? void 0 : _b.call(_a, issue, ctx).message) && void 0 !== _c ? _c : ctx.defaultError;
            return "unrecognized_keys" === issue.code ? {
              message: null !== (_d = errorUtil.errToObj(message).message) && void 0 !== _d ? _d : defaultError
            } : {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    extend(augmentation) {
      return new ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    merge(merging) {
      return new ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
    }
    setKey(key, schema) {
      return this.augment({
        [key]: schema
      });
    }
    catchall(index) {
      return new ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      return util.objectKeys(mask).forEach((key => {
        mask[key] && this.shape[key] && (shape[key] = this.shape[key]);
      })), new ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      return util.objectKeys(this.shape).forEach((key => {
        mask[key] || (shape[key] = this.shape[key]);
      })), new ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape = {};
      return util.objectKeys(this.shape).forEach((key => {
        const fieldSchema = this.shape[key];
        mask && !mask[key] ? newShape[key] = fieldSchema : newShape[key] = fieldSchema.optional();
      })), new ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    required(mask) {
      const newShape = {};
      return util.objectKeys(this.shape).forEach((key => {
        if (mask && !mask[key]) newShape[key] = this.shape[key]; else {
          let newField = this.shape[key];
          for (;newField instanceof ZodOptional; ) newField = newField._def.innerType;
          newShape[key] = newField;
        }
      })), new ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  }
  ZodObject.create = (shape, params) => new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  }), ZodObject.strictCreate = (shape, params) => new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  }), ZodObject.lazycreate = (shape, params) => new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
  class ZodUnion extends ZodType {
    _parse(input) {
      const {ctx} = this._processInputParams(input), options = this._def.options;
      if (ctx.common.async) return Promise.all(options.map((async option => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      }))).then((function(results) {
        for (const result of results) if ("valid" === result.result.status) return result.result;
        for (const result of results) if ("dirty" === result.result.status) return ctx.common.issues.push(...result.ctx.common.issues), 
        result.result;
        const unionErrors = results.map((result => new ZodError(result.ctx.common.issues)));
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        }), INVALID;
      }));
      {
        let dirty;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          }, result = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if ("valid" === result.status) return result;
          "dirty" !== result.status || dirty || (dirty = {
            result,
            ctx: childCtx
          }), childCtx.common.issues.length && issues.push(childCtx.common.issues);
        }
        if (dirty) return ctx.common.issues.push(...dirty.ctx.common.issues), dirty.result;
        const unionErrors = issues.map((issues => new ZodError(issues)));
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        }), INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  }
  ZodUnion.create = (types, params) => new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
  const getDiscriminator = type => type instanceof ZodLazy ? getDiscriminator(type.schema) : type instanceof ZodEffects ? getDiscriminator(type.innerType()) : type instanceof ZodLiteral ? [ type.value ] : type instanceof ZodEnum ? type.options : type instanceof ZodNativeEnum ? util.objectValues(type.enum) : type instanceof ZodDefault ? getDiscriminator(type._def.innerType) : type instanceof ZodUndefined ? [ void 0 ] : type instanceof ZodNull ? [ null ] : type instanceof ZodOptional ? [ void 0, ...getDiscriminator(type.unwrap()) ] : type instanceof ZodNullable ? [ null, ...getDiscriminator(type.unwrap()) ] : type instanceof ZodBranded || type instanceof ZodReadonly ? getDiscriminator(type.unwrap()) : type instanceof ZodCatch ? getDiscriminator(type._def.innerType) : [];
  class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
      const {ctx} = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      }), INVALID;
      const discriminator = this.discriminator, discriminatorValue = ctx.data[discriminator], option = this.optionsMap.get(discriminatorValue);
      return option ? ctx.common.async ? option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }) : option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }) : (addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [ discriminator ]
      }), INVALID);
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    static create(discriminator, options, params) {
      const optionsMap = new Map;
      for (const type of options) {
        const discriminatorValues = getDiscriminator(type.shape[discriminator]);
        if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
        for (const value of discriminatorValues) {
          if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
          optionsMap.set(value, type);
        }
      }
      return new ZodDiscriminatedUnion({
        typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
        discriminator,
        options,
        optionsMap,
        ...processCreateParams(params)
      });
    }
  }
  function mergeValues(a, b) {
    const aType = getParsedType(a), bType = getParsedType(b);
    if (a === b) return {
      valid: !0,
      data: a
    };
    if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b), sharedKeys = util.objectKeys(a).filter((key => -1 !== bKeys.indexOf(key))), newObj = {
        ...a,
        ...b
      };
      for (const key of sharedKeys) {
        const sharedValue = mergeValues(a[key], b[key]);
        if (!sharedValue.valid) return {
          valid: !1
        };
        newObj[key] = sharedValue.data;
      }
      return {
        valid: !0,
        data: newObj
      };
    }
    if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) return {
        valid: !1
      };
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
        const sharedValue = mergeValues(a[index], b[index]);
        if (!sharedValue.valid) return {
          valid: !1
        };
        newArray.push(sharedValue.data);
      }
      return {
        valid: !0,
        data: newArray
      };
    }
    return aType === ZodParsedType.date && bType === ZodParsedType.date && +a == +b ? {
      valid: !0,
      data: a
    } : {
      valid: !1
    };
  }
  class ZodIntersection extends ZodType {
    _parse(input) {
      const {status, ctx} = this._processInputParams(input), handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        return merged.valid ? ((isDirty(parsedLeft) || isDirty(parsedRight)) && status.dirty(), 
        {
          status: status.value,
          value: merged.data
        }) : (addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        }), INVALID);
      };
      return ctx.common.async ? Promise.all([ this._def.left._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }) ]).then((([left, right]) => handleParsed(left, right))) : handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
  ZodIntersection.create = (left, right, params) => new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
  class ZodTuple extends ZodType {
    _parse(input) {
      const {status, ctx} = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      }), INVALID;
      if (ctx.data.length < this._def.items.length) return addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), INVALID;
      !this._def.rest && ctx.data.length > this._def.items.length && (addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), status.dirty());
      const items = [ ...ctx.data ].map(((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        return schema ? schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex)) : null;
      })).filter((x => !!x));
      return ctx.common.async ? Promise.all(items).then((results => ParseStatus.mergeArray(status, results))) : ParseStatus.mergeArray(status, items);
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new ZodTuple({
        ...this._def,
        rest
      });
    }
  }
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  class ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const {status, ctx} = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      }), INVALID;
      const pairs = [], keyType = this._def.keyType, valueType = this._def.valueType;
      for (const key in ctx.data) pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
      return ctx.common.async ? ParseStatus.mergeObjectAsync(status, pairs) : ParseStatus.mergeObjectSync(status, pairs);
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      return new ZodRecord(second instanceof ZodType ? {
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      } : {
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  }
  class ZodMap extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const {status, ctx} = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      }), INVALID;
      const keyType = this._def.keyType, valueType = this._def.valueType, pairs = [ ...ctx.data.entries() ].map((([key, value], index) => ({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [ index, "key" ])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [ index, "value" ]))
      })));
      if (ctx.common.async) {
        const finalMap = new Map;
        return Promise.resolve().then((async () => {
          for (const pair of pairs) {
            const key = await pair.key, value = await pair.value;
            if ("aborted" === key.status || "aborted" === value.status) return INVALID;
            "dirty" !== key.status && "dirty" !== value.status || status.dirty(), finalMap.set(key.value, value.value);
          }
          return {
            status: status.value,
            value: finalMap
          };
        }));
      }
      {
        const finalMap = new Map;
        for (const pair of pairs) {
          const key = pair.key, value = pair.value;
          if ("aborted" === key.status || "aborted" === value.status) return INVALID;
          "dirty" !== key.status && "dirty" !== value.status || status.dirty(), finalMap.set(key.value, value.value);
        }
        return {
          status: status.value,
          value: finalMap
        };
      }
    }
  }
  ZodMap.create = (keyType, valueType, params) => new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
  class ZodSet extends ZodType {
    _parse(input) {
      const {status, ctx} = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      }), INVALID;
      const def = this._def;
      null !== def.minSize && ctx.data.size < def.minSize.value && (addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: def.minSize.value,
        type: "set",
        inclusive: !0,
        exact: !1,
        message: def.minSize.message
      }), status.dirty()), null !== def.maxSize && ctx.data.size > def.maxSize.value && (addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: def.maxSize.value,
        type: "set",
        inclusive: !0,
        exact: !1,
        message: def.maxSize.message
      }), status.dirty());
      const valueType = this._def.valueType;
      function finalizeSet(elements) {
        const parsedSet = new Set;
        for (const element of elements) {
          if ("aborted" === element.status) return INVALID;
          "dirty" === element.status && status.dirty(), parsedSet.add(element.value);
        }
        return {
          status: status.value,
          value: parsedSet
        };
      }
      const elements = [ ...ctx.data.values() ].map(((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i))));
      return ctx.common.async ? Promise.all(elements).then((elements => finalizeSet(elements))) : finalizeSet(elements);
    }
    min(minSize, message) {
      return new ZodSet({
        ...this._def,
        minSize: {
          value: minSize,
          message: errorUtil.toString(message)
        }
      });
    }
    max(maxSize, message) {
      return new ZodSet({
        ...this._def,
        maxSize: {
          value: maxSize,
          message: errorUtil.toString(message)
        }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  }
  ZodSet.create = (valueType, params) => new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
  class ZodFunction extends ZodType {
    constructor() {
      super(...arguments), this.validate = this.implement;
    }
    _parse(input) {
      const {ctx} = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      }), INVALID;
      function makeArgsIssue(args, error) {
        return makeIssue({
          data: args,
          path: ctx.path,
          errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap ].filter((x => !!x)),
          issueData: {
            code: ZodIssueCode.invalid_arguments,
            argumentsError: error
          }
        });
      }
      function makeReturnsIssue(returns, error) {
        return makeIssue({
          data: returns,
          path: ctx.path,
          errorMaps: [ ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap ].filter((x => !!x)),
          issueData: {
            code: ZodIssueCode.invalid_return_type,
            returnTypeError: error
          }
        });
      }
      const params = {
        errorMap: ctx.common.contextualErrorMap
      }, fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
        const me = this;
        return OK((async function(...args) {
          const error = new ZodError([]), parsedArgs = await me._def.args.parseAsync(args, params).catch((e => {
            throw error.addIssue(makeArgsIssue(args, e)), error;
          })), result = await Reflect.apply(fn, this, parsedArgs);
          return await me._def.returns._def.type.parseAsync(result, params).catch((e => {
            throw error.addIssue(makeReturnsIssue(result, e)), error;
          }));
        }));
      }
      {
        const me = this;
        return OK((function(...args) {
          const parsedArgs = me._def.args.safeParse(args, params);
          if (!parsedArgs.success) throw new ZodError([ makeArgsIssue(args, parsedArgs.error) ]);
          const result = Reflect.apply(fn, this, parsedArgs.data), parsedReturns = me._def.returns.safeParse(result, params);
          if (!parsedReturns.success) throw new ZodError([ makeReturnsIssue(result, parsedReturns.error) ]);
          return parsedReturns.data;
        }));
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...items) {
      return new ZodFunction({
        ...this._def,
        args: ZodTuple.create(items).rest(ZodUnknown.create())
      });
    }
    returns(returnType) {
      return new ZodFunction({
        ...this._def,
        returns: returnType
      });
    }
    implement(func) {
      return this.parse(func);
    }
    strictImplement(func) {
      return this.parse(func);
    }
    static create(args, returns, params) {
      return new ZodFunction({
        args: args || ZodTuple.create([]).rest(ZodUnknown.create()),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params)
      });
    }
  }
  class ZodLazy extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const {ctx} = this._processInputParams(input);
      return this._def.getter()._parse({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  ZodLazy.create = (getter, params) => new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
  class ZodLiteral extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        }), INVALID;
      }
      return {
        status: "valid",
        value: input.data
      };
    }
    get value() {
      return this._def.value;
    }
  }
  function createZodEnum(values, params) {
    return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params)
    });
  }
  ZodLiteral.create = (value, params) => new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
  class ZodEnum extends ZodType {
    constructor() {
      super(...arguments), _ZodEnum_cache.set(this, void 0);
    }
    _parse(input) {
      if ("string" != typeof input.data) {
        const ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
        return addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        }), INVALID;
      }
      if (__classPrivateFieldGet(this, _ZodEnum_cache, "f") || __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f"), 
      !__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
        const ctx = this._getOrReturnCtx(input), expectedValues = this._def.values;
        return addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        }), INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) enumValues[val] = val;
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) enumValues[val] = val;
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) enumValues[val] = val;
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return ZodEnum.create(this.options.filter((opt => !values.includes(opt))), {
        ...this._def,
        ...newDef
      });
    }
  }
  _ZodEnum_cache = new WeakMap, ZodEnum.create = createZodEnum;
  class ZodNativeEnum extends ZodType {
    constructor() {
      super(...arguments), _ZodNativeEnum_cache.set(this, void 0);
    }
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values), ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        return addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        }), INVALID;
      }
      if (__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f") || __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f"), 
      !__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        return addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        }), INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  }
  _ZodNativeEnum_cache = new WeakMap, ZodNativeEnum.create = (values, params) => new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
  class ZodPromise extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const {ctx} = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && !1 === ctx.common.async) return addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      }), INVALID;
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data => this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      }))));
    }
  }
  ZodPromise.create = (schema, params) => new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
  class ZodEffects extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const {status, ctx} = this._processInputParams(input), effect = this._def.effect || null, checkCtx = {
        addIssue: arg => {
          addIssueToContext(ctx, arg), arg.fatal ? status.abort() : status.dirty();
        },
        get path() {
          return ctx.path;
        }
      };
      if (checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx), "preprocess" === effect.type) {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) return Promise.resolve(processed).then((async processed => {
          if ("aborted" === status.value) return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          return "aborted" === result.status ? INVALID : "dirty" === result.status || "dirty" === status.value ? DIRTY(result.value) : result;
        }));
        {
          if ("aborted" === status.value) return INVALID;
          const result = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          return "aborted" === result.status ? INVALID : "dirty" === result.status || "dirty" === status.value ? DIRTY(result.value) : result;
        }
      }
      if ("refinement" === effect.type) {
        const executeRefinement = acc => {
          const result = effect.refinement(acc, checkCtx);
          if (ctx.common.async) return Promise.resolve(result);
          if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          return acc;
        };
        if (!1 === ctx.common.async) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          return "aborted" === inner.status ? INVALID : ("dirty" === inner.status && status.dirty(), 
          executeRefinement(inner.value), {
            status: status.value,
            value: inner.value
          });
        }
        return this._def.schema._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }).then((inner => "aborted" === inner.status ? INVALID : ("dirty" === inner.status && status.dirty(), 
        executeRefinement(inner.value).then((() => ({
          status: status.value,
          value: inner.value
        }))))));
      }
      if ("transform" === effect.type) {
        if (!1 === ctx.common.async) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base)) return base;
          const result = effect.transform(base.value, checkCtx);
          if (result instanceof Promise) throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
          return {
            status: status.value,
            value: result
          };
        }
        return this._def.schema._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }).then((base => isValid(base) ? Promise.resolve(effect.transform(base.value, checkCtx)).then((result => ({
          status: status.value,
          value: result
        }))) : base));
      }
      util.assertNever(effect);
    }
  }
  ZodEffects.create = (schema, effect, params) => new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  }), ZodEffects.createWithPreprocess = (preprocess, schema, params) => new ZodEffects({
    schema,
    effect: {
      type: "preprocess",
      transform: preprocess
    },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
  class ZodOptional extends ZodType {
    _parse(input) {
      return this._getType(input) === ZodParsedType.undefined ? OK(void 0) : this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  ZodOptional.create = (type, params) => new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
  class ZodNullable extends ZodType {
    _parse(input) {
      return this._getType(input) === ZodParsedType.null ? OK(null) : this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  ZodNullable.create = (type, params) => new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
  class ZodDefault extends ZodType {
    _parse(input) {
      const {ctx} = this._processInputParams(input);
      let data = ctx.data;
      return ctx.parsedType === ZodParsedType.undefined && (data = this._def.defaultValue()), 
      this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  }
  ZodDefault.create = (type, params) => new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: "function" == typeof params.default ? params.default : () => params.default,
    ...processCreateParams(params)
  });
  class ZodCatch extends ZodType {
    _parse(input) {
      const {ctx} = this._processInputParams(input), newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      }, result = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      return isAsync(result) ? result.then((result => ({
        status: "valid",
        value: "valid" === result.status ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      }))) : {
        status: "valid",
        value: "valid" === result.status ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
    removeCatch() {
      return this._def.innerType;
    }
  }
  ZodCatch.create = (type, params) => new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: "function" == typeof params.catch ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
  class ZodNaN extends ZodType {
    _parse(input) {
      if (this._getType(input) !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        return addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        }), INVALID;
      }
      return {
        status: "valid",
        value: input.data
      };
    }
  }
  ZodNaN.create = params => new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
  const BRAND = Symbol("zod_brand");
  class ZodBranded extends ZodType {
    _parse(input) {
      const {ctx} = this._processInputParams(input), data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  }
  class ZodPipeline extends ZodType {
    _parse(input) {
      const {status, ctx} = this._processInputParams(input);
      if (ctx.common.async) {
        return (async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          return "aborted" === inResult.status ? INVALID : "dirty" === inResult.status ? (status.dirty(), 
          DIRTY(inResult.value)) : this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        })();
      }
      {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        return "aborted" === inResult.status ? INVALID : "dirty" === inResult.status ? (status.dirty(), 
        {
          status: "dirty",
          value: inResult.value
        }) : this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    static create(a, b) {
      return new ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  }
  class ZodReadonly extends ZodType {
    _parse(input) {
      const result = this._def.innerType._parse(input), freeze = data => (isValid(data) && (data.value = Object.freeze(data.value)), 
      data);
      return isAsync(result) ? result.then((data => freeze(data))) : freeze(result);
    }
    unwrap() {
      return this._def.innerType;
    }
  }
  function custom(check, params = {}, fatal) {
    return check ? ZodAny.create().superRefine(((data, ctx) => {
      var _a, _b;
      if (!check(data)) {
        const p = "function" == typeof params ? params(data) : "string" == typeof params ? {
          message: params
        } : params, _fatal = null === (_b = null !== (_a = p.fatal) && void 0 !== _a ? _a : fatal) || void 0 === _b || _b, p2 = "string" == typeof p ? {
          message: p
        } : p;
        ctx.addIssue({
          code: "custom",
          ...p2,
          fatal: _fatal
        });
      }
    })) : ZodAny.create();
  }
  ZodReadonly.create = (type, params) => new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
  const late = {
    object: ZodObject.lazycreate
  };
  var ZodFirstPartyTypeKind;
  !function(ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind.ZodString = "ZodString", ZodFirstPartyTypeKind.ZodNumber = "ZodNumber", 
    ZodFirstPartyTypeKind.ZodNaN = "ZodNaN", ZodFirstPartyTypeKind.ZodBigInt = "ZodBigInt", 
    ZodFirstPartyTypeKind.ZodBoolean = "ZodBoolean", ZodFirstPartyTypeKind.ZodDate = "ZodDate", 
    ZodFirstPartyTypeKind.ZodSymbol = "ZodSymbol", ZodFirstPartyTypeKind.ZodUndefined = "ZodUndefined", 
    ZodFirstPartyTypeKind.ZodNull = "ZodNull", ZodFirstPartyTypeKind.ZodAny = "ZodAny", 
    ZodFirstPartyTypeKind.ZodUnknown = "ZodUnknown", ZodFirstPartyTypeKind.ZodNever = "ZodNever", 
    ZodFirstPartyTypeKind.ZodVoid = "ZodVoid", ZodFirstPartyTypeKind.ZodArray = "ZodArray", 
    ZodFirstPartyTypeKind.ZodObject = "ZodObject", ZodFirstPartyTypeKind.ZodUnion = "ZodUnion", 
    ZodFirstPartyTypeKind.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", ZodFirstPartyTypeKind.ZodIntersection = "ZodIntersection", 
    ZodFirstPartyTypeKind.ZodTuple = "ZodTuple", ZodFirstPartyTypeKind.ZodRecord = "ZodRecord", 
    ZodFirstPartyTypeKind.ZodMap = "ZodMap", ZodFirstPartyTypeKind.ZodSet = "ZodSet", 
    ZodFirstPartyTypeKind.ZodFunction = "ZodFunction", ZodFirstPartyTypeKind.ZodLazy = "ZodLazy", 
    ZodFirstPartyTypeKind.ZodLiteral = "ZodLiteral", ZodFirstPartyTypeKind.ZodEnum = "ZodEnum", 
    ZodFirstPartyTypeKind.ZodEffects = "ZodEffects", ZodFirstPartyTypeKind.ZodNativeEnum = "ZodNativeEnum", 
    ZodFirstPartyTypeKind.ZodOptional = "ZodOptional", ZodFirstPartyTypeKind.ZodNullable = "ZodNullable", 
    ZodFirstPartyTypeKind.ZodDefault = "ZodDefault", ZodFirstPartyTypeKind.ZodCatch = "ZodCatch", 
    ZodFirstPartyTypeKind.ZodPromise = "ZodPromise", ZodFirstPartyTypeKind.ZodBranded = "ZodBranded", 
    ZodFirstPartyTypeKind.ZodPipeline = "ZodPipeline", ZodFirstPartyTypeKind.ZodReadonly = "ZodReadonly";
  }(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  const stringType = ZodString.create, numberType = ZodNumber.create, nanType = ZodNaN.create, bigIntType = ZodBigInt.create, booleanType = ZodBoolean.create, dateType = ZodDate.create, symbolType = ZodSymbol.create, undefinedType = ZodUndefined.create, nullType = ZodNull.create, anyType = ZodAny.create, unknownType = ZodUnknown.create, neverType = ZodNever.create, voidType = ZodVoid.create, arrayType = ZodArray.create, objectType = ZodObject.create, strictObjectType = ZodObject.strictCreate, unionType = ZodUnion.create, discriminatedUnionType = ZodDiscriminatedUnion.create, intersectionType = ZodIntersection.create, tupleType = ZodTuple.create, recordType = ZodRecord.create, mapType = ZodMap.create, setType = ZodSet.create, functionType = ZodFunction.create, lazyType = ZodLazy.create, literalType = ZodLiteral.create, enumType = ZodEnum.create, nativeEnumType = ZodNativeEnum.create, promiseType = ZodPromise.create, effectsType = ZodEffects.create, optionalType = ZodOptional.create, nullableType = ZodNullable.create, preprocessType = ZodEffects.createWithPreprocess, pipelineType = ZodPipeline.create, coerce = {
    string: arg => ZodString.create({
      ...arg,
      coerce: !0
    }),
    number: arg => ZodNumber.create({
      ...arg,
      coerce: !0
    }),
    boolean: arg => ZodBoolean.create({
      ...arg,
      coerce: !0
    }),
    bigint: arg => ZodBigInt.create({
      ...arg,
      coerce: !0
    }),
    date: arg => ZodDate.create({
      ...arg,
      coerce: !0
    })
  }, NEVER = INVALID;
  var z = Object.freeze({
    __proto__: null,
    defaultErrorMap: errorMap,
    setErrorMap: function(map) {
      overrideErrorMap = map;
    },
    getErrorMap,
    makeIssue,
    EMPTY_PATH: [],
    addIssueToContext,
    ParseStatus,
    INVALID,
    DIRTY,
    OK,
    isAborted,
    isDirty,
    isValid,
    isAsync,
    get util() {
      return util;
    },
    get objectUtil() {
      return objectUtil;
    },
    ZodParsedType,
    getParsedType,
    ZodType,
    datetimeRegex,
    ZodString,
    ZodNumber,
    ZodBigInt,
    ZodBoolean,
    ZodDate,
    ZodSymbol,
    ZodUndefined,
    ZodNull,
    ZodAny,
    ZodUnknown,
    ZodNever,
    ZodVoid,
    ZodArray,
    ZodObject,
    ZodUnion,
    ZodDiscriminatedUnion,
    ZodIntersection,
    ZodTuple,
    ZodRecord,
    ZodMap,
    ZodSet,
    ZodFunction,
    ZodLazy,
    ZodLiteral,
    ZodEnum,
    ZodNativeEnum,
    ZodPromise,
    ZodEffects,
    ZodTransformer: ZodEffects,
    ZodOptional,
    ZodNullable,
    ZodDefault,
    ZodCatch,
    ZodNaN,
    BRAND,
    ZodBranded,
    ZodPipeline,
    ZodReadonly,
    custom,
    Schema: ZodType,
    ZodSchema: ZodType,
    late,
    get ZodFirstPartyTypeKind() {
      return ZodFirstPartyTypeKind;
    },
    coerce,
    any: anyType,
    array: arrayType,
    bigint: bigIntType,
    boolean: booleanType,
    date: dateType,
    discriminatedUnion: discriminatedUnionType,
    effect: effectsType,
    enum: enumType,
    function: functionType,
    instanceof: (cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data => data instanceof cls), params),
    intersection: intersectionType,
    lazy: lazyType,
    literal: literalType,
    map: mapType,
    nan: nanType,
    nativeEnum: nativeEnumType,
    never: neverType,
    null: nullType,
    nullable: nullableType,
    number: numberType,
    object: objectType,
    oboolean: () => booleanType().optional(),
    onumber: () => numberType().optional(),
    optional: optionalType,
    ostring: () => stringType().optional(),
    pipeline: pipelineType,
    preprocess: preprocessType,
    promise: promiseType,
    record: recordType,
    set: setType,
    strictObject: strictObjectType,
    string: stringType,
    symbol: symbolType,
    transformer: effectsType,
    tuple: tupleType,
    undefined: undefinedType,
    union: unionType,
    unknown: unknownType,
    void: voidType,
    NEVER,
    ZodIssueCode,
    quotelessJson: obj => JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:"),
    ZodError
  });
  function isZodErrorLike(err) {
    return err instanceof Error && "ZodError" === err.name && "issues" in err && Array.isArray(err.issues);
  }
  var ValidationError = class extends Error {
    name;
    details;
    constructor(message, options) {
      super(message, options), this.name = "ZodValidationError", this.details = function(options) {
        if (options) {
          const cause = options.cause;
          if (isZodErrorLike(cause)) return cause.issues;
        }
        return [];
      }(options);
    }
    toString() {
      return this.message;
    }
  };
  var ISSUE_SEPARATOR = "; ", MAX_ISSUES_IN_MESSAGE = 99, PREFIX = "Validation error", PREFIX_SEPARATOR = ": ", UNION_SEPARATOR = ", or ";
  function prefixMessage(message, prefix, prefixSeparator) {
    return null !== prefix ? message.length > 0 ? [ prefix, message ].join(prefixSeparator) : prefix : message.length > 0 ? message : PREFIX;
  }
  var identifierRegex = /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u;
  function getMessageFromZodIssue(props) {
    const {issue, issueSeparator, unionSeparator, includePath} = props;
    if ("invalid_union" === issue.code) return issue.unionErrors.reduce(((acc, zodError) => {
      const newIssues = zodError.issues.map((issue2 => getMessageFromZodIssue({
        issue: issue2,
        issueSeparator,
        unionSeparator,
        includePath
      }))).join(issueSeparator);
      return acc.includes(newIssues) || acc.push(newIssues), acc;
    }), []).join(unionSeparator);
    if ("invalid_arguments" === issue.code) return [ issue.message, ...issue.argumentsError.issues.map((issue2 => getMessageFromZodIssue({
      issue: issue2,
      issueSeparator,
      unionSeparator,
      includePath
    }))) ].join(issueSeparator);
    if ("invalid_return_type" === issue.code) return [ issue.message, ...issue.returnTypeError.issues.map((issue2 => getMessageFromZodIssue({
      issue: issue2,
      issueSeparator,
      unionSeparator,
      includePath
    }))) ].join(issueSeparator);
    if (includePath && 0 !== issue.path.length) {
      if (1 === issue.path.length) {
        const identifier = issue.path[0];
        if ("number" == typeof identifier) return `${issue.message} at index ${identifier}`;
      }
      return `${issue.message} at "${path = issue.path, 1 === path.length ? path[0].toString() : path.reduce(((acc, item) => "number" == typeof item ? acc + "[" + item.toString() + "]" : item.includes('"') ? acc + '["' + item.replace(/"/g, '\\"') + '"]' : identifierRegex.test(item) ? acc + (0 === acc.length ? "" : ".") + item : acc + '["' + item + '"]'), "")}"`;
    }
    var path;
    return issue.message;
  }
  function fromZodErrorWithoutRuntimeCheck(zodError, options = {}) {
    const {maxIssuesInMessage = MAX_ISSUES_IN_MESSAGE, issueSeparator = ISSUE_SEPARATOR, unionSeparator = UNION_SEPARATOR, prefixSeparator = PREFIX_SEPARATOR, prefix = PREFIX, includePath = !0} = options, zodIssues = zodError.errors, message = prefixMessage(0 === zodIssues.length ? zodError.message : zodIssues.slice(0, maxIssuesInMessage).map((issue => getMessageFromZodIssue({
      issue,
      issueSeparator,
      unionSeparator,
      includePath
    }))).join(issueSeparator), prefix, prefixSeparator);
    return new ValidationError(message, {
      cause: zodError
    });
  }
  var toValidationError = (options = {}) => err => isZodErrorLike(err) ? fromZodErrorWithoutRuntimeCheck(err, options) : err instanceof Error ? new ValidationError(err.message, {
    cause: err
  }) : new ValidationError("Unknown error");
  function fromError(err, options = {}) {
    return toValidationError(options)(err);
  }
  const scriptId = globalThis?.document?.currentScript?.getAttribute("scriptid");
  let currentScriptAttributes;
  "undefined" != typeof window && window.document && (currentScriptAttributes = document?.currentScript?.attributes);
  const getCurrentFilename = () => isContentScript() ? function() {
    try {
      throw new Error;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (!error.stack) return null;
      const regexes = [ /((https?:\/\/|chrome-extension:\/\/)[^\s)]+)/, /@((https?:\/\/)[^\s)]+)/ ];
      let match = null;
      for (const regex of regexes) if (match = error.stack.match(regex), match) break;
      if (match) {
        const fileNameMatch = match[1].match(/\/([^/]+\.js):/);
        return fileNameMatch ? fileNameMatch[1] : match[1];
      }
    }
    return null;
  }() : isWebPage() ? scriptId : "src/services/get-error-message.ts";
  function getErrorMessage(error) {
    let message = "string" == typeof error ? error : function(maybeError) {
      if (maybeError instanceof z.ZodError) return fromError(maybeError);
      if ("object" == typeof (error = maybeError) && null !== error && "message" in error && "string" == typeof error.message) return maybeError;
      var error;
      try {
        return new Error(JSON.stringify(maybeError));
      } catch {
        return new Error(String(maybeError));
      }
    }(error).message;
    try {
      message += ` (${getCurrentFilename()})`, error instanceof Error && (message += ` (${(error => {
        if (!error.stack) return;
        let cleanedString = error.stack?.replace(/\s?\(chrome-extension:\/\/[^\)]+\)|\s+(\S+\.js:\d+:\d+)/g, "").replaceAll("async", "");
        const startIndex = cleanedString.indexOf("at");
        cleanedString = cleanedString.substring(startIndex);
        const functionNames = cleanedString.match(/(?:at\s+)([\w.<>]+)/g);
        return functionNames ? functionNames.map((name => name.replace("at", "").trim())).join(":").substring(0, 500) : "";
      })(error)})`);
    } catch (e) {
      console.error("Error in getErrorMessage", e), message += ` (Error in getErrorMessage: ${e})`;
    }
    return message;
  }
  const awaitTimeout = (delay, reason, defaultResolve = void 0) => new Promise(((resolve, reject) => setTimeout((() => void 0 === reason ? resolve(defaultResolve) : reject(reason)), delay))), abortController = new AbortController, unsubscribe = () => {
    abortController.abort();
  }, getSignal = () => abortController.signal, optimisticallyInjectedScripts = [ "outlook_web_app_xhr" ];
  let currentScript = isWebWorkerContext() ? null : document.currentScript;
  const getCurrentScriptId = () => currentScript?.getAttribute("scriptId"), isCurrentScriptOptimisticallyInjected = () => !(!getCurrentScriptId() || isWebWorkerContext()) && optimisticallyInjectedScripts.includes(getCurrentScriptId());
  let addVersionToEventNameByDefault = !0;
  Math.floor(1e3 * Math.random());
  function addVersion(name) {
    return `${name}_25.3.1`;
  }
  function getReplyEventName(name, wrapVersion = !0) {
    const replyEventName = `${name}_reply`;
    return wrapVersion ? addVersion(replyEventName) : replyEventName;
  }
  function listenPageEvent(eventName, callback, {ignoreSignal = !1, wrapVersion = addVersionToEventNameByDefault} = {}) {
    const replyEvent = getReplyEventName(eventName, wrapVersion), listenerEventName = wrapVersion ? addVersion(eventName) : eventName;
    document.addEventListener(listenerEventName, (async function(event) {
      try {
        const detail = getDetails(event, listenerEventName);
        let reply = await Promise.resolve(callback({
          ...event,
          detail
        }));
        void 0 !== reply && (reply = setDetail(replyEvent, reply), document.dispatchEvent(new CustomEvent(replyEvent, {
          detail: reply
        })));
      } catch (error) {
        console.error("Error in page event listener", error), logFeatureError("page-communication", {
          error
        }), unsubscribe();
      }
    }), {
      signal: ignoreSignal ? void 0 : getSignal(),
      capture: !0
    });
  }
  function dispatchOnPage(eventName, data, {wrapVersion = addVersionToEventNameByDefault} = {}) {
    const finalEventName = wrapVersion ? addVersion(eventName) : eventName;
    data = setDetail(finalEventName, data), document.dispatchEvent(new CustomEvent(finalEventName, {
      detail: data
    }));
  }
  isWebWorkerContext();
  const getDetails = (event, eventName) => {
    const result = window[eventName];
    return result || event.detail;
  }, setDetail = (eventName, detail) => ("undefined" != typeof cloneInto && window.wrappedJSObject && (window.wrappedJSObject[eventName] = cloneInto(detail, window)), 
  detail);
  function dispatchOnPageWithReply(eventName, data, {timeout = 1e3, wrapVersion = addVersionToEventNameByDefault} = {}) {
    const replyEvent = getReplyEventName(eventName, wrapVersion), promise = new Promise((resolve => {
      document.addEventListener(replyEvent, (function(event) {
        const response = getDetails(event, replyEvent);
        resolve(response);
      }), {
        signal: getSignal(),
        once: !0,
        capture: !0
      });
      const finalEventName = wrapVersion ? addVersion(eventName) : eventName;
      data = setDetail(finalEventName, data), document.dispatchEvent(new CustomEvent(finalEventName, {
        detail: data ?? {}
      }));
    }));
    return Promise.race([ promise, awaitTimeout(timeout) ]);
  }
  const dispatchOnWebWorker = (eventType, data, webworker = self) => {
    webworker.postMessage({
      type: eventType,
      eventData: data
    });
  };
  let currentDomain;
  const log = (level, data, domain = currentDomain) => {
    const eventData = {
      level,
      domain
    };
    if ("object" == typeof data) Object.assign(eventData, data); else if ("string" == typeof data) {
      const field = "error" === level ? "error" : "message";
      Object.assign(eventData, {
        [field]: data
      });
    }
    isWebWorkerContext() ? dispatchOnWebWorker("Cyberhaven_Log", eventData) : dispatchOnPage("Cyberhaven_Log", eventData);
  }, logInfo = (data, domain = void 0) => log("info", data, domain), logError = (data, domain = void 0) => log("error", data, domain), logFeatureError = (eventType, data) => {
    const {error, ...rest} = data;
    logError({
      error: `Error occured in ${eventType}`,
      errorMessage: getErrorMessage(error).substring(0, 1e3),
      ...rest
    });
  };
  let promise;
  const onServiceReady = async (service, onReady) => {
    promise || (promise = new Promise((resolve => {
      dispatchOnPageWithReply("Cyberhaven_GetWebAppStatus", service, {
        timeout: 5e3
      }).then((isEnabled => {
        resolve(isEnabled);
      })).catch((error => {
        console.error("onServiceReady error", error);
      }));
    })));
    const isEnabled = await promise;
    isEnabled && onReady(isEnabled);
  }, registerEvents = (service, scriptId) => {
    currentDomain = service, listenPageEvent("Cyberhaven_Page_Unload", (({detail}) => {
      detail?.scriptId && scriptId !== detail.scriptId || unsubscribe();
    }), {
      wrapVersion: !1
    });
  };
  let interceptors = [];
  const fetch_intercept = function(env) {
    if (!env.fetch) throw new Error("No fetch available. Unable to register fetch-intercept");
    var fetch;
    return env.fetch = (fetch = env.fetch, function(...args) {
      return function(fetch, ...args) {
        const reversedInterceptors = interceptors.reduce(((array, interceptor) => [ interceptor ].concat(array)), []);
        let promise = Promise.resolve(args);
        reversedInterceptors.forEach((({request, requestError}) => {
          (request || requestError) && (promise = promise.then((args => request ? request(...args) : args), requestError));
        }));
        let finalPromise = promise.then((([url, config]) => {
          const request = new Request(url, config);
          return fetch(request).then((response => {
            const fetchResponse = response;
            return fetchResponse.request = url instanceof Request ? url : request, fetchResponse;
          })).catch((error => (error.request = request, Promise.reject(error))));
        }));
        return reversedInterceptors.forEach((({response, responseError}) => {
          (response || responseError) && (finalPromise = finalPromise.then(response, responseError));
        })), finalPromise;
      }(fetch, ...args);
    }), {
      register: function(interceptor) {
        return interceptors.push(interceptor), () => {
          const index = interceptors.indexOf(interceptor);
          index >= 0 && interceptors.splice(index, 1);
        };
      },
      clear: function() {
        interceptors = [];
      }
    };
  }("function" == typeof importScripts ? self : window), mapUrlToBlob = {};
  const webWorkerBlob = isWebWorkerContext() ? null : window.CH_WEBWORKER_SCRIPT_BLOB, xhrBlob = new Blob([ webWorkerBlob ], {
    type: "application/javascript"
  }), interceptWebWorker = (xhrConfigs, fetchConfigs, onWebWorkerMessage) => {
    if (isWebWorkerContext()) return;
    if (!webWorkerBlob) return void console.error("Please add the compiled xhr file name script in SUPPORTED_WEBWORKER_SCRIPTS for CH_WEBWORKER_SCRIPT_BLOB to be present ");
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = blob => {
      if (!(blob instanceof Blob)) return originalCreateObjectURL(blob);
      const url = originalCreateObjectURL(blob);
      return mapUrlToBlob[url] = blob, url;
    };
    const jsSetConfigs = `\n  self.CYBERHAVEN_XHR_CONFIGS = ${xhrConfigs && JSON.stringify(xhrConfigs) || "undefined"};\n  self.CYBERHAVEN_FETCH_CONFIGS = ${fetchConfigs && JSON.stringify(fetchConfigs) || "undefined"};\n        `, configsBlob = new Blob([ jsSetConfigs ], {
      type: "application/javascript"
    });
    globals.Worker = new Proxy(Worker, {
      construct(target, args) {
        const objectUrl = args[0];
        if (!mapUrlToBlob[objectUrl]) return Reflect.construct(target, args);
        const newLine = new Blob([ "\n" ], {
          type: "application/javascript"
        }), concatenatedBlob = function(...args) {
          return new Blob(args, {
            type: "application/javascript"
          });
        }(configsBlob, newLine, xhrBlob, newLine, mapUrlToBlob[objectUrl]), newWorker = new target(originalCreateObjectURL(concatenatedBlob), args[1]);
        return newWorker.addEventListener("message", (event => {
          onWebWorkerMessage?.(event, newWorker);
        }), {
          signal: getSignal()
        }), newWorker;
      }
    });
  };
  function lodash_pick(object, ...keys) {
    const ret = {};
    return keys.forEach((key => {
      ret[key] = object[key];
    })), ret;
  }
  const rawOpen = XMLHttpRequest.prototype.open, rawSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader, xhr_hooks_randomScriptId = Math.floor(1e3 * Math.random());
  let isEnablePreviousHookListenerRegistered = !1, enabled = !1, isFetchHooked = !1, isXhrHooked = !1;
  const requestInfoMap = new WeakMap, registerEnablePreviousHookListener = () => {
    isEnablePreviousHookListenerRegistered || isWebWorkerContext() || (listenPageEvent("Cyberhaven_EnablePreviousHookIfExist", (({detail: {initiatedByScriptId}}) => {
      if (xhr_hooks_randomScriptId !== initiatedByScriptId) return enabled = !0, {
        doesExist: !0
      };
    }), {
      ignoreSignal: !0
    }), isEnablePreviousHookListenerRegistered = !0);
  }, matchHeadersWithConfigs = (configs, headers) => configs.some((config => {
    for (const key in headers) if (config.nameIncludes && key.includes(config.nameIncludes) || config.valueIncludes && headers[key].includes(config.valueIncludes)) return !0;
    return !1;
  })), filterByUrlOption = (option, type, method, url) => {
    const matchUrlByConfig = option["before" === type ? "matchUrlBeforeConfig" : "matchUrlAfterConfig"];
    return option[type] && option["before" === type ? "matchUrlBefore" : "matchUrlAfter"]?.(method, url) || matchUrlByConfig && ((configs, method, url) => configs.some((config => config.method === method && (config.urlRegex ? new RegExp(config.urlRegex).test(url) : !!config.urlIncludes && url.includes(config.urlIncludes)))))(matchUrlByConfig, method, url.toString());
  };
  function hookFetch(options) {
    if (isFetchHooked) throw Error("Fetch Hooker is already hooked!");
    registerEnablePreviousHookListener(), isFetchHooked = !0, enabled = !isCurrentScriptOptimisticallyInjected();
    const unregisterFetchInterceptor = fetch_intercept.register({
      async request(url, config) {
        if (!enabled || !config || !config.body) return [ url, config ];
        const request = new Request(url, config), beforeCallers = options.filter((callerOptions => filterByUrlOption(callerOptions, "before", config?.method, url.toString()))), afterCallersWithBodyRequired = options.filter((callerOptions => callerOptions.requireRequestBodyInAfter && filterByUrlOption(callerOptions, "after", config?.method, url.toString()))), requestId = Math.random().toString(36).substring(7);
        afterCallersWithBodyRequired.length && requestInfoMap.set(request, {
          body: config.body,
          requestId
        });
        try {
          for (const callerOptions of beforeCallers) {
            const updatedBody = await (callerOptions.before?.(config.body, {
              url: url.toString(),
              method: config.method,
              body: config.body,
              requestId
            }));
            if (updatedBody) {
              return [ request, {
                ...config,
                body: updatedBody instanceof Object ? JSON.stringify(updatedBody) : updatedBody
              } ];
            }
          }
        } catch (error) {
          logFeatureError("fetch-hook", {
            type: "before",
            url: url.toString(),
            method: config.method,
            error
          });
        }
        return [ request, config ];
      },
      response(response) {
        if (!enabled) return response;
        try {
          if (response.ok) {
            const afterCallers = options.filter((callerOptions => filterByUrlOption(callerOptions, "after", response.request?.method, response.request?.url.toString())));
            if (!afterCallers.length) return response;
            const reponseObj = (response => {
              const responseClone = response.clone(), requestInfo = requestInfoMap.get(response.request);
              return {
                json: () => responseClone.json(),
                status: responseClone.status,
                statusText: responseClone.statusText,
                url: responseClone.url,
                ok: responseClone.ok,
                requestId: requestInfo?.requestId,
                body: requestInfo?.body,
                headers: responseClone.headers && Array.from(responseClone.headers.entries()).reduce(((obj, [key, value]) => (obj[key] = value, 
                obj)), {})
              };
            })(response);
            requestInfoMap.delete(response.request), afterCallers.forEach((callerOptions => {
              callerOptions.after?.(reponseObj);
            }));
          }
        } catch (error) {
          logFeatureError("fetch-hook", {
            type: "after",
            url: response.request?.url.toString(),
            method: response.request?.method,
            error
          });
        }
        return response;
      }
    });
    return {
      setIsEnabledFetchHook: (toEnable = !0) => {
        enabled = toEnable;
      },
      unhookFetch: () => {
        unregisterFetchInterceptor();
      }
    };
  }
  function handleSetRequestHeader(name, value) {
    enabled && (this._chRequestHeaders || (this._chRequestHeaders = {}), this._chRequestHeaders[name.toLowerCase()] = value), 
    rawSetRequestHeader.call(this, name, value);
  }
  const xhr_attachments_cache = window._CH_OWA_Attachments ?? new Map;
  function getEmailAttachments(emailId) {
    const mailAttachments = xhr_attachments_cache.get(emailId), attachments = mailAttachments ? mailAttachments.values() : [];
    return [ ...new Map(Array.from(attachments).map((attachment => [ attachment.name, attachment ]))).values() ];
  }
  function saveOwaAttachments(owaExchangeItem) {
    const emailId = owaExchangeItem.ItemId.Id, attachments = owaExchangeItem.Attachments;
    if (attachments.length > 0) {
      const mailItem = xhr_attachments_cache.get(emailId);
      mailItem ? attachments.forEach((attachment => mailItem.set(attachment.AttachmentId.Id, mapOwaAttachment(attachment)))) : xhr_attachments_cache.set(emailId, new Map(attachments.map((attachment => [ attachment.AttachmentId.Id, mapOwaAttachment(attachment) ]))));
    }
  }
  function mapOwaAttachment(owaAttachment) {
    return {
      attachmentId: owaAttachment.AttachmentId.Id,
      name: owaAttachment.Name,
      size: owaAttachment.Size,
      contentType: owaAttachment.ContentType,
      lastModifiedTime: owaAttachment.LastModifiedTime
    };
  }
  async function handleCreateAttachmentXhrResponse(responseText, postDataHeader, startedTime) {
    const postData = JSON.parse(decodeURIComponent(postDataHeader)), responseBody = JSON.parse(responseText).Body, emailId = postData.Body?.ParentItemId?.Id, {Name, Size, ContentType} = postData.Body.Attachments[0], attachmentId = responseBody.ResponseMessages?.Items?.[0]?.Attachments?.[0]?.AttachmentId?.Id, file = await async function(file, timestamp) {
      return await dispatchOnPageWithReply("Cyberhaven_GetRecentUpload", {
        file,
        timestamp
      });
    }({
      name: Name,
      size: Size,
      mimeType: ContentType
    }, startedTime);
    if (emailId && attachmentId && file) {
      const attachment = {
        emailId,
        attachmentId,
        name: Name,
        size: String(Size),
        uploadId: file.upload_id
      };
      !function(emailId, attachment) {
        const mailItem = xhr_attachments_cache.get(emailId);
        mailItem ? mailItem.set(attachment.attachmentId, attachment) : xhr_attachments_cache.set(emailId, new Map([ [ attachment.attachmentId, attachment ] ]));
      }(emailId, attachment), dispatchOnPage("Cyberhaven_AddEmailAttachment", attachment);
    }
  }
  function getOWAServiceSVCPathAction(action) {
    return `\\/service\\.svc\\/${action}(\\?|$|\\/)`;
  }
  function getOWAServiceSVCQueryAction(action) {
    return `/service.svc\\?[\\S\\s]*?action=${action}(&|$)`;
  }
  function prepareBatchRequest(recipients, attachments, emailId, subject) {
    const requests = [];
    for (const recipient of recipients) for (const attachment of attachments) requests.push({
      emailId,
      recipientEmail: recipient,
      subject,
      attachmentId: attachment.attachmentId,
      fileName: attachment.name,
      fileSize: String(attachment.size)
    });
    return {
      requests
    };
  }
  window._CH_OWA_Attachments = xhr_attachments_cache;
  const latestBlockedBatchRequest = {}, dispatchSentEvent = async batchRequest => {
    if (JSON.stringify(batchRequest.requests) === JSON.stringify(latestBlockedBatchRequest.requests) && Date.now() - latestBlockedBatchRequest.timestamp < 1500) return {
      result: "block",
      sent: !1
    };
    const response = await dispatchOnPageWithReply("Cyberhaven_SentEmail", batchRequest);
    return "block" === response?.result ? (latestBlockedBatchRequest.requests = batchRequest.requests, 
    latestBlockedBatchRequest.timestamp = Date.now(), {
      result: "block",
      sent: !1
    }) : "success" === response?.status ? {
      ...response,
      sent: !0
    } : {
      result: "allow",
      sent: !1
    };
  };
  async function handleSendEmailRequest(body) {
    if (function(body) {
      return "newMail" == body.ComposeOperation && -1 != body.MessageDisposition.toLowerCase().indexOf("send") && "ItemChanges" in body;
    }(body)) {
      const emailId = body.ItemChanges[0].ItemId.Id, recipients = function(body) {
        const emails = [ ...body.ItemChanges[0].Updates.find((update => "ToRecipients" === update.Path.FieldURI)).Item.ToRecipients, ...body.ItemChanges[0].Updates.find((update => "CcRecipients" === update.Path.FieldURI)).Item.CcRecipients, ...body.ItemChanges[0].Updates.find((update => "BccRecipients" === update.Path.FieldURI)).Item.BccRecipients ].map((recipientUpdate => recipientUpdate.EmailAddress));
        return Array.from(new Set(emails));
      }(body), subject = function(body) {
        const subjectUpdate = body.ItemChanges[0].Updates.find((update => "Subject" == update.Path.FieldURI));
        return subjectUpdate?.Item?.Subject || "";
      }(body), batchRequest = prepareBatchRequest(recipients, getEmailAttachments(body.ItemChanges[0].ItemId.Id), emailId, subject);
      if (batchRequest.requests.length) return await dispatchSentEvent(batchRequest);
    }
    return {
      result: "allow",
      sent: !1
    };
  }
  async function processGetEmailResponse(response) {
    const json = await response.json();
    var parsedBody;
    parsedBody = json, parsedBody?.Body?.ResponseMessages?.Items?.[0]?.Items?.[0]?.Attachments?.length > 0 && saveOwaAttachments(json.Body.ResponseMessages.Items[0].Items[0]);
  }
  async function processGetConversationResponse(response) {
    const json = await response.json(), conversationNodes = json?.Body?.ResponseMessages?.Items?.[0]?.Conversation?.ConversationNodes;
    conversationNodes?.length && function(conversationNotes) {
      for (const conversationNote of conversationNotes) for (const item of conversationNote.Items) item.HasAttachments && saveOwaAttachments(item);
    }(conversationNodes);
  }
  async function handleForwardOrReplyEmailRequest(body) {
    if (function(body) {
      return "newMail" == body.ComposeOperation && -1 != body.MessageDisposition.toLowerCase().indexOf("send") && "Items" in body && ("Forward" == body.Items[0].operation || "Reply" == body.Items[0].operation || "ReplyAll" == body.Items[0].operation);
    }(body)) {
      const email = body.Items[0], emailId = email.UpdateResponseItemId.Id, referenceEmailId = email.ReferenceItemId.Id, recipients = function(owaItem) {
        const emails = [ ...owaItem.ToRecipients, ...owaItem.CcRecipients, ...owaItem.BccRecipients ].map((recipientUpdate => recipientUpdate.EmailAddress));
        return Array.from(new Set(emails));
      }(email), subject = email.Subject, newEmailAttachments = getEmailAttachments(emailId), referenceEmailAttachments = getEmailAttachments(referenceEmailId), attachments = function(arr, prop) {
        const set = new Set;
        return arr.filter((item => {
          const key = prop ? item[prop] : item;
          return !set.has(key) && (set.add(key), !0);
        }));
      }([ ...newEmailAttachments, ...referenceEmailAttachments ], "name"), batchRequest = prepareBatchRequest(recipients, attachments, emailId, subject);
      if (batchRequest.requests.length) {
        if (referenceEmailAttachments.length && attachments.length) for (const attachment of attachments) {
          const cloudFileId = referenceEmailAttachments.find((refAttachment => refAttachment.name === attachment.name))?.attachmentId;
          cloudFileId && await dispatchOnPage("Cyberhaven_AddEmailAttachment", {
            ...attachment,
            cloudFileId
          });
        }
        return await dispatchSentEvent(batchRequest);
      }
    }
    return {
      result: "allow",
      sent: !1
    };
  }
  const service = "outlook_web_app";
  ((service, scriptId) => {
    ((value = !0) => {
      addVersionToEventNameByDefault = !isCurrentScriptOptimisticallyInjected() && value;
    })(), scriptId ? onServiceReady(service, (() => {
      registerEvents(service, scriptId);
    })) : registerEvents(service, scriptId);
  })(service, "outlook_web_app_xhr"), function() {
    const fetchConfigs = [ {
      matchUrlBeforeConfig: [ {
        method: "POST",
        urlRegex: getOWAServiceSVCQueryAction("UpdateItem")
      }, {
        method: "POST",
        urlRegex: getOWAServiceSVCQueryAction("CreateItem")
      } ],
      before: async (_body, config) => {
        const started = performance.now(), requestBody = JSON.parse(config.body), actionType = new RegExp(getOWAServiceSVCQueryAction("UpdateItem")).test(config.url) ? "UpdateItem" : "CreateItem", backendResponse = "UpdateItem" === actionType ? await handleSendEmailRequest(requestBody.Body) : await handleForwardOrReplyEmailRequest(requestBody.Body);
        if ("block" === backendResponse.result && function(config, requestBody) {
          config.body = JSON.stringify({
            ...requestBody,
            Body: null
          });
        }(config, requestBody), backendResponse?.sent) {
          const duration = performance.now() - started;
          logInfo({
            event: "SendEmail",
            backendResponse,
            duration,
            actionType,
            cacheSize: Array.from(xhr_attachments_cache.entries()).reduce(((total, [_, val]) => total + val.size), 0)
          });
        }
        return config.body;
      }
    }, {
      matchUrlAfterConfig: [ {
        method: "POST",
        urlRegex: getOWAServiceSVCQueryAction("GetItem")
      } ],
      after(response) {
        "requestIdleCallback" in window ? requestIdleCallback((() => processGetEmailResponse(response)), {
          timeout: 5e3
        }) : processGetEmailResponse(response);
      }
    }, {
      matchUrlAfterConfig: [ {
        method: "POST",
        urlRegex: getOWAServiceSVCQueryAction("GetConversationItems")
      } ],
      after(response) {
        "requestIdleCallback" in window ? requestIdleCallback((() => processGetConversationResponse(response)), {
          timeout: 5e3
        }) : processGetConversationResponse(response);
      }
    } ], xhrConfigs = [ {
      after({responseText, headers, startedAt}) {
        const postBody = headers?.["x-owa-urlpostdata"];
        postBody && handleCreateAttachmentXhrResponse(responseText, postBody, startedAt);
      },
      matchUrlAfterConfig: [ {
        method: "POST",
        urlRegex: getOWAServiceSVCPathAction("CreateAttachmentFromLocalFile")
      } ],
      matchHeadersAfterConfig: [ {
        nameIncludes: "x-owa-urlpostdata"
      } ]
    } ];
    ((xhrOptions, fetchOptions = []) => {
      const xhrHookConfigs = [], fetchHookConfigs = [];
      for (const option of xhrOptions) xhrHookConfigs.push(lodash_pick(option, "matchUrlBeforeConfig", "matchUrlAfterConfig", "matchHeadersAfterConfig"));
      for (const option of fetchOptions) fetchHookConfigs.push(lodash_pick(option, "matchUrlBeforeConfig", "matchUrlAfterConfig", "matchHeadersAfterConfig"));
      const onWebWorkerMessage = async (event, webWorker) => {
        if ([ "ch_xhr_hook", "ch_fetch_hook" ].includes(event.data.type)) {
          const options = "ch_xhr_hook" === event.data.type ? xhrOptions : fetchOptions, eventData = event.data.eventData, configIndex = eventData.configIndex;
          if ("before" === eventData.configType) {
            const body = await (options[configIndex].before?.(eventData.args[0], eventData.args[1]));
            "ch_fetch_hook" === event.data.type && dispatchOnWebWorker("ch_fetch_hook_reply", {
              body: body instanceof Object ? JSON.stringify(body) : body
            }, webWorker);
          } else "after" === eventData.configType && options[configIndex].after && ("ch_fetch_hook" === event.data.type && (eventData.args[0].json = () => Promise.resolve(eventData.args[0].jsonData)), 
          Reflect.apply(options[configIndex].after, void 0, eventData.args));
        }
      };
      isWebWorkerContext() || interceptWebWorker(xhrHookConfigs, fetchHookConfigs, onWebWorkerMessage);
    })(xhrConfigs, fetchConfigs);
    const {setIsEnabledFetchHook, unhookFetch} = hookFetch(fetchConfigs), {unhook, enableHook} = function(options, {enablePreviousScriptOnReload = !1} = {}) {
      if (registerEnablePreviousHookListener(), isXhrHooked) throw Error("XHR Hooker is already hooked!");
      function handleXhrOpen(method, url, async) {
        try {
          if (enabled) {
            const startedAt = Date.now();
            let beforeCallers = [], afterCallers = [];
            try {
              beforeCallers = options.filter((callerOptions => filterByUrlOption(callerOptions, "before", method, url.toString()))), 
              afterCallers = options.filter((callerOptions => filterByUrlOption(callerOptions, "after", method, url.toString())));
            } catch (error) {
              logError({
                error: "Error occured in hookXhr filterByUrlOption",
                errorMessage: getErrorMessage(error),
                url: url.toString(),
                method
              });
            }
            if (beforeCallers?.length || afterCallers?.length) {
              const originalSend = this.send;
              this.send = function(body) {
                const config = {
                  url: url.toString(),
                  method,
                  body: body + "",
                  formData: body instanceof FormData ? Object.fromEntries(body) : void 0,
                  xhr: this
                }, headers = this._chRequestHeaders;
                for (const afterCaller of afterCallers) {
                  let matchedByHeaders, matchedByBody;
                  try {
                    matchedByHeaders = !afterCaller.matchHeadersAfter && !afterCaller.matchHeadersAfterConfig || afterCaller.matchHeadersAfter && afterCaller.matchHeadersAfter?.(headers) || afterCaller.matchHeadersAfterConfig && matchHeadersWithConfigs(afterCaller.matchHeadersAfterConfig, headers), 
                    matchedByBody = !afterCaller.matchBodyAfter || afterCaller.matchBodyAfter(body + "");
                  } catch (error) {
                    logError({
                      error: "Error occuredin hookXhr after matching",
                      errorMessage: getErrorMessage(error),
                      url: config.url
                    });
                  }
                  if (matchedByHeaders && matchedByBody) {
                    const onReadyStateChange = async () => {
                      if (this.readyState === XMLHttpRequest.DONE) {
                        const responseText = [ "text", "" ].includes(this.responseType) ? this.responseText : "";
                        try {
                          await (afterCaller.after?.({
                            responseText,
                            headers,
                            startedAt,
                            config: {
                              ...config,
                              status: this.status,
                              response: responseText
                            }
                          }, this));
                        } catch (error) {
                          logError({
                            error: "Error occured in xhr-hooks.after",
                            errorMessage: getErrorMessage(error),
                            url: config.url
                          });
                        }
                      }
                    };
                    this.addEventListener("readystatechange", onReadyStateChange);
                  }
                }
                if (async) for (const beforeCaller of beforeCallers) if (!beforeCaller.matchBodyBefore || beforeCaller.matchBodyBefore(body + "")) return void beforeCaller.before?.(body, config).catch((error => {
                  logError({
                    error: "Error occured in hookXhr before",
                    errorMessage: getErrorMessage(error),
                    url: config.url
                  }), originalSend.call(this, body);
                })).then((modifiedBody => {
                  null === modifiedBody && beforeCaller.beforeAbortOnNull ? this.abort() : originalSend.call(this, void 0 === modifiedBody ? body : modifiedBody);
                }));
                originalSend.call(this, body);
              };
            }
          }
        } catch (error) {
          logError({
            error: "Error occured in hookXhr",
            errorMessage: getErrorMessage(error),
            url: url.toString()
          });
        }
        rawOpen.apply(this, [].slice.call(arguments));
      }
      return isXhrHooked = !0, enabled = !isCurrentScriptOptimisticallyInjected(), Object.defineProperty(XMLHttpRequest.prototype, "open", {
        get() {
          return this._open;
        },
        set(value) {
          value.toString().includes("[native code]") ? this._open = handleXhrOpen : this._open = value;
        }
      }), XMLHttpRequest.prototype.open = handleXhrOpen, XMLHttpRequest.prototype.setRequestHeader = handleSetRequestHeader, 
      {
        enableHook: (toEnable = !0) => {
          enabled = toEnable, toEnable && enablePreviousScriptOnReload && dispatchOnPageWithReply("Cyberhaven_EnablePreviousHookIfExist", {
            initiatedByScriptId: xhr_hooks_randomScriptId
          }).then((({doesExist} = {
            doesExist: !1
          }) => {
            doesExist && (enabled = !1);
          }));
        },
        unhook: () => {
          enabled = !1;
        }
      };
    }(xhrConfigs);
    var callback;
    onServiceReady(service, setIsEnabledFetchHook), onServiceReady(service, enableHook), 
    callback = () => {
      unhook(), unhookFetch();
    }, getSignal().addEventListener("abort", callback);
  }();
})();