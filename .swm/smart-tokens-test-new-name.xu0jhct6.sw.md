---
title: Smart tokens test - New name
---
This is a test of smart tokens.

Here is a snippet:

<SwmSnippet path="/scripts/flow/environmentRenamed.js" line="83">

---

This is a comment with a path: <SwmPath>[scripts/flow/environmentRenamed.js](/scripts/flow/environmentRenamed.js)</SwmPath>

And here are 3 tokens to this file:

`lstat`

<SwmToken path="/scripts/flow/environmentRenamed.js" pos="89:5:5" line-data="  declare var access: (path: string, mode?: number) =&gt; Promise&lt;void&gt;;">`access`</SwmToken>

<SwmToken path="/scripts/flow/environmentRenamed.js" pos="83:4:4" line-data="declare function __webpack_chunk_load__(id: string): Promise&lt;mixed&gt;;">`__webpack_chunk_load__`</SwmToken>

<SwmToken path="/scripts/flow/environmentRenamed.js" pos="84:4:4" line-data="declare function __webpack_require__(id: string): any;">`__webpack_require__`</SwmToken>

<SwmToken path="/scripts/flow/environmentRenamed.js" pos="165:5:5" line-data="  declare class TextEncoder {">`TextEncoder`</SwmToken>

```javascript
declare function __webpack_chunk_load__(id: string): Promise<mixed>;
declare function __webpack_require__(id: string): any;

declare module empty {}

declare module 'fs/promises' {
  declare var access: (path: string, mode?: number) => Promise<void>;

    path: string,
    options?: ?{bigint?: boolean},
  ) => Promise<mixed>;
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
          withFileTypes?: ?boolean,
        },
  ) => Promise<Buffer>;
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
  ) => Promise<Buffer>;
    path: string,
    options?:
      | ?string
      | {
          encoding?: ?string,
        },
```

---

</SwmSnippet>

This is some text.

Some more text.

**Text text texting** <SwmPath>[scripts/circleci/short_name.js](/scripts/circleci/short_name.js)</SwmPath><SwmToken path="/scripts/circleci/short_name.js" pos="8:2:2" line-data="const ROOT_PATH = join(__dirname, &#39;..&#39;, &#39;..&#39;);">`ROOT_PATH`</SwmToken><SwmToken path="/scripts/circleci/short_name.js" pos="32:2:2" line-data="function logDim(loggable) {">`logDim`</SwmToken><SwmToken path="/scripts/circleci/short_name.js" pos="18:2:2" line-data="function format(loggable) {">`format`</SwmToken>

Editing again.

<SwmSnippet path="/scripts/release/snapshot-test.js" line="13">

---

&nbsp;

```javascript
const CIRCLE_CI_BUILD = 12707;
const COMMIT = 'b3d1a81a9';
const VERSION = '1.2.3';
```

---

</SwmSnippet>

<SwmToken path="/scripts/release/snapshot-test.js" pos="13:2:2" line-data="const CIRCLE_CI_BUILD_AUTO = 12707;">`CIRCLE_CI_BUILD_AUTO`</SwmToken>

`CIRCLE_CI_API_TOKEN`hello&nbsp;

<SwmMeta version="3.0.0" repo-id="Z2l0aHViJTNBJTNBcmVhY3QlM0ElM0FJZGl0WWVnZXJTd2ltbQ==" repo-name="react"><sup>Powered by [Swimm](https://swimm-web-app.web.app/)</sup></SwmMeta>
