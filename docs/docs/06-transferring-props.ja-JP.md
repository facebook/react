---
id: transferring-props
title: propsの移譲
permalink: transferring-props-ja-JP.html
prev: reusable-components-ja-JP.html
next: forms-ja-JP.html

---


コンポーネントを抽象的にラップすることはReactにおいて共通のパターンです。外のコンポーネントは単純なプロパティを表示し、中ではさらに複雑なインプリメンテーションの詳細を持つようになっています。

以下のように、古いpropsと追加の値を[JSXの拡張属性](/react/docs/jsx-spread-ja-JP.html)を使ってマージすることができます。

```javascript
<Component {...this.props} more="values" />
```

JSXを使わない場合は、以下のように、ES6の `Object.assign` か Underscore の `_.extend` といったオブジェクトヘルパーを使うことができます。

```javascript
React.createElement(Component, Object.assign({}, this.props, { more: 'values' }));
```

以下のチュートリアルはベストプラクティスを提示しています。JSXや試験的なES7のシンタックスを使っています。

## 手動での移動

ほとんどの場合、プロパティを明確に子要素に渡すべきです。それは、内部のAPIのサブセットだけを外に出していることと、認識しているプロパティが動作することを保証します。

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    <div className={fancyClass} onClick={props.onClick}>
      {props.children}
    </div>
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

しかし、 `name` プロパティや `title` プロパティや `onMouseOver` はどうでしょうか？

## JSXにおける `...` を使った移譲

> 注意:
> 以下の例では、実験的なES7のシンタックスであることを示すために `--harmony ` フラグが必要になります。ブラウザ上でJSXトランスフォーマーを使う際には、単純に `<script type="text/jsx;harmony=true">` を使ってスクリプトを読み込んでください。詳細については、 [レストとスプレッドのプロパティ ...](/react/docs/transferring-props.html#rest-and-spread-properties-...)をご覧ください。

全てのプロパティを渡すのはバグを生みやすく、面倒くさいときがあります。そのようなケースでは、未知のプロパティのセットを使うためにレストプロパティと共に[分割代入引数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)を使うことができます。

以下のように `...other` を使うことで、使いたいプロパティを一覧にすることができます。

```javascript
var { checked, ...other } = props;
```

これは、自分で指定したものは 除き 、全てのpropsを渡すことを保証します。

```javascript
function FancyCheckbox(props) {
  var { checked, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  // `other` は { onClick: console.log } を含みますが、 checked プロパティは含みません。
  return (
    <div {...other} className={fancyClass} />
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

> 注意:
> 上の例では、 `checked` propは正式なDOMの属性でもあります。この方法を使って分割代入を行わない場合は、無意識的に渡すこともできます。

未知の `other` propsを移譲する際には、分割代入パターンを常に使ってください。

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  // アンチパターン: `checked` が内部のコンポーネントに渡されます。
  return (
    <div {...props} className={fancyClass} />
  );
}
```

## 同じpropを使い、移譲する

コンポーネントがプロパティを使うだけでなく、子要素に渡したい場合は、明確に `checked={checked}` と記述することで再度渡すことができます。 `this.props` オブジェクトで全てを渡すほうが、リファクタリングやチェックをしやすいので好ましいです。

```javascript
function FancyCheckbox(props) {
  var { checked, title, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  var fancyTitle = checked ? 'X ' + title : 'O ' + title;
  return (
    <label>
      <input {...other}
        checked={checked}
        className={fancyClass}
        type="checkbox"
      />
      {fancyTitle}
    </label>
  );
}
```

> 注意:
> 順番の問題です。JSXのpropsの前に `{...other}` を置くことで、コンポーネントの使用者がオーバーライドできないことを保証します。上の例ではinputが `"checkbox"` 型であることを保証しました。

## レストとスプレッドのプロパティ `...`

レストプロパティはあるオブジェクトの残りの要素を新しいオブジェクトに引き抜きます。分割代入パターンでリストになっている全てのプロパティを外に出します。

これは、[ES7プロポーサル](https://github.com/sebmarkbage/ecmascript-rest-spread)の実験的な実行です。

```javascript
var { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

> 注意:
> 実験的なES7のシンタックスを有効にするには、 `--harmony` フラグを[JSXコマンドラインツール](https://www.npmjs.com/package/react-tools)で使用してください。

## Underscoreによる移譲

JSXを使わない際には、同じパターンを行うライブラリを使うことができます。Underscoreでは、 `_.omit` を使ってプロパティをフィルタしたり、 `_.extend` を使って新しいオブジェクトにプロパティをコピーしたりできます。

```javascript
function FancyCheckbox(props) {
  var checked = props.checked;
  var other = _.omit(props, 'checked');
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    React.DOM.div(_.extend({}, other, { className: fancyClass }))
  );
}
```
