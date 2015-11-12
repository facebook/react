---
id: multiple-components
title: 複数のコンポーネント
permalink: multiple-components-ja-JP.html
prev: interactivity-and-dynamic-uis-ja-JP.html
next: reusable-components-ja-JP.html
---

今まで、データを表示したりユーザの入力をハンドルするための1つのコンポーネントの書き方を見てきました。次に、 Reactの最も面白い特徴であるコンポーザビリティについて見ていきましょう。

## 動機: 関心の分離

うまく定義されたインターフェースとともに他のコンポーネントを再利用するモジュールのコンポーネントを構築することによって、関数やクラスを使う場合と同じ利益を得ることができます。特に、アプリの *異なった関心を分離* できるにも関わらず、新しいコンポーネントを単純に構築することで満足する場合には。アプリケーションにカスタムコンポーネントライブラリを構築することによって、あなたがやりたいことに最も合う方法でUIを表現することができます。

## 構成例

FacebookのグラフAPIを使って、プロフィール画像とユーザー名を表示する単純なアバターのコンポーネントを作ってみましょう。

```javascript
var Avatar = React.createClass({
  render: function() {
    return (
      <div>
        <ProfilePic username={this.props.username} />
        <ProfileLink username={this.props.username} />
      </div>
    );
  }
});

var ProfilePic = React.createClass({
  render: function() {
    return (
      <img src={'https://graph.facebook.com/' + this.props.username + '/picture'} />
    );
  }
});

var ProfileLink = React.createClass({
  render: function() {
    return (
      <a href={'https://www.facebook.com/' + this.props.username}>
        {this.props.username}
      </a>
    );
  }
});

ReactDOM.render(
  <Avatar username="pwh" />,
  document.getElementById('example')
);
```


## 所有

上記の例では、 `Avatar` のインスタンスは  `ProfilePic` と `ProfileLink` のインスタンスを *所有* しています。Reactでは、 **所有者は、他のコンポーネントの `props` をセットするコンポーネントです。** 正式に言うと、もし `Y` コンポーネントの `render()` メソッドの中に `X` コンポーネントが作られた場合、 `X` は `Y` に所有されていると言います。以前述べたように、コンポーネントはそれ自身の `props` を変化させることはできません。 `props` は常に、所有者が彼らにセットしたものと一貫性があります。このキー要素は一貫性があることを保証するために、UIに反映されます。

所有者と所有される側の関係と、親子の関係の違いを示すのは重要です。所有者と所有される側の関係はReact独特です。一方で、親子の関係は単純にDOMから分かる、愛すべき関係です。上の例では、 `Avatar` は `div` を所有しますが、 `ProfilePic` と `ProfileLink` インスタンスと、 `div` は  `ProfilePic` と `ProfileLink`インスタンスの **親** (しかし、所有者ではありません)です。


## 子

Reactのコンポーネントのインスタンスを作成する時には、以下のように開始タグと終了タグの間に付加的なReactのコンポーネントやJavaScriptの表現を含めることができます。

```javascript
<Parent><Child /></Parent>
```

`Parent` は特別な  `this.props.children` というプロパティでアクセスすることで、子要素を読み取ることができます。 **`this.props.children` は不透明なデータ構造です。** 操作するには[React.Children utilities](/react/docs/top-level-api.html#react.children)を使用してください。


### 子要素の調和

**調和はReactが新しいレンダリングのパスごとにDOMをアップデートするプロセスです。** 一般的に、子要素はレンダリングされる順序に従って調和します。例えば、2つのレンダリングパスを考えると、以下のそれぞれのマークアップが生成されます。

```html
// パス1のレンダリング
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// パス2のレンダリング
<Card>
  <p>Paragraph 2</p>
</Card>
```

直感的には、 `<p>Paragraph 1</p>` が削除されたように思えます。代わりに、Reactは1つ目の子要素のテキストコンテンツを変更し、最後の子要素を削除するという変更を加えることでDOMを調和させます。Reactは子要素の *順序* に従って調和するのです。



### ステートフルな子要素

多くのコンポーネントにとって、これは大きな処理ではありません。しかし、レンダリングのパスを超えて、 `this.state` にデータを保持しているステートフルなコンポーネントにとっては、これはとても問題になり得ます。

多くのケースにおいては、以下のように、削除する代わりに要素を隠すことで回避することがあります。

```html
// パス1のレンダリング
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// パス2のレンダリング
<Card>
  <p style={{'{{'}}display: 'none'}}>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
```


### 動的な子要素

子要素がシャッフルされているような時（検索結果のように）や、リストの最初に新しいコンポーネントが追加されるような時（ストリームのように）には、状況はさらに複雑になります。そういったケースでは、それぞれの子要素のアイデンティティやstateがレンダリングパスを保持する必要があり、以下のように `key` を認識することでそれぞれの子要素をただ1つに識別できます。

```javascript
  render: function() {
    var results = this.props.results;
    return (
      <ol>
        {results.map(function(result) {
          return <li key={result.id}>{result.text}</li>;
        })}
      </ol>
    );
  }
```

Reactがキー付けされた子要素を調和させるとき、 `key` と子要素が再び整理される（けんかをする代わりに）か削除されます（再利用される代わりに）。

`key` は以下のように *常に* 配列の中でコンポーネントに直接提供されるべきで、その配列の中でそれぞれのコンポーネントのHTMLの子要素の入れ物に提供されるべきではありません。

```javascript
// 間違い！
var ListItemWrapper = React.createClass({
  render: function() {
    return <li key={this.props.data.id}>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
          return <ListItemWrapper data={result}/>;
        })}
      </ul>
    );
  }
});

// 正解 :)
var ListItemWrapper = React.createClass({
  render: function() {
    return <li>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
           return <ListItemWrapper key={result.id} data={result}/>;
        })}
      </ul>
    );
  }
});
```

Reactのフラグのオブジェクトを渡すことで子要素をキー付けすることもできます。詳細は、[キー付けされたフラグ](create-fragment.html)をご覧ください。

## データフロー

Reactの、 `props` を通した所有者から所有されるコンポーネントへのデータフローは今までに記述してきました。これは実際には一方向のデータバインディングです。所有者は所有しているコンポーネントのpropsを、所有者が `props` か `state` に基づいて計算したいくつかの値にバインドします。このプロセスが何度も行われるので、データの変更は彼らが使われるところは自動的にどこでも反映されます。

## パフォーマンスの注意

みなさんは所有者の下にたくさんのノードがあるときには、データの変更には多くのコストがかかると考えるでしょう。良いニュースとして、JavaScriptは早く、 `render()` メソッドはとても単純になりやすいので、多くのアプリケーションにおいて、こういったことは非常に早くなります。加えて、ボトルネックとなるものの多くは、JSの実行ではなく、DOMの変更です。Reactは変更の一括処理と検知を使うことによって、それを最適化しています。

しかし、パフォーマンスについて、よりよい制御を持つことを求める時もあるでしょう。こういったケースで、Reactがサブツリーの処理をスキップすることを求めるなら、 `shouldComponentUpdate()` が単純にfalseを返すようにオーバーライドしてください。更に情報を得たい場合には、[Reactのリファレンス文書](/react/docs/component-specs.html)を読んでください。

> 注意:
> `shouldComponentUpdate()` がデータが実際に変わった時にfalseを返したならば、ReactはUIを同期的に保つことができません。このメソッドを使う際には、何を行っているか理解してください。そして、顕著なパフォーマンスの問題がある時にだけ、この関数を使ってください。DOMと比較して、JavaScriptが速いことを過小評価しないでください。
