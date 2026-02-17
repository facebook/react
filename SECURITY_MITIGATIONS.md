# Security Mitigations in React Server Components

This document describes the security mitigations implemented to address the following vulnerabilities:

- **GHSA-fv66-9v8q-g76r** (Critical): Remote Code Execution vulnerability
- **GHSA-925w-6v3x-g4j4** (Moderate): Source Code Exposure vulnerability
- **GHSA-2m3v-v2m8-q956** (High): Denial of Service vulnerability
- **GHSA-7gmr-mq3h-m5h9** (High): Denial of Service vulnerability
- **GHSA-83fc-fqcc-2hmg** (High): Multiple Denial of Service vulnerabilities

## Security Limits Implemented

### 1. JSON Payload Size Limit
**File**: `packages/react-server/src/ReactFlightReplyServer.js`  
**Constant**: `MAX_JSON_PAYLOAD_SIZE = 50 * 1024 * 1024` (50MB)

**Protection**: Prevents memory exhaustion attacks by limiting the size of JSON payloads before parsing.

**Implementation**: Validates payload size before `JSON.parse()` in `initializeModelChunk()`.

```javascript
if (resolvedModel.length > MAX_JSON_PAYLOAD_SIZE) {
  throw new Error('JSON payload too large...');
}
```

### 2. FormData Key Count Limit
**File**: `packages/react-server/src/ReactFlightReplyServer.js`  
**Constant**: `MAX_FORMDATA_KEYS = 100000`

**Protection**: Prevents DoS attacks via excessive FormData keys that could cause slow iteration.

**Implementation**: Tracks key count in `resolveField()` and `resolveFile()`, validates in FormData parsing.

```javascript
response._formDataKeyCount++;
if (response._formDataKeyCount > MAX_FORMDATA_KEYS) {
  throw new Error('FormData key limit exceeded...');
}
```

### 3. String Length Limit
**File**: `packages/react-server/src/ReactFlightReplyServer.js`  
**Constant**: `MAX_STRING_LENGTH = 10 * 1024 * 1024` (10MB per string)

**Protection**: Prevents individual strings from consuming excessive memory.

**Implementation**: Validates each string in `parseModelString()`.

```javascript
if (value.length > MAX_STRING_LENGTH) {
  throw new Error('String too long...');
}
```

### 4. Total String Memory Limit
**File**: `packages/react-server/src/ReactFlightReplyServer.js`  
**Constant**: `MAX_TOTAL_STRING_SIZE = 500 * 1024 * 1024` (500MB total)

**Protection**: Prevents cumulative string memory exhaustion across entire request.

**Implementation**: Tracks total string size in `parseModelString()`.

```javascript
response._totalStringSize += value.length;
if (response._totalStringSize > MAX_TOTAL_STRING_SIZE) {
  throw new Error('Total string size limit exceeded...');
}
```

### 5. Server Reference ID Validation
**File**: `packages/react-server/src/ReactFlightActionServer.js`

**Protection**: Prevents path traversal attacks and RCE via malicious server reference IDs.

**Implementation**: Validates server reference IDs in `loadServerReference()`.

```javascript
if (id.includes('..') || id.includes('\0') || id.startsWith('/')) {
  throw new Error('Invalid server reference ID...');
}
```

## Existing Security Measures

These security measures were already present and continue to provide protection:

### 6. Array Nesting Limit
**Constant**: `DEFAULT_MAX_ARRAY_NESTING = 1000000`

**Protection**: Prevents DoS via deeply nested array structures.

### 7. BigInt Digit Limit
**Constant**: `MAX_BIGINT_DIGITS = 300`

**Protection**: Prevents CPU exhaustion from parsing extremely large BigInt values.

### 8. Bound Arguments Limit
**Constant**: `MAX_BOUND_ARGS = 1000`

**Protection**: Prevents unbounded function binding in server actions.

## Testing

Comprehensive security tests are located in:
- `packages/react-server-dom-webpack/src/__tests__/ReactFlightDOMSecurity-test.js`

Tests cover:
- ✅ Rejection of excessively large JSON payloads
- ✅ Rejection of excessively long strings
- ✅ Rejection of excessive total string size
- ✅ Rejection of FormData with too many keys
- ✅ Rejection of server reference IDs with path traversal
- ✅ Acceptance of large but legitimate payloads (10,000 FormData keys, 5MB documents, 20MB datasets)
- ✅ Prevention of deeply nested arrays
- ✅ Prevention of BigInt DoS
- ✅ Bound arguments limits

## Rationale for Limit Values

### Why 50MB for JSON?
Allows data-heavy applications to transfer substantial datasets (e.g., 50,000 records with metadata) while preventing unbounded memory allocation.

### Why 100,000 FormData Keys?
Accommodates very large forms (e.g., spreadsheet-like interfaces, bulk data entry) while preventing iteration-based DoS attacks.

### Why 10MB per String?
Supports large documents, technical documentation, and base64-encoded files while preventing single-string memory exhaustion.

### Why 500MB Total String Memory?
Allows multiple large strings in a single request while capping total memory consumption to reasonable server limits.

## Impact on Legitimate Use Cases

These limits are designed to be **high enough for legitimate applications** while preventing abuse:

- ✅ Large forms with thousands of fields: Supported (up to 100,000 keys)
- ✅ Document uploads/editing: Supported (up to 10MB per document)
- ✅ Data-heavy applications: Supported (up to 50MB JSON payloads)
- ✅ Multiple large files: Supported (up to 500MB total strings)
- ❌ Malicious payloads: Rejected at limits

## Future Considerations

For applications requiring higher limits, consider:

1. **Chunking**: Break large payloads into smaller chunks
2. **Streaming**: Use streaming APIs for large data transfers
3. **File Uploads**: Use dedicated file upload endpoints with multipart/form-data
4. **Configuration**: Consider making these limits configurable per application

## References

- [GHSA-83fc-fqcc-2hmg](https://github.com/advisories/GHSA-83fc-fqcc-2hmg)
- [GHSA-7gmr-mq3h-m5h9](https://github.com/advisories/GHSA-7gmr-mq3h-m5h9)
- [GHSA-2m3v-v2m8-q956](https://github.com/advisories/GHSA-2m3v-v2m8-q956)
- [GHSA-925w-6v3x-g4j4](https://github.com/advisories/GHSA-925w-6v3x-g4j4)
- [GHSA-fv66-9v8q-g76r](https://github.com/advisories/GHSA-fv66-9v8q-g76r)
- [React Blog: Denial of Service and Source Code Exposure in React Server Components](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components)
