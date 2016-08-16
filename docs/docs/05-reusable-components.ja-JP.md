---
id: reusable-components
title: 再利用可能なコンポーネント
permalink: docs/reusable-components-ja-JP.html
prev: multiple-components-ja-JP.html
next: transferring-props-ja-JP.html
---

インターフェースをデザインするとき、明確に定義されたインターフェースでは共通のデザイン要素（ボタン、フォームフィールド、レイアウトコンポーネントなど）を再利用可能なコンポーネントにブレークダウンします。そのような方法をとることで、次にUIを作成する必要があるときに、書くコードが少なくて済みます。これは、開発速度を上げ、バグを減らし、導線を減らすことを意味します。

## Propのバリデーション

アプリが大きくなっていくにつれて、コンポーネントが正しく使われていることを保証することが役に立つようになります。`propTypes` を指定することでそういったことができるようになります。`React.PropTypes` はあなたが受け取ったデータが正しいことを認識するのに使われるバリデータを出力します。不正な値がpropに渡されたときは、警告がJavaScriptコンソールに表示されます。パフォーマンスの点で、 `propTypes` は開発モードでのみチェックされることに注意してください。異なるバリデータが提供された際の例を表すドキュメントは以下の通りです。

```javascript
React.createClass({
  propTypes: {
    // propがJSのプリミティブ型であると宣言できます。
    // デフォルトで、以下は全てオプションです。
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,
    optionalSymbol: React.PropTypes.symbol,

    // 何でもレンダリングできます。number、string、要素やそれらを含む配列など。
    optionalNode: React.PropTypes.node,

    // Reactの要素。
    optionalElement: React.PropTypes.element,

    // propがクラスのインスタンスであるとの宣言もできます。
    // JSのinstanceofオペレータを使用しています。
    optionalMessage: React.PropTypes.instanceOf(Message),

    // 以下をenumとして扱うことで、propがある値であると保証できます。
    optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

    // たくさんの型のうちのひとつになりうるオブジェクト
    optionalUnion: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(Message)
    ]),

    // ある型の配列
    optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

    // プロパティの値がある型のものであるオブジェクト
    optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

    // 特定の形をとるオブジェクト
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // `isRequired` は上記のどの値にも繋げることができますが、
    // propが提供されなかったときには警告が出ることに注意してください。
    requiredFunc: React.PropTypes.func.isRequired,

    // どのようなデータ型の値でも大丈夫です
    requiredAny: React.PropTypes.any.isRequired,

    // バリデータをカスタマイズすることもできます。
    // 以下はバリデーションが落ちた時にはエラーを返します。
    // `oneOfType` の中で動かなくなるので、 `console.warn` や throw はしないでください。
    customProp: function(props, propName, componentName) {
      if (!/matchme/.test(props[propName])) {
        return new Error('Validation failed!');
      }
    }
  },
  /* ... */
});
```


## デフォルトのPropの値

Reactは以下のように、とても宣言的な方法で `props` のデフォルト値を定義できます。

```javascript
var ComponentWithDefaultProps = React.createClass({
  getDefaultProps: function() {
    return {
      value: 'default value'
    };
  }
  /* ... */
});
```

`getDefaultProps()` の結果は `this.props.value` が親コンポーネントで制限されなかった場合に値を保証するためにキャッシュされて使われます。これによって、自分自身でハンドルするための壊れやすいコードを何度も書くことなくpropsをただ安全に使うことができます。

## Propsの移動: ショートカット

Reactのコンポーネントに共通しているのは、単純な方法で基本的なHTML要素を拡張していることです。よく、
コンポーネントに渡されるHTML属性を、型付けを守るために、基本的なHTML要素にコピーしたいと考える人もいます。このようなことを行うために、JSXの _拡張された_ シンタックスを使うことができます。

```javascript
var CheckLink = React.createClass({
  render: function() {
    // 以下はCheckLinkに渡されたどんなpropsをとることができ、<a>タグにコピーすることもできます。
    return <a {...this.props}>{'√ '}{this.props.children}</a>;
  }
});

ReactDOM.render(
  <CheckLink href="/checked.html">
    Click here!
  </CheckLink>,
  document.getElementById('example')
);
```

## 単一の子要素

`React.PropTypes.element` を使って、childrenとしてコンポーネントにただ一つの子要素が渡されるよう制限できます。

```javascript
var MyComponent = React.createClass({
  propTypes: {
    children: React.PropTypes.element.isRequired
  },

  render: function() {
    return (
      <div>
        {this.props.children} // これは1つの要素でなくてはなりません。さもなければエラーがthrowされます。
      </div>
    );
  }

});
```

## ミックスイン

コンポーネントはReactでコードを再利用する最良の方法ですが、全く異なったコンポーネントが共通の機能性を共有することもあります。それらは[横断的関心事](https://en.wikipedia.org/wiki/Cross-cutting_concern)と呼ばれることもあります。Reactはこの問題を解決するために、 `mixins` を提供しています。

共通のユースケースとしては、時間の間隔によって、コンポーネントにそれ自身をアップデートさせたい場合があります。 `setInterval()` を使うのは簡単ですが、メモリをセーブするためにもう必要でなくなった場合にはインターバルをキャンセルすることが重要です。Reactは[ライフサイクルメソッド](/react/docs/working-with-the-browser.html#component-lifecycle)を提供しており、コンポーネントが作成されようとしたり削除されようとした時にそれを検知することができます。コンポーネントが削除されたときに自動的にクリーンアップしてくれる、簡単な `setInterval()` 関数を提供する以下のようなメソッドを使って単純なミックスインを作成してみましょう。

```javascript
var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.forEach(clearInterval);
  }
};

var TickTock = React.createClass({
  mixins: [SetIntervalMixin], // ミックスインを使う
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); // ミックスインのメソッドを呼ぶ
  },
  tick: function() {
    this.setState({seconds: this.state.seconds + 1});
  },
  render: function() {
    return (
      <p>
        React has been running for {this.state.seconds} seconds.
      </p>
    );
  }
});

ReactDOM.render(
  <TickTock />,
  document.getElementById('example')
);
```

ミックスインの素晴らしい特徴はコンポーネントが複数のミックスインを使っていて、いくつかのミックスインが同じライフサイクルメソッドを定義している場合（すなわち、コンポーネントが削除された際に幾つかのミックスインがクリーンアップを行いたい場合）に、すべてのライフサイクルメソッドが呼ばれることを保証することです。ミックスインで定義されたメソッドは、ミックスインが並んでいる順番に走り、コンポーネントのメソッド呼び出しで呼ばれます。

## ES6のクラス

ReactのクラスをただのJavaScriptのクラスとして定義することもできます。例えば、ES6 のクラスシンタックスを使うと、以下のようになります。

```javascript
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

APIは `getInitialState` という例外を除き、 `React.createClass` と同じです。APIが異なっている `getInitialState` メソッドを提供する代わりに、コンストラクタの中に `state` プロパティをセットします。

他の違いは、 `propTypes` と `defaultProps` はクラスのボディに定義される代わりにコンストラクタにプロパティとして定義されます。

```javascript
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: props.initialCount};
  }
  tick() {
    this.setState({count: this.state.count + 1});
  }
  render() {
    return (
      <div onClick={this.tick.bind(this)}>
        Clicks: {this.state.count}
      </div>
    );
  }
}
Counter.propTypes = { initialCount: React.PropTypes.number };
Counter.defaultProps = { initialCount: 0 };
```

### オートバインディングしません

メソッドは標準のES6のクラスと同じ仕様です。それは、 `this` をインスタンスに自動的にバインドしないことを意味します。明確に `.bind(this)` を使うか [アロー関数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/) `=>` を使ってください。

### ミックスインはありません

不幸なことに、ES6はミックスインのサポートを行いません。それゆえ、ReactをES6のクラスと一緒に使う際にはミックスインのサポートはありません。代わりに、ミックスインに頼ることなくそれらのユースケースをサポートするのが簡単になるよう努力しています。
