import Vue from 'vue'

describe('Comments', () => {
  it('comments should be kept', () => {
    const vm = new Vue({
      comments: true,
      data () {
        return {
          foo: 1
        }
      },
      template: '<div><span>node1</span><!--comment1-->{{foo}}<!--comment2--></div>'
    }).$mount()
    expect(vm.$el.innerHTML).toEqual('<span>node1</span><!--comment1-->1<!--comment2-->')
  })
})
