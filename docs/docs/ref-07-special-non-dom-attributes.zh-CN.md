---
id: special-non-dom-attributes-zh-CN
title: 特殊的 Non-DOM Attributes
permalink: docs/special-non-dom-attributes-zh-CN.html
prev: dom-differences-zh-CN.html
next: reconciliation-zh-CN.html
---

和 [DOM 的不同之处](/react/docs/dom-differences-zh-CN.html)相比, React 提供了一些不存在于DOM的 attributes .

- `key`: 一个可选的.独特的标识.当你的组件穿梭于 `render` 的pass,它也许会因为diff算法被摧毁和重建.赋予它一个持久的key保证这个component可达.详见 [这里](/react/docs/multiple-components.html#dynamic-children).
- `ref`: 见 [这里](/react/docs/more-about-refs.html).
- `dangerouslySetInnerHTML`: 提供了直接插入raw HTML的能力,主要是为了与操纵DOM字符串的库协作.详见 [这里](/react/tips/dangerously-set-inner-html.html).
