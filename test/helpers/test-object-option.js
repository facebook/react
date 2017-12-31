import Vue from 'vue'

export default function testObjectOption (name) {
  it(`Options ${name}: should warn non object value`, () => {
    const options = {}
    options[name] = () => {}
    new Vue(options)
    expect(`Invalid value for option "${name}"`).toHaveBeenWarned()
  })

  it(`Options ${name}: should not warn valid object value`, () => {
    const options = {}
    options[name] = {}
    new Vue(options)
    expect(`Invalid value for option "${name}"`).not.toHaveBeenWarned()
  })
}
