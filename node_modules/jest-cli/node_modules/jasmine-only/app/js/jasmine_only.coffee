((jasmine) ->

  # the window
  root = @

  # jasmines environment
  env  = jasmine.getEnv()

  # features we want added, describe.only and it.only
  describeOnly = (description, specDefinitions) ->
    suite = new jasmine.Suite(@, description, null, @currentSuite)
    suite.exclusive_ = 1
    @exclusive_ = Math.max(@exclusive_, 1)
    @describe_(suite, specDefinitions)

  itOnly = (description, func) ->
    spec = @it(description, func)
    spec.exclusive_ = 2
    @exclusive_ = 2
    spec

  env.exclusive_ = 0

  env.describe = (description, specDefinitions) ->
    suite = new jasmine.Suite(@, description, null, @currentSuite)
    @describe_(suite, specDefinitions)

  env.describe_ = (suite, specDefinitions) ->
    parentSuite = @currentSuite
    if parentSuite
      parentSuite.add suite
    else
      @currentRunner_.add suite
    @currentSuite = suite
    declarationError = null
    try
      specDefinitions.call suite
    catch e
      declarationError = e
    if declarationError
      @it "encountered a declaration exception", ->
        throw declarationError

    @currentSuite = parentSuite

    return suite

  env.specFilter = (spec) ->
    @exclusive_ <= spec.exclusive_

  env.describe.only = ->
    describeOnly.apply(env, arguments)

  env.it.only = ->
    itOnly.apply(env, arguments)

  root.describe.only = (description, specDefinitions) ->
    env.describe.only(description, specDefinitions)

  root.it.only = (description, func) ->
    env.it.only(description, func)

  # aliases

  root.iit       = root.it.only
  root.ddescribe = root.describe.only

  # constructor duck punching, <3 coffeescript

  class jasmine.Spec extends jasmine.Spec
    constructor: (env, suite, description) ->
      @exclusive_ = suite.exclusive_
      super(env, suite, description)

  class jasmine.Suite extends jasmine.Suite
    constructor: (env, suite, specDefinitions, parentSuite) ->
      @exclusive_ = parentSuite and parentSuite.exclusive_ or 0
      super(env, suite, specDefinitions, parentSuite)

) jasmine
