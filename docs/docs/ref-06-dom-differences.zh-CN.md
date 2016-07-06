---
id: dom-differences-zh-CN
title: DOM 的不同之处
permalink: dom-differences-zh-CN.html
prev: events-zh-CN.html
next: special-non-dom-attributes-zh-CN.html
---

React 实现了一个浏览器无关的 事件和DOM 系统,原因是为了性能和跨浏览器的兼容性.我们利用这个机会来清理了一些浏览器DOM实现的一些粗糙边缘.

* 所有的 DOM properties 和 attributes (包括事件处理器) 都应该 camelCased 来保持和标准的 JavaScript 风格一致.我们在这里故意打破了这个规范是因为规范是不一致的. **然而**,`data-*` 和 `aria-*` attributes [conform to the specs](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes#data-*) 应该只 lower-cased.
* `style` attribute 接受 camelCased properties 的JavaScript对象 而不是一个CSS字符串. 这保持了和 DOM `style` JavaScript property 的一致,更有效率,而且阻止了XSS安全漏洞.
* 因为 `class` 和 `for` 是 JavaScript的保留字,内建[DOM nodes](http://javascript.info/tutorial/dom-nodes)的JSX元素  应该分别使用 attribute名`className` 和 `htmlFor` ,(比如 `<div className="foo" />`).自定义元素应该直接使用 `class` 和 `for` (例如. `<my-tag class="foo" />` ).
* 所有事件对象遵循 W3C 规范,所有事件(包括提交)正确按W3C规范冒泡.详见[Event System](/react/docs/events.html).
* `onChange` 事件表现的像你期望的那样:不论何时一个表单域改变了这个事件就会激发,而不是模糊的不一致.我们故意打破了已有浏览器的行为,因为 `onChange` 对于他的行为来说用词不当,并且React依赖于这个事件来实时响应用户的输入.详见[Forms](/react/docs/forms.html).
* 表单 输入attributes 类似 `value` 和 `checked`,就像`textarea`一样[More here](/react/docs/forms.html).
