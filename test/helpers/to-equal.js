import { isEqual } from 'lodash'

beforeEach(() => {
  jasmine.addMatchers({
    // override built-in toEqual because it behaves incorrectly
    // on Vue-observed arrays in Safari
    toEqual: () => {
      return {
        compare: (a, b) => {
          const pass = isEqual(a, b)
          return {
            pass,
            message: `Expected ${a} to equal ${b}`
          }
        }
      }
    }
  })
})
