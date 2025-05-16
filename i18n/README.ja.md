# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React は、ユーザーインターフェイスを構築するための JavaScript ライブラリです。

* **宣言的:** React はインタラクティブな UI を簡単に作成できるようにします。アプリケーションの各状態に対してシンプルなビューをデザインし、データが変化すると React が適切なコンポーネントを効率的に更新してレンダリングします。宣言的なビューはコードを予測可能で、理解しやすく、デバッグも簡単にします。
* **コンポーネントベース:** 独立した状態を管理するコンポーネントを作成し、それらを組み合わせて複雑な UI を構築します。コンポーネントロジックはテンプレートではなく JavaScript で記述されるため、アプリケーション内でリッチなデータを簡単に渡し、状態を DOM から分離できます。
* **一度学べばどこでも使用可能:** React は他の技術スタックについて仮定を行わないため、既存のコードを変更せずに新しい機能を React で開発できます。また、React は [Node](https://nodejs.org/en) を使用してサーバー側でレンダリングしたり、[React Native](https://reactnative.dev/) を使用してモバイルアプリをサポートすることもできます。

[プロジェクトで React を使用する方法を学ぶ](https://react.dev/learn)。

## インストール

React は最初から段階的な採用を念頭に設計されており、**必要に応じて少しだけまたは多くの React を使用できます:**

* [クイックスタート](https://react.dev/learn) を使用して React の感触を掴む。
* [既存のプロジェクトに React を追加](https://react.dev/learn/add-react-to-an-existing-project) して、必要に応じて少しまたは多くの React を使用する。
* [新しい React アプリを作成](https://react.dev/learn/start-a-new-react-project) する場合、強力な JavaScript ツールチェーンを探している場合に最適です。

## ドキュメント

React のドキュメントは [公式サイト](https://react.dev/) にあります。

[クイックスタート](https://react.dev/learn) ページを見て、概要を素早く把握してください。

ドキュメントは以下のセクションに分かれています：

* [クイックスタート](https://react.dev/learn)
* [チュートリアル](https://react.dev/learn/tutorial-tic-tac-toe)
* [React の考え方](https://react.dev/learn/thinking-in-react)
* [インストール](https://react.dev/learn/installation)
* [UI の記述](https://react.dev/learn/describing-the-ui)
* [インタラクティブ性の追加](https://react.dev/learn/adding-interactivity)
* [状態の管理](https://react.dev/learn/managing-state)
* [高度なガイド](https://react.dev/learn/escape-hatches)
* [API リファレンス](https://react.dev/reference/react)
* [サポートを得る場所](https://react.dev/community)
* [コントリビューションガイド](https://legacy.reactjs.org/docs/how-to-contribute.html)

ドキュメントを改善するには、[このリポジトリ](https://github.com/reactjs/react.dev) にプルリクエストを送信してください。

## サンプル

[公式サイト](https://react.dev/) にはいくつかのサンプルがあります。以下は最初のサンプルです：

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

このサンプルは、ページ上のコンテナに "Hello Taylor" をレンダリングします。

HTML に似た構文を使用していることに気づくでしょう；[これを JSX と呼びます](https://react.dev/learn#writing-markup-with-jsx)。JSX は React を使用するために必須ではありませんが、コードをより読みやすくし、HTML を書くような感覚で書くことができます。

## コントリビューション

このリポジトリの主な目的は、React コアを継続的に進化させ、より高速で使いやすくすることです。React の開発は GitHub 上でオープンに行われており、バグ修正や改善へのコミュニティの貢献に感謝しています。以下を読んで、React の改善に参加する方法を学んでください。

### [行動規範](https://code.fb.com/codeofconduct)

Facebook は行動規範を採用しており、プロジェクト参加者にこれを遵守することを期待しています。[全文](https://code.fb.com/codeofconduct) を読み、どのような行動が許容され、どのような行動が許容されないかを理解してください。

### [コントリビューションガイド](https://legacy.reactjs.org/docs/how-to-contribute.html)

[コントリビューションガイド](https://legacy.reactjs.org/docs/how-to-contribute.html) を読んで、開発プロセス、バグ修正や改善の提案方法、React の変更を構築およびテストする方法について学んでください。

### [初心者向けの課題](https://github.com/facebook/react/labels/good%20first%20issue)

足を濡らし、コントリビューションプロセスに慣れるのを助けるために、[初心者向けの課題リスト](https://github.com/facebook/react/labels/good%20first%20issue) があります。これらは比較的範囲が限られたバグが含まれています。素晴らしい出発点です。

### ライセンス

React は [MIT ライセンス](./LICENSE) の下でライセンスされています。
