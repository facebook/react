---
id: forms
title: フォーム
permalink: forms-ja-JP.html
prev: transferring-props-ja-JP.html
next: working-with-the-browser-ja-JP.html
---

`<input>` や `<textarea>` や `<option>` のようなフォームのコンポーネントはユーザの入力によって変化しうるので、他のネイティブのコンポーネントとは異なります。以下のコンポーネントは、ユーザの入力に返答することにおいて、フォームを操作することを簡単にするインターフェースを提供します。

`<form>` のイベントについての情報は、[フォームのイベント](/react/docs/events.html#form-events)をご覧ください。

## 双方向のprops

以下のように、フォームのコンポーネントはユーザの入力に影響されるいくつかのpropsをサポートしています。

* `value` は `<input>` と `<textarea>` コンポーネントにサポートされています。
* `checked` は `<input>` コンポーネントの `checkbox` か `radio` タイプにサポートされています。
* `selected` は `<option>` コンポーネントにサポートされています。

HTMLでは、 `<textarea>` の値は子要素によってセットされます。Reactでは、 `value` を代わりに使うべきです。

フォームコンポーネントは `onChange` propにコールバックをセットすることで変更を検知することを可能にします。`onChange` propはブラウザ上で、ユーザの入力に返答する際に発火するために動きます。それは以下のようなタイミングです。

* `<input>` か `<textarea>` の `value` が変わる時。
* `<input>` の `checked` ステータスが変わる時。
* `<option>` の `selected` ステータスが変わる時。

全てのDOMのイベントのように、 `onChange` propは全てのネイティブのコンポーネントにサポートされており、何度も発生するチェンジイベントを検知するのに使われることもあります。

> 注意:
> `<input>` と `<textarea>` にとって、 `onChange` は DOMのビルトインの [`oninput`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput) イベントハンドラの代替のものです。そして、一般的に、代わりに使われています。

## 制御されたコンポーネント

`<input>` と `value` のセットは *制御された* コンポーネントです。制御された `<input>` では、レンダリングされた要素の値は、常に `value` propを反映します。例えば、

```javascript
  render: function() {
    return <input type="text" value="Hello!" />;
  }
```

上記は、常に `Hello!` という値を持つinputをレンダリングするでしょう。ユーザのinputはレンダリングされた要素に何も影響を与えないでしょう。なぜなら、Reactが、値が `Hello!` になるように宣言しているからです。ユーザのinputに返答する形で値を更新したいなら、以下のように `onChange` イベントが使用できます。

```javascript
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    var value = this.state.value;
    return <input type="text" value={value} onChange={this.handleChange} />;
  }
```

この例では、ユーザから提供された、最新の値を単純に受け入れ `<input>` コンポーネントの `value` propを更新します。 このパターンはユーザの入力に返答したり、バリデーションしたりするインターフェースを実行することを簡単にします。例えば、

```javascript
  handleChange: function(event) {
    this.setState({value: event.target.value.substr(0, 140)});
  }
```

上記はユーザのinputを受け入れますが、値を最初の140字に切り取ります。


## 制御されないコンポーネント

`value` を与えられていない（もしくは `null` がセットされている） `<input>` は *制御されない* コンポーネントです。制御されない `<input>` では、レンダリングされた要素の値はユーザのinputを反映します。例えば、

```javascript
  render: function() {
    return <input type="text" />;
  }
```

上記は、空の値で最初は始まるinputをレンダリングします。どのようなユーザのinputも即座にレンダリングされた要素によって反映されます。値の更新を検知したいなら、 `onChange` イベントを、制御されたコンポーネントと同様に使用することができます。

コンポーネントを空ではない値で初期化したいなら、 `defaultValue` propを提供することができます。例えば、

```javascript
  render: function() {
    return <input type="text" defaultValue="Hello!" />;
  }
```

この例は、上記の **制御されたコンポーネント** の例と同じように動くでしょう。

同様に、 `<input>` は `defaultChecked` をサポートし、 `<select>` は `defaultValue` をサポートします。

## 高度なトピック


### なぜコントロールされたコンポーネントを使うのでしょうか？

`<input>` のようなフォームのコンポーネントをReactで使うことは、伝統的なHTMLのフォームを書いた時には無視される表現であることを表します。例えば、HTMLでは、

```html
  <input type="text" name="title" value="Untitled" />
```

上記は、 `Untitled` という値で *初期化* されたinputをレンダリングします。ユーザがinputを更新する時、ノードの `value` *プロパティ* が変更されるでしょう。しかし、 `node.getAttribute('value')` は初期化の際に使用された値である `Untitled` をまだリターンします。

HTMLと違って、Reactのコンポーネントは初期化の時だけではなく、いつでもビューのステータスを再度表示しなくてはなりません。例えば、Reactでは、

```javascript
  render: function() {
    return <input type="text" name="title" value="Untitled" />;
  }
```

このメソッドがいつでもビューを描画するので、次のテキストの入力の値は *常に* `Untitled` になります。


### なぜテキストエリアの値を使うのでしょうか？

HTMLでは、 `<textarea>` の値は普通、以下のようにその子要素を使うことでセットされます。

```html
  <!-- 反例: このようにはしないでください！ -->
  <textarea name="description">This is the description.</textarea>
```

HTMLでは、開発者は簡単に複数行に渡る値を提供できます。しかし、ReactがJavaScriptであるので、文字列の制限を私たちは持っておらず、改行をしたい場合は `\n` を使えます。 `value` と `defaultValue` を私たちが持っている世界では、子要素が果たす役割は曖昧になっています。この理由から、以下のように `<textarea>` の値をセットする際には子要素を使うべきではありません。

```javascript
  <textarea name="description" value="This is a description." />
```

子要素を使うことを *決めた* 場合は、 `defaultValue` と同様の動きをします。

### なぜセレクトバリューを使うのでしょうか？

HTMLの `<select>` の選択された `<option>` は、普通はオプションの `selected` 属性によって指定されます。Reactでは、コンポーネントの操作を簡単にするために、以下のようなフォーマットが代わりに適用されます。

```javascript
  <select value="B">
    <option value="A">Apple</option>
    <option value="B">Banana</option>
    <option value="C">Cranberry</option>
  </select>
```

制御されないコンポーネントを作成するために、 `defaultValue` が代わりに使われます。

> 注意:
> 配列を `value` 属性の中に渡すことができます。これで、以下のように、 `select` タグの中で複数のオプションを選択することができます。 `<select multiple={true} value={['B', 'C']}>`
