#DOMHandler [![Build Status](https://secure.travis-ci.org/fb55/DomHandler.png)](http://travis-ci.org/fb55/DomHandler)

The DOM handler (formally known as DefaultHandler) creates a tree containing all nodes of a page. The tree may be manipulated using the DOMUtils library.

##Usage
```javascript
var handler = new DomHandler([ <func> callback(err, dom), ] [ <obj> options ]);
// var parser = new Parser(handler[, options]);
```

##Example
```javascript
var htmlparser = require("htmlparser2");
var rawHtml = "Xyz <script language= javascript>var foo = '<<bar>>';< /  script><!--<!-- Waah! -- -->";
var handler = new htmlparser.DomHandler(function (error, dom) {
    if (error)
    	[...do something for errors...]
    else
    	[...parsing done, do something...]
        console.log(dom);
});
var parser = new htmlparser.Parser(handler);
parser.write(rawHtml);
parser.done();
```

Output:

```javascript
[{
    data: 'Xyz ',
    type: 'text'
}, {
    type: 'script',
    name: 'script',
    attribs: {
    	language: 'javascript'
    },
    children: [{
    	data: 'var foo = \'<bar>\';<',
    	type: 'text'
    }]
}, {
    data: '<!-- Waah! -- ',
    type: 'comment'
}]
```

##Option: normalizeWhitespace
Indicates whether the whitespace in text nodes should be normalized (= all whitespace should be replaced with single spaces). The default value is "false". 

The following HTML will be used:

```html
<font>
	<br>this is the text
<font>
```

###Example: true

```javascript
[{
    type: 'tag',
    name: 'font',
    children: [{
    	data: ' ',
    	type: 'text'
    }, {
    	type: 'tag',
    	name: 'br'
    }, {
    	data: 'this is the text ',
    	type: 'text'
    }, {
    	type: 'tag',
    	name: 'font'
    }]
}]
```

###Example: false

```javascript
[{
    type: 'tag',
    name: 'font',
    children: [{
    	data: '\n\t',
    	type: 'text'
    }, {
    	type: 'tag',
    	name: 'br'
    }, {
    	data: 'this is the text\n',
    	type: 'text'
    }, {
    	type: 'tag',
    	name: 'font'
    }]
}]
```

##Option: withStartIndices
Indicates whether a `startIndex` property will be added to nodes. When the parser is used in a non-streaming fashion, `startIndex` is an integer indicating the position of the start of the node in the document. The default value is "false".
