---
id: self-closing-tag-ja-JP
title: 自己終了タグ
layout: tips
permalink: self-closing-tag-ja-JP.html
prev: if-else-in-JSX-ja-JP.html
next: maximum-number-of-jsx-root-nodes-ja-JP.html
---

JSXでは、 `<MyComponent />` 単体は正しいですが、 `<MyComponent>` は正しくありません。 全てのタグは、自己終了の形式または対応する終了タグ( `</MyComponent>` )で閉じるべきです。

> 注意:
>
> 全てのReactコンポーネントは `<div />` のように自己終了タグになり得ます。 `<div></div>` もまた同様です。
