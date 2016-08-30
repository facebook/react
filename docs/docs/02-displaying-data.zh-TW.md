---
id: displaying-data-zh-TW
title: Displaying Data
permalink: docs/displaying-data-zh-TW.html
prev: why-react-zh-TW.html
next: jsx-in-depth-zh-TW.html
---

在使用者介面所能做最基本的事情就是呈現資料. React讓呈現資料變得更加容易並且當資料有所變動時也能自動地讓使用者介面保持呈現最新的資料.

## 入門(Getting Started)

我們從一個相當簡單的範例開始. 建立一個名為 `hello-react.html` 的檔案裡面包含下列程式碼:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
    <script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
    <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

      // ** 將你的程式碼放在這裡! **

    </script>
  </body>
</html>
```

這份文件其他部份,我們將只會專注在JavaScript程式碼解說上,並且假設程式碼會被放置在如上述模板的註解區塊內. 用下列的JSX程式碼取代上述註解區塊:

```javascript
var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        Hello, <input type="text" placeholder="Your name here" />!
        It is {this.props.date.toTimeString()}
      </p>
    );
  }
});

setInterval(function() {
  ReactDOM.render(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```

## 反應性更新(Reactive Updates)

在一個瀏覽器上開啟檔案 `hello-react.html` 並且在文字區塊填入你的名字. 請注意React僅僅改變UI上的時間字串 — 你在文字區塊輸入的任何文字依舊存在, 即使你並沒有寫任何程式碼來管理這個行為.React可以為你分辨出這樣的行為並且做出正確的回應.

之所以能夠分辨出這樣的行為是因為React除非在真正有必要的情況下，否則不會對DOM做任何操作. **它使用一個快速的, 內部虛擬的DOM(internal mock DOM)來為你施行比較和計算最有效率的DOM變動(DOM mutation)**

輸入到元件(component)的內容我們稱為`props` — 是屬性("properties")的簡稱. 他們在JSX語法中作為傳遞屬性之用. 你應該把這些屬性當做元件中不可被改變的, 也就是說, **永遠不要對 `this.props` 做寫入的行為**.

## 元件就是函數(Components are Just Like Functions)

React元件(components)是非常簡單的. 你能把它們想成是簡單的函數帶入`props`和`state`(後面會討論這部份)並且呈送給HTML(render HTML). 在心中保持住這個想法, 就能容易理解元件(components).
React components are very simple. You can think of them as simple functions that take in `props` and `state` (discussed later) and render HTML. With this in mind, components are easy to reason about.

> 注意(Note):
>
> **一個局限性**: React元件(components)只能呈送(render)給一個單一根節點(root node). 如果你想要回傳多個節點(multiple nodes)他們*必須*被包裹在單一根節點內.

## JSX語法

我們深信元件(components)才是分離關注點(separate concerns)的正確方法, 而並非傳統的模板("templates")和顯示邏輯("display logic")觀念. 我們認為標記(markup)和產生它的程式碼應當緊密的綁在一起. 另外, 顯示邏輯(display logic)常常是非常複雜的, 若使用模板語言(template languages)來詮釋它就顯得笨重或累贅.

我們找到解決這個問題的最佳解答就是直接在JavaScript程式內產生HTML和元件樹(component trees)如此一來你就能使用真正的程式語言的表達能力(expressive power)來建立使用者介面(UIs).

為了能更輕鬆實現, 我們增加了一個非常簡單, **可選擇性使用的** 類似HTML的語法(HTML-like syntax) 來創建這些React樹節點(React tree nodes).

**JSX能讓你使用HTML語法來創建JavaScript物件.** 在React裡使用純JavaScript來產生一個鏈接(link)你可以這樣寫:

`React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Hello!')`

使用JSX語法則變成:

`<a href="https://facebook.github.io/react/">Hello!</a>`

我們發現這麼做能讓建立React apps更加容易並且設計師往往喜歡語法, 但是每個人都有他們自己的工作流程, 所以**在使用React時JSX並非必要.**

JSX非常簡單易懂. 若想要學習更多關於JSX, 請參閱 [JSX in depth](/react/docs/jsx-in-depth.html). 或是可以使用線上及時轉換工具 [the Babel REPL](https://babeljs.io/repl/).

JSX類似於HTML, 但不盡然完全相同. 參閱 [JSX gotchas](/react/docs/jsx-gotchas.html) 來比較一些主要的差異點.

[Babel exposes a number of ways to get started using JSX](http://babeljs.io/docs/setup/), 涵蓋從命令列工具到Ruby on Rails整合. 可以從中選擇最適合你的工具.

## React不使用JSX的範例(React without JSX)

JSX完全是可選擇性使用的; 你可以不拿JSX跟React一起使用. 你能在純粹的JavaScript環境中使用`React.createElement`來創建React元素(React elements), 它搭配一個標籤名(tag name)或是元件(component), 一個屬性物件(properties object), 和數個選擇性子參數(child arguments).

```javascript
var child1 = React.createElement('li', null, 'First Text Content');
var child2 = React.createElement('li', null, 'Second Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```

為了方便起見, 你能創建速記factory函式(short-hand factory functions)然後從自訂元件(custom components)建立元素(elements).

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

針對一般的HTML標籤React已經有內建的factories函式:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```
