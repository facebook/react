function insertCSS (text) {
  var cssEl = document.createElement('style')
  cssEl.textContent = text.trim()
  document.head.appendChild(cssEl)
}

const duration = process.env.TRANSITION_DURATION || 50
const buffer = process.env.TRANSITION_BUFFER || 10
let injected = false

export default function injectStyles () {
  if (injected) return { duration, buffer }
  injected = true
  insertCSS(`
    .test {
      -webkit-transition: opacity ${duration}ms ease;
      transition: opacity ${duration}ms ease;
    }
    .group-move {
      -webkit-transition: -webkit-transform ${duration}ms ease;
      transition: transform ${duration}ms ease;
    }
    .v-appear, .v-enter, .v-leave-active,
    .test-appear, .test-enter, .test-leave-active,
    .hello, .bye.active,
    .changed-enter {
      opacity: 0;
    }
    .test-anim-enter-active {
      animation: test-enter ${duration}ms;
      -webkit-animation: test-enter ${duration}ms;
    }
    .test-anim-leave-active {
      animation: test-leave ${duration}ms;
      -webkit-animation: test-leave ${duration}ms;
    }
    .test-anim-long-enter-active {
      animation: test-enter ${duration * 2}ms;
      -webkit-animation: test-enter ${duration * 2}ms;
    }
    .test-anim-long-leave-active {
      animation: test-leave ${duration * 2}ms;
      -webkit-animation: test-leave ${duration * 2}ms;
    }
    @keyframes test-enter {
      from { opacity: 0 }
      to { opacity: 1 }
    }
    @-webkit-keyframes test-enter {
      from { opacity: 0 }
      to { opacity: 1 }
    }
    @keyframes test-leave {
      from { opacity: 1 }
      to { opacity: 0 }
    }
    @-webkit-keyframes test-leave {
      from { opacity: 1 }
      to { opacity: 0 }
    }
  `)
  return { duration, buffer }
}

