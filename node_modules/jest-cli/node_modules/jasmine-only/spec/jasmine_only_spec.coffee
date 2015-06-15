describe "jasmine-only", ->

  describe "exclusive spec helpers", ->

    normal    = jasmine.createSpy('normal spec')
    exclusive = jasmine.createSpy('exclusive spec')

    describe "it.only", ->
      it "shouldnt execute this 1", normal
      it.only "it only executes this using `it.only`", exclusive

    describe.only "describe.only", ->
      it "shouldnt execute this 2", normal
      it.only "it only executes this using `it.only` within `describe.only`", exclusive

      describe "block assertions", ->
        it.only "does not call normal blocks", ->
          expect(normal).not.toHaveBeenCalled()
        it.only "only calls exclusive blocks", ->
          expect(exclusive.callCount).toBe(2)

      describe "aliases", ->
        it.only "provides aliases `ddescribe` and `iit`", ->
          expect(ddescribe).toEqual(describe.only)
          expect(iit).toEqual(it.only)

    describe.only "does not run or blow up using `describe.only`", ->
      it "shouldnt execute this 3", normal
