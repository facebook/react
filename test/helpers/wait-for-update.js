import Vue from 'vue'

// helper for async assertions.
// Use like this:
//
// vm.a = 123
// waitForUpdate(() => {
//   expect(vm.$el.textContent).toBe('123')
//   vm.a = 234
// })
// .then(() => {
//   // more assertions...
// })
// .then(done)
window.waitForUpdate = initialCb => {
  let end
  const queue = initialCb ? [initialCb] : []

  function shift () {
    const job = queue.shift()
    if (queue.length) {
      let hasError = false
      try {
        job.wait ? job(shift) : job()
      } catch (e) {
        hasError = true
        const done = queue[queue.length - 1]
        if (done && done.fail) {
          done.fail(e)
        }
      }
      if (!hasError && !job.wait) {
        if (queue.length) {
          Vue.nextTick(shift)
        }
      }
    } else if (job && (job.fail || job === end)) {
      job() // done
    }
  }

  Vue.nextTick(() => {
    if (!queue.length || (!end && !queue[queue.length - 1].fail)) {
      throw new Error('waitForUpdate chain is missing .then(done)')
    }
    shift()
  })

  const chainer = {
    then: nextCb => {
      queue.push(nextCb)
      return chainer
    },
    thenWaitFor: (wait) => {
      if (typeof wait === 'number') {
        wait = timeout(wait)
      }
      wait.wait = true
      queue.push(wait)
      return chainer
    },
    end: endFn => {
      queue.push(endFn)
      end = endFn
    }
  }

  return chainer
}

function timeout (n) {
  return next => setTimeout(next, n)
}
