---
id: working-with-the-browser
title: ブラウザと動くこと
permalink: docs/working-with-the-browser-ja-JP.html
prev: forms-ja-JP.html
next: more-about-refs-ja-JP.html
---

Reactはほとんどのケースで、DOMを直接触ることからあなたを解放するパワフルな抽象性を提供します。しかし、単純に根本的なAPIにアクセスする必要がある場合もあります。サードパーティのライブラリや現存するコードと動かす必要があるかもしれません。

## 仮想DOM

ReactはDOMと直接対話を行わないため、とても速いです。Reactは速いメモリ上のDOMの表現を持っています。 `render()` メソッドはDOMの *記述* をリターンします。Reactはこの記述とメモリ上の表現のdiffをとることができ、ブラウザを更新する最速の方法を計算することができます。

加えて、Reactはブラウザ依存があるにも関わらず、W3Cの使用に則っていると保証されているイベントオブジェクトのような、完全に合成されたイベントシステムを実行します。HTML5のイベントをIE8で使うこともできます！

パフォーマンスが優れており、簡単であると思われるので、ほとんどの場合、Reactの「偽のブラウザ」を使うべきです。しかし、jQueryプラグインのようなサードパーティのライブラリと動かすかもしれません。基本的なAPIに単純にアクセスする必要がある時もあります。Reactは基本的なDOMのAPIを直接使うための脱出口を提供しています。

## 参照とfindDOMNode()

ブラウザと相互に影響するために、DOMノードへの参照が必要になるでしょう。ReactはコンポーネントのDOMノードへの参照を得ることができる `ReactDOM.findDOMNode(component)` 関数を持っています。

> 注意:
> `findDOMNode()` はマウントされたコンポーネントの上でのみ動きます（これは、DOMに配置されたコンポーネントという意味です）。まだマウントされていない（まだ作成されていないコンポーネントの上で `render()` の `findDOMNode()` を呼ぶようなものです）コンポーネントの上でこれを呼ぼうとした場合、例外がスローされます。

Reactのコンポーネントへの参照を得るためには、現在のReactコンポーネントを得るために `this` を使ったり、あなたがオーナーのコンポーネントを表す参照を使ったりできます。それらは、以下のように動きます。

```javascript
var MyComponent = React.createClass({
  handleClick: function() {
    // 生のDOMのAPIを使ってテキスト入力に明確にフォーカスします。
    ReactDOM.findDOMNode(this.refs.myTextInput).focus();
  },
  render: function() {
    // この参照属性はコンポーネントがマウントされた時に、
    // this.refs のコンポーネントへの参照を追加します。
    return (
      <div>
        <input type="text" ref="myTextInput" />
        <input
          type="button"
          value="Focus the text input"
          onClick={this.handleClick}
        />
      </div>
    );
  }
});

ReactDOM.render(
  <MyComponent />,
  document.getElementById('example')
);
```


## 参照に関しての詳細

参照に関して、詳細に学ぶためと、効率的にそれらを使う方法については、[参照に関しての詳細](/react/docs/more-about-refs.html)ドキュメントを読んでください。


## コンポーネントライフサイクル

コンポーネントは以下のように、ライフサイクルの3つのパートを持っています

* **マウンティング:** コンポーネントはDOMにインサートされます。
* **アップデーティング:** DOMがアップデートする必要があるとき、コンポーネントを決定するために再度レンダリングされます。
* * **アンマウンティング:** コンポーネントはDOMから削除されます。

Reactは上記のプロセスになるように指定できるライフサイクルメソッドを提供します。私たちは何かが起こる直前に呼ばれる **未来の** メソッドと何かが起こった直後に呼ばれる **過去の** メソッドを使うことができます。

### マウンティング

* `getInitialState(): object` はコンポーネントがマウントされる前に実行されます。ステートフルなコンポーネントはこのメソッドをインプリメントする必要があり、最初のstateのデータをリターンする必要があります。
* `componentWillMount()` はマウンティングが起きる直前に実行されます。
* `componentDidMount()` はマウンティングが起きた直後に実行されます。DOMノードを必要とする初期化はここで行われるべきです。

### アップデーティング

* `componentWillReceiveProps(object nextProps)` はマウントされたコンポーネントが新しいpropsを受け取ったときに実行されます。このメソッドは `this.setState()` を使ったstateの変更を実行するために `this.props` と `nextProps` とを比較するのに使われるべきです。
* `shouldComponentUpdate(object nextProps, object nextState): boolean` は何かしらの変更がDOMをアップデートしなければいけないかどうかコンポーネントが決めるときに実行されます。このメソッドを `this.props` と `nextProps` そして `this.state` と `nextState` の比較の最適化のために実行してください。そして、Reactがアップデートをスキップするべきときには `false` を返してください。
* `componentWillUpdate(object nextProps, object nextState)` はアップデーティングが発生する直前に実行されます。ここで `this.setState()` を呼ぶことはできません。
* `componentDidUpdate(object prevProps, object prevState)` はアップデーティングが発生した直後に実行されます。

### アンマウンティング

* `componentWillUnmount()` はコンポーネントがアンマウントされ、削除される直前に実行されます。クリーンアップはここで行われるべきです。

### マウントのメソッド

_マウントされた_ 複合的なコンポーネントも以下のようなメソッドをサポートします。

* `findDOMNode(): DOMElement` はレンダリングされたDOMノードへの参照を得るために、どのマウントされたコンポーネントの上でも実行されます。
* `forceUpdate()` は `this.setState()` を使うことなくコンポーネントのstateが変更された際にさらにその詳細について知るときにどのマウントされたコンポーネントの上でも実行されます。

## ブラウザのサポートとポリフィル

Facebookでは、IE8を含む古いブラウザをサポートしています。私たちは将来に向けたJSを書くことができるように、長い間ポリフィルを使ってきました。これは、私たちのコードベースにたくさんの処理が散らばり、「ただ動くだけの」コードであることを予想することしかできないことを意味します。例えば、 `+new Date()` を見る代わりに、  `Date.now()` と記述しています。オープンソースであるReactを私たちは内部で使っているので、将来に向けたJSを使うという哲学を持ち越しています。

この哲学に加えて、私たちはJSのライブラリの作者として、ライブラリの一部としてポリフィルを含めるべきではないというスタンスをとっています。全てのライブラリがこのようなことを行ったなら、死んだコードの大きな塊になりうる同じポリフィルを何度も記述しなくてもよくなるでしょう。あなたのプロダクトが古いブラウザをサポートする必要があるなら、[es5-shim](https://github.com/es-shims/es5-shim)のようなものを使うことにチャンスがあるでしょう。

### ポリフィルは古いブラウザをサポートする必要があります

[kriskowal's es5-shim](https://github.com/es-shims/es5-shim) の `es5-shim.js` はReactが必要とする以下のようなものを提供します。

* `Array.isArray`
* `Array.prototype.every`
* `Array.prototype.forEach`
* `Array.prototype.indexOf`
* `Array.prototype.map`
* `Date.now`
* `Function.prototype.bind`
* `Object.keys`
* `String.prototype.split`
* `String.prototype.trim`

[kriskowal's es5-shim](https://github.com/es-shims/es5-shim)の `es5-sham.js` もまたReactが必要とする以下のようなものを提供します。

* `Object.create`
* `Object.freeze`

小さくされていないReactのビルドは[paulmillr's console-polyfill](https://github.com/paulmillr/console-polyfill)にある以下のようなものを必要とします。

* `console.*`

`<section>` 、 `<article>` 、 `<nav>` 、 `<header>` 、 `<footer>` を含むHTML5の要素をIE8で使うときには、[html5shiv](https://github.com/aFarkas/html5shiv)か、似たようなスクリプトをインクルードする必要があります。

### クロスブラウザの問題

Reactはブラウザ間の違いを抽象化することにおいてとても優れていますが、一時的な解決ができない、制限や独特な動作をするブラウザもあります。

#### IE8のonScrollイベント

IE8では `onScroll` イベントは発火せず、イベントのフェーズをキャプチャするハンドラを定義するAPIを持っていません。それは、Reactがそれらのイベントを検知する方法が無いということを意味します。現状、IE8ではこのイベントは無視されています。

詳細な情報については、GitHubのイシューである[onScrollがIE8で動かない](https://github.com/facebook/react/issues/631)を参照してください。

