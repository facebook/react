import Vue from 'vue'
import { looseEqual } from 'shared/util'

// Android 4.4 Chrome 30 has the bug that a multi-select option cannot be
// deselected by setting its "selected" prop via JavaScript.
function hasMultiSelectBug () {
  var s = document.createElement('select')
  s.setAttribute('multiple', '')
  var o = document.createElement('option')
  s.appendChild(o)
  o.selected = true
  o.selected = false
  return o.selected !== false
}

/**
 * setting <select>'s value in IE9 doesn't work
 * we have to manually loop through the options
 */
function updateSelect (el, value) {
  var options = el.options
  var i = options.length
  while (i--) {
    if (looseEqual(getValue(options[i]), value)) {
      options[i].selected = true
      break
    }
  }
}

function getValue (option) {
  return '_value' in option
    ? option._value
    : option.value || option.text
}

describe('Directive v-model select', () => {
  it('should work', done => {
    const vm = new Vue({
      data: {
        test: 'b'
      },
      template:
        '<select v-model="test">' +
          '<option>a</option>' +
          '<option>b</option>' +
          '<option>c</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.test).toBe('b')
    expect(vm.$el.value).toBe('b')
    expect(vm.$el.childNodes[1].selected).toBe(true)
    vm.test = 'c'
    waitForUpdate(function () {
      expect(vm.$el.value).toBe('c')
      expect(vm.$el.childNodes[2].selected).toBe(true)
      updateSelect(vm.$el, 'a')
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toBe('a')
    }).then(done)
  })

  it('should work with value bindings', done => {
    const vm = new Vue({
      data: {
        test: 2
      },
      template:
        '<select v-model="test">' +
          '<option value="1">a</option>' +
          '<option :value="2">b</option>' +
          '<option :value="3">c</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.$el.value).toBe('2')
    expect(vm.$el.childNodes[1].selected).toBe(true)
    vm.test = 3
    waitForUpdate(function () {
      expect(vm.$el.value).toBe('3')
      expect(vm.$el.childNodes[2].selected).toBe(true)

      updateSelect(vm.$el, '1')
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toBe('1')

      updateSelect(vm.$el, '2')
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toBe(2)
    }).then(done)
  })

  it('should work with value bindings (object loose equal)', done => {
    const vm = new Vue({
      data: {
        test: { a: 2 }
      },
      template:
        '<select v-model="test">' +
          '<option value="1">a</option>' +
          '<option :value="{ a: 2 }">b</option>' +
          '<option :value="{ a: 3 }">c</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.$el.childNodes[1].selected).toBe(true)
    vm.test = { a: 3 }
    waitForUpdate(function () {
      expect(vm.$el.childNodes[2].selected).toBe(true)

      updateSelect(vm.$el, '1')
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toBe('1')

      updateSelect(vm.$el, { a: 2 })
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toEqual({ a: 2 })
    }).then(done)
  })

  it('should work with value bindings (Array loose equal)', done => {
    const vm = new Vue({
      data: {
        test: [{ a: 2 }]
      },
      template:
        '<select v-model="test">' +
          '<option value="1">a</option>' +
          '<option :value="[{ a: 2 }]">b</option>' +
          '<option :value="[{ a: 3 }]">c</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.$el.childNodes[1].selected).toBe(true)
    vm.test = [{ a: 3 }]
    waitForUpdate(function () {
      expect(vm.$el.childNodes[2].selected).toBe(true)

      updateSelect(vm.$el, '1')
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toBe('1')

      updateSelect(vm.$el, [{ a: 2 }])
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toEqual([{ a: 2 }])
    }).then(done)
  })

  it('should work with v-for', done => {
    const vm = new Vue({
      data: {
        test: 'b',
        opts: ['a', 'b', 'c']
      },
      template:
        '<select v-model="test">' +
          '<option v-for="o in opts">{{ o }}</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.test).toBe('b')
    expect(vm.$el.value).toBe('b')
    expect(vm.$el.childNodes[1].selected).toBe(true)
    vm.test = 'c'
    waitForUpdate(function () {
      expect(vm.$el.value).toBe('c')
      expect(vm.$el.childNodes[2].selected).toBe(true)
      updateSelect(vm.$el, 'a')
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toBe('a')
      // update v-for opts
      vm.opts = ['d', 'a']
    }).then(() => {
      expect(vm.$el.childNodes[0].selected).toBe(false)
      expect(vm.$el.childNodes[1].selected).toBe(true)
    }).then(done)
  })

  it('should work with v-for & value bindings', done => {
    const vm = new Vue({
      data: {
        test: 2,
        opts: [1, 2, 3]
      },
      template:
        '<select v-model="test">' +
          '<option v-for="o in opts" :value="o">option {{ o }}</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.$el.value).toBe('2')
    expect(vm.$el.childNodes[1].selected).toBe(true)
    vm.test = 3
    waitForUpdate(function () {
      expect(vm.$el.value).toBe('3')
      expect(vm.$el.childNodes[2].selected).toBe(true)
      updateSelect(vm.$el, 1)
      triggerEvent(vm.$el, 'change')
      expect(vm.test).toBe(1)
      // update v-for opts
      vm.opts = [0, 1]
    }).then(() => {
      expect(vm.$el.childNodes[0].selected).toBe(false)
      expect(vm.$el.childNodes[1].selected).toBe(true)
    }).then(done)
  })

  it('should work with select which has no default selected options', (done) => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        id: 4,
        list: [1, 2, 3],
        testChange: 5
      },
      template:
        '<div>' +
          '<select @change="test" v-model="id">' +
            '<option v-for="item in list" :value="item">{{item}}</option>' +
          '</select>' +
          '{{testChange}}' +
        '</div>',
      methods: {
        test: spy
      }
    }).$mount()
    document.body.appendChild(vm.$el)
    vm.testChange = 10
    waitForUpdate(() => {
      expect(spy.calls.count()).toBe(0)
    }).then(done)
  })

  if (!hasMultiSelectBug()) {
    it('multiple', done => {
      const vm = new Vue({
        data: {
          test: ['b']
        },
        template:
          '<select v-model="test" multiple>' +
            '<option>a</option>' +
            '<option>b</option>' +
            '<option>c</option>' +
          '</select>'
      }).$mount()
      var opts = vm.$el.options
      expect(opts[0].selected).toBe(false)
      expect(opts[1].selected).toBe(true)
      expect(opts[2].selected).toBe(false)
      vm.test = ['a', 'c']
      waitForUpdate(() => {
        expect(opts[0].selected).toBe(true)
        expect(opts[1].selected).toBe(false)
        expect(opts[2].selected).toBe(true)
        opts[0].selected = false
        opts[1].selected = true
        triggerEvent(vm.$el, 'change')
        expect(vm.test).toEqual(['b', 'c'])
      }).then(done)
    })

    it('multiple + v-for', done => {
      const vm = new Vue({
        data: {
          test: ['b'],
          opts: ['a', 'b', 'c']
        },
        template:
          '<select v-model="test" multiple>' +
            '<option v-for="o in opts">{{ o }}</option>' +
          '</select>'
      }).$mount()
      var opts = vm.$el.options
      expect(opts[0].selected).toBe(false)
      expect(opts[1].selected).toBe(true)
      expect(opts[2].selected).toBe(false)
      vm.test = ['a', 'c']
      waitForUpdate(() => {
        expect(opts[0].selected).toBe(true)
        expect(opts[1].selected).toBe(false)
        expect(opts[2].selected).toBe(true)
        opts[0].selected = false
        opts[1].selected = true
        triggerEvent(vm.$el, 'change')
        expect(vm.test).toEqual(['b', 'c'])
        // update v-for opts
        vm.opts = ['c', 'd']
      }).then(() => {
        expect(opts[0].selected).toBe(true)
        expect(opts[1].selected).toBe(false)
        expect(vm.test).toEqual(['c']) // should remove 'd' which no longer has a matching option
      }).then(done)
    })
  }

  it('should work with multiple binding', (done) => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        isMultiple: true,
        selections: ['1']
      },
      template:
        '<select v-model="selections" :multiple="isMultiple">' +
          '<option value="1">item 1</option>' +
          '<option value="2">item 2</option>' +
        '</select>',
      watch: {
        selections: spy
      }
    }).$mount()
    document.body.appendChild(vm.$el)
    vm.$el.options[1].selected = true
    triggerEvent(vm.$el, 'change')
    waitForUpdate(() => {
      expect(spy).toHaveBeenCalled()
      expect(vm.selections).toEqual(['1', '2'])
    }).then(done)
  })

  it('should not have multiple attr with falsy values except \'\'', () => {
    const vm = new Vue({
      template:
        '<div>' +
          '<select id="undefined" :multiple="undefined"></select>' +
          '<select id="null" :multiple="null"></select>' +
          '<select id="false" :multiple="false"></select>' +
          '<select id="string" :multiple="\'\'"></select>' +
        '</div>'
    }).$mount()
    expect(vm.$el.querySelector('#undefined').multiple).toEqual(false)
    expect(vm.$el.querySelector('#null').multiple).toEqual(false)
    expect(vm.$el.querySelector('#false').multiple).toEqual(false)
    expect(vm.$el.querySelector('#string').multiple).toEqual(true)
  })

  it('multiple with static template', () => {
    const vm = new Vue({
      template:
      '<select multiple>' +
        '<option selected>a</option>' +
        '<option selected>b</option>' +
        '<option selected>c</option>' +
      '</select>'
    }).$mount()
    var opts = vm.$el.options
    expect(opts[0].selected).toBe(true)
    expect(opts[1].selected).toBe(true)
    expect(opts[2].selected).toBe(true)
  })

  it('multiple selects', (done) => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        selections: ['', ''],
        selectBoxes: [
          [
            { value: 'foo', text: 'foo' },
            { value: 'bar', text: 'bar' }
          ],
          [
            { value: 'day', text: 'day' },
            { value: 'night', text: 'night' }
          ]
        ]
      },
      watch: {
        selections: spy
      },
      template:
        '<div>' +
          '<select v-for="(item, index) in selectBoxes" v-model="selections[index]">' +
            '<option v-for="element in item" v-bind:value="element.value" v-text="element.text"></option>' +
          '</select>' +
          '<span ref="rs">{{selections}}</span>' +
        '</div>'
    }).$mount()
    document.body.appendChild(vm.$el)
    var selects = vm.$el.getElementsByTagName('select')
    var select0 = selects[0]
    select0.options[0].selected = true
    triggerEvent(select0, 'change')
    waitForUpdate(() => {
      expect(spy).toHaveBeenCalled()
      expect(vm.selections).toEqual(['foo', ''])
    }).then(done)
  })

  it('.number modifier', () => {
    const vm = new Vue({
      data: {
        test: 2
      },
      template:
        '<select v-model.number="test">' +
          '<option value="1">a</option>' +
          '<option :value="2">b</option>' +
          '<option :value="3">c</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    updateSelect(vm.$el, '1')
    triggerEvent(vm.$el, 'change')
    expect(vm.test).toBe(1)
  })

  it('should respect different primitive type value', (done) => {
    const vm = new Vue({
      data: {
        test: 0
      },
      template:
        '<select v-model.number="test">' +
          '<option value="">a</option>' +
          '<option value="0">b</option>' +
          '<option value="1">c</option>' +
          '<option value="false">c</option>' +
          '<option value="true">c</option>' +
        '</select>'
    }).$mount()
    var opts = vm.$el.options
    expect(opts[0].selected).toBe(false)
    expect(opts[1].selected).toBe(true)
    expect(opts[2].selected).toBe(false)
    expect(opts[3].selected).toBe(false)
    expect(opts[4].selected).toBe(false)
    vm.test = 1
    waitForUpdate(() => {
      expect(opts[0].selected).toBe(false)
      expect(opts[1].selected).toBe(false)
      expect(opts[2].selected).toBe(true)
      expect(opts[3].selected).toBe(false)
      expect(opts[4].selected).toBe(false)
      vm.test = ''
    }).then(() => {
      expect(opts[0].selected).toBe(true)
      expect(opts[1].selected).toBe(false)
      expect(opts[2].selected).toBe(false)
      expect(opts[3].selected).toBe(false)
      expect(opts[4].selected).toBe(false)
      vm.test = false
    }).then(() => {
      expect(opts[0].selected).toBe(false)
      expect(opts[1].selected).toBe(false)
      expect(opts[2].selected).toBe(false)
      expect(opts[3].selected).toBe(true)
      expect(opts[4].selected).toBe(false)
      vm.test = true
    }).then(() => {
      expect(opts[0].selected).toBe(false)
      expect(opts[1].selected).toBe(false)
      expect(opts[2].selected).toBe(false)
      expect(opts[3].selected).toBe(false)
      expect(opts[4].selected).toBe(true)
    }).then(done)
  })

  it('should warn multiple with non-Array value', done => {
    new Vue({
      data: {
        test: 'meh'
      },
      template:
        '<select v-model="test" multiple></select>'
    }).$mount()
    // IE warns on a setTimeout as well
    setTimeout(() => {
      expect('<select multiple v-model="test"> expects an Array value for its binding, but got String')
        .toHaveBeenWarned()
      done()
    }, 0)
  })

  it('should work with option value that has circular reference', done => {
    const circular = {}
    circular.self = circular

    const vm = new Vue({
      data: {
        test: 'b',
        circular
      },
      template:
        '<select v-model="test">' +
          '<option :value="circular">a</option>' +
          '<option>b</option>' +
          '<option>c</option>' +
        '</select>'
    }).$mount()
    document.body.appendChild(vm.$el)
    expect(vm.test).toBe('b')
    expect(vm.$el.value).toBe('b')
    expect(vm.$el.childNodes[1].selected).toBe(true)
    vm.test = circular
    waitForUpdate(function () {
      expect(vm.$el.childNodes[0].selected).toBe(true)
    }).then(done)
  })

  // #6112
  it('should not set non-matching value to undefined if options did not change', done => {
    const vm = new Vue({
      data: {
        test: '1'
      },
      template:
        '<select v-model="test">' +
          '<option>a</option>' +
        '</select>'
    }).$mount()

    vm.test = '2'
    waitForUpdate(() => {
      expect(vm.test).toBe('2')
    }).then(done)
  })

  // #6193
  it('should not trigger change event when matching option can be found for each value', done => {
    const spy = jasmine.createSpy()
    const vm = new Vue({
      data: {
        options: ['1']
      },
      computed: {
        test: {
          get () {
            return '1'
          },
          set () {
            spy()
          }
        }
      },
      template:
        '<select v-model="test">' +
          '<option :key="opt" v-for="opt in options" :value="opt">{{ opt }}</option>' +
        '</select>'
    }).$mount()

    vm.options = ['1', '2']
    waitForUpdate(() => {
      expect(spy).not.toHaveBeenCalled()
    }).then(done)
  })

  // #6903
  describe('should correctly handle v-model when the vnodes are the same', () => {
    function makeInstance (foo) {
      return new Vue({
        data: {
          foo: foo,
          options: ['b', 'c', 'd'],
          value: 'c'
        },
        template:
          '<div>' +
            '<select v-if="foo" data-attr>' +
              '<option selected>a</option>' +
            '</select>' +
            '<select v-else v-model="value">' +
              '<option v-for="option in options" :value="option">{{ option }}</option>' +
            '</select>' +
          '</div>'
      }).$mount()
    }

    it('register v-model', done => {
      const vm = makeInstance(true)

      expect(vm.$el.firstChild.selectedIndex).toBe(0)
      vm.foo = false
      waitForUpdate(() => {
        expect(vm.$el.firstChild.selectedIndex).toBe(1)
      }).then(done)
    })

    it('remove v-model', done => {
      const vm = makeInstance(false)

      expect(vm.$el.firstChild.selectedIndex).toBe(1)
      vm.foo = true
      waitForUpdate(() => {
        expect(vm.$el.firstChild.selectedIndex).toBe(0)
      }).then(done)
    })
  })
})
