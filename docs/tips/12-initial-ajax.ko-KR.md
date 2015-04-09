---
id: initial-ajax-ko-KR
title: AJAX를 통해 초기 데이터 읽어오기
layout: tips
permalink: initial-ajax-ko-KR.html
prev: dom-event-listeners-ko-KR.html
next: false-in-jsx-ko-KR.html
---

`componentDidMount`에서 데이터를 가져옵니다. 응답이 올 때 데이터가 state에 저장되고 렌더링을 시작하여 UI를 갱신합니다.

비동기 요청의 응답을 처리하여 state를 변경하기 전에, 컴포넌트가 여전히 마운트되었는지를 확인하기 위해 `this.isMounted()`를 사용합니다.

이 예제는 희망하는 Github 사용자의 최근 gist를 가져옵니다.

```js
var UserGist = React.createClass({
  getInitialState: function() {
    return {
      username: '',
      lastGistUrl: ''
    };
  },

  componentDidMount: function() {
    $.get(this.props.source, function(result) {
      var lastGist = result[0];
      if (this.isMounted()) {
        this.setState({
          username: lastGist.owner.login,
          lastGistUrl: lastGist.html_url
        });
      }
    }.bind(this));
  },

  render: function() {
    return (
      <div>
        {this.state.username}'s last gist is
        <a href={this.state.lastGistUrl}>here</a>.
      </div>
    );
  }
});

React.render(
  <UserGist source="https://api.github.com/users/octocat/gists" />,
  mountNode
);
```
