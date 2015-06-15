{
  "type": "object",
  "required": [
    "method",
    "url",
    "httpVersion",
    "cookies",
    "headers",
    "queryString",
    "headersSize",
    "bodySize"
  ],
  "properties": {
    "method": {
      "type": "string"
    },
    "url": {
      "type": "string",
      "format": "uri"
    },
    "httpVersion": {
      "type": "string"
    },
    "cookies": {
      "type": "array",
      "items": {
        "$ref": "#cookie"
      }
    },
    "headers": {
      "type": "array",
      "items": {
        "$ref": "#record"
      }
    },
    "queryString": {
      "type": "array",
      "items": {
        "$ref": "#record"
      }
    },
    "postData": {
      "$ref": "#postData"
    },
    "headersSize": {
      "type": "integer"
    },
    "bodySize": {
      "type": "integer"
    },
    "comment": {
      "type": "string"
    }
  }
}
