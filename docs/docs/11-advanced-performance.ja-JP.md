---
id: advanced-performance
title: 先進的なパフォーマンス
permalink: advanced-performance-ja-JP.html
prev: perf-ja-JP.html
---

Reactをプロジェクトで使用しようとする際にまず最初に気になるのは、アプリケーションがReactを使用しないバージョンと比べて、同じくらい速くてレスポンシブであるかどうかということです。ステータスの変更毎にレスポンスでコンポーネントのサブツリーの全てを再度レンダリングするという考え方によって、このプロセスがパフォーマンスにネガティブな影響を与えるのではないかと人々は不安に思います。ReactはUIを更新するのに必要な、コストのかかる多くのDOMの操作を最小限にするためのいくつかの賢い技術を使用します。

## DOMを一致させることを防ぐこと

ReactはブラウザでレンダリングされるDOMのサブツリーの記述語である *virtual DOM* を使用しています。この2つの表現によってReactは、JavaScriptのオブジェクトの操作よりも遅い、DOMノードを作成したり存在しているDOMノードにアクセスすることを防いでいます。コンポーネントの `props` や `state` が変更された時、Reactは新しいvirtual DOMを構成して、それを古いものと比較することによって、実際のDOMの更新が必要かどうか決定します。それらが同じものでなかった場合にのみ、ReactはDOMを[一致](/react/docs/reconciliation.html)させ、最小限の変更を適用します。
この最上位で、Reactはコンポーネントライフサイクルファンクションである `shouldComponentUpdate` を提供します。これは、再度レンダリングを行うプロセス（virtual DOMの比較と起こり得る最終的なDOMの一致）が始まる前に誘発されます。そして、開発者にこのプロセスの循環を短くすることを可能にします。デフォルトのこの関数の実行時にはReactが更新を行って、以下のように `true` が返ります。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return true;
}
```

Reactがとても頻繁にこの関数を呼び出すので、実行が速いものである必要があることを頭に置いておいてください。

いくつかのチャットのスレッドを持つメッセージングのアプリケーションを持っていると仮定してください。そして、スレッドのうち1つだけが変更されたと考えてください。 `ChatThread` コンポーネントで `shouldComponentUpdate` を実行した際には、Reactは以下のように、他のスレッドのレンダリングステップをスキップできます。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  // TODO: 現在のチャットスレッドが以前のものと
  // 異なっているかどうかをリターンする。
}
```

つまり、要約すると、ReactはDOMのサブツリーを一致させる必要があるためにコストのかかるDOMの操作を実行するのを避けます。 `shouldComponentUpdate` を使用して、このプロセスを短縮することができます。そして、virtual DOMを比較して、更新すべきDOMだけを更新します。

## shouldComponentUpdate の実行

以下はコンポーネントのサブツリーです。1つ1つは `shouldComponentUpdate` が何をリターンするかとvirtual DOMが同じものであるかどうかを示しています。最終的には、円の色が、コンポーネントを一致させる必要があるかどうかを示しています。

<figure><img src="/react/img/docs/should-component-update.png" /></figure>

上記の例では、C2の上の `shouldComponentUpdate` が `false` を返しているので、Reactは新しいvirtual DOMを生成する必要はありません。そして、それゆえ、DOMを一致させる必要もありません。C4とC5についても、Reactが `shouldComponentUpdate` を実行する必要がないことに注意してください。

C1とC3の `shouldComponentUpdate` は `true` を返すので、Reactは葉の部分まで降りてそれらのチェックを行います。C6が `true` を返すので、virtual DOMが同じものではなくなり、DOMを一致させる必要があります。最後の興味深いケースはC8です。このノードについては、Reactはvirtual DOMを計算する必要がありますが、古いものと同じであるため、DOMと一致させる必要はありません。

ReactがDOMを変化させるのはC6だけであることに注意してください。これは避けられません。C8は、virtual DOMの比較から解放されています。C2のサブツリーとC7も同様です。`shouldComponentUpdate` から解放されているので、virtual DOMの比較を行う必要はありません。

それでは、私たちはどのように `shouldComponentUpdate` を実行すべきでしょうか？ある文字列の値をただレンダリングするコンポーネントの場合について見てみましょう。

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.string.isRequired
  },

  render: function() {
    return <div>this.props.value</div>;
  }
});
```

以下のように簡単に `shouldComponentUpdate` を実行することができます。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value !== nextProps.value;
}
```

これまでは順調でした。以上のような、単純なpropsやstateの構造を扱うことは簡単です。浅い同一性に基づいて実行したり、コンポーネントに組み込んだりもできます。実際、Reactはそのような実行のためのMixinを既に提供しています。[PureRenderMixin](/react/docs/pure-render-mixin-ja-JP.html)です。

しかし、コンポーネントのpropsやstateが変更される可能性がある場合はどうでしょうか？propが `bar` のような文字列ではなく、コンポーネント受け取ったものであると考えてみると、 `{ foo: 'bar' }` のような文字列を含んだJavaScriptのオブジェクトになります。

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.object.isRequired
  },

  render: function() {
    return <div>this.props.value.foo</div>;
  }
});
```

今までに述べてきた `shouldComponentUpdate` の実行は常に想定した通りに動くとは限りません。

```javascript
// this.props.value が { foo: 'bar' } であると仮定
// nextProps.value が { foo: 'bar' } であると仮定
// しかし、この参照は this.props.value とは異なります。
this.props.value !== nextProps.value; // true
```

問題は、 `shouldComponentUpdate` が、propが実際には変化していない場合にも `true` を返すことです。これを修正するために、以下のような代替の実行を行うことができます。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value.foo !== nextProps.value.foo;
}
```

基本的には、厳密に変更を追跡することを明確にするために、深い比較を行うことになります。パフォーマンスの点では、このアプローチはとてもコストがかかります。これは、それぞれのモデルに対して間違った深い同一性のコードを書いているであろうときには、スケールしません。その最上部では、オブジェクトの参照を注意深く見ていなければ、動作しさえしません。以下のコンポーネントが親から使用されていると考えてください。

```javascript
React.createClass({
  getInitialState: function() {
    return { value: { foo: 'bar' } };
  },

  onClick: function() {
    var value = this.state.value;
    value.foo += 'bar'; // アンチパターン！
    this.setState({ value: value });
  },

  render: function() {
    return (
      <div>
        <InnerComponent value={this.state.value} />
        <a onClick={this.onClick}>Click me</a>
      </div>
    );
  }
});
```

はじめに、内部のコンポーネントがレンダリングされます。それは、valueというプロパティとして `{ foo: 'bar' }` を保有します。ユーザがアンカーをクリックした際には、親のコンポーネントのstateが `{ value: { foo: 'barbar' } }` にアップデートされるでしょう。そして、新しいvalueのプロパティとして、 `{ foo: 'barbar' }` を受け取る、内部のコンポーネントの再レンダリングのプロセスのトリガーとなります。

問題は、親と内部のコンポーネントが同じオブジェクトへの参照を共有していることです。オブジェクトが `onClick` 関数の2行目で変更された時には、内部のコンポーネントが保有しているプロパティが変更されるでしょう。そのため、再レンダリングのプロセスが始まった時と、 `shouldComponentUpdate` が呼び出された時には、 `this.props.value.foo` は `nextProps.value.foo` と同じものになるでしょう。そのため、実際は、 `this.props.value` は `nextProps.value` と同じオブジェクトを参照します。

結果として、プロパティの変更と再レンダリングのプロセスを省略ができなかったので、UIは `'bar'` から `'barbar'` にアップデートされないでしょう。

## 助けとなるImmutable-js

[Immutable-js](https://github.com/facebook/immutable-js)はLee Byronによって作成されたJavaScriptのコレクションのライブラリです。Facebookが最近オープンソース化しました。これは、 *構造の共有* を通して、*不変の状態を保ち続ける* コレクションを提供します。以下のプロパティが何を意味するか見ていきましょう。

* *Immutable*: 一度作成されたら、コレクションは変更できません。
* *Persistent*: 新しいコレクションは以前のコレクションかsetのような変化によってのみ作成されます。元となるコレクションは新しいコレクションが作成された後も使用可能です。
* *Structural Sharing*: 新しいコレクションは元のコレクションとなるべく同じ構造を持って作成されます。パフォーマンスが効率的で許容できるものであるように、コピーを少なくします。新しいコレクションが元のものと同じである場合は、多くの場合元のものがリターンされます。

不変性によって、変更を追跡するコストが下がります。変更は常に新しいオブジェクトを生むので、オブジェクトの参照が変更されたかどうかを確認しさえすればよいのです。例えば、以下のような一般的なJavaScriptのコードにおいては、

```javascript
var x = { foo: "bar" };
var y = x;
y.foo = "baz";
x === y; // true
```

`y` は編集されていますが、`x` と同じオブジェクトを参照しているので、それらの比較は `true` を返します。しかし、以下のコードはimmutable-jsを使用すると以下のように記述されます。

```javascript
var SomeRecord = Immutable.Record({ foo: null });
var x = new SomeRecord({ foo: 'bar'  });
var y = x.set('foo', 'baz');
x === y; // false
```

このケースでは、 `x` を変更する時に新しい参照が返されているので、 `x` が変更されたことを安全に認識することができます。

変更を追跡する他の方法は、セッタによるフラグセットを保持することでダーティーチェックを行うことです。このアプローチの問題は、追加のコードを多く書いた場合やクラスの編集をいくつか行った場合でもセッタの使用が強制されることです。代わりに、変化の直前にオブジェクトをディープコピーし、変更が有ろうと無かろうと、その特定のために深い比較を行うことができます。このアプローチの問題は、ディープコピーと深い比較の両方とも、コストの高い操作であることです。

そのため、不変なデータ構造によって、オブジェクトの変更を追跡するためのコストの低く、冗長ではない方法が提供されます。私たちがすべきなのは `shouldComponentUpdate` を実行することだけです。それゆえ、immutable-jsに提供される抽象化を使用して、propsやstate属性を形作る場合は、 `PureRenderMixin` を使用して、パフォーマンスの向上を行うことができます。

## Immutable-js と Flux

[Flux](https://facebook.github.io/flux/)を使用している場合には、immutable-jsを使用して書き直すべきです。[API一覧](https://facebook.github.io/immutable-js/docs/#/)をご覧ください。

不変のデータ構造を使用したスレッドの例を形作る、ある方法を見ていきましょう。はじめに、形作ろうとしているエンティティのそれぞれに `Record` を定義する必要が有ります。Record はあるフィールドのセットの値を保持している、ただの不変なコンテナです。

```javascript
var User = Immutable.Record({
  id: undefined,
  name: undefined,
  email: undefined
});

var Message = Immutable.Record({
  timestamp: new Date(),
  sender: undefined,
  text: ''
});
```

`Record` 関数はオブジェクトが保有しているフィールドとデフォルトの値を定義するオブジェクトを受け取ります。

メッセージの *ストア* は以下のように2つのリストを使用して users と messages を追跡し続けることができます。

```javascript
this.users = Immutable.List();
this.messages = Immutable.List();
```

それぞれの *ペイロードの* 型を調査することはとても単純で、関数を実行するだけです。例えば、ストアが新しいメッセージを代表するペイロードを調べるときには、新しいレコードを作成し、それを以下のような messages のリストとして適用するだけです。

```javascript
this.messages = this.messages.push(new Message({
  timestamp: payload.timestamp,
  sender: payload.sender,
  text: payload.text
});
```

データ構造が不変であることで、push関数の結果を `this.messages` にアサインする必要があることに注意してください。

Reactの側では、 immutable-js のデータ構造をコンポーネントの state を保持するために使用する場合は、 `PureRenderMixin` をコンポーネントにミックスし、再レンダリングのプロセスを短縮することもできます。
