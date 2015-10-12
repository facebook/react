
'use strict';
// var React;
var ReactClassNameGenerator = require('../ReactClassNameGenerator');
// var ReactTestUtils;

describe('ReactClassNameGenerator', function() {
  var ClassNameConfig = {
    name: 'test-container',
    elements: [
      {
        name: 'element1',
        modifiers: {
          hidden: true,
          test: 'secondVal',
        },
      },
      {
        name: 'element2',
        modifiers: {
          red: true,
          secondMod: 2,
        },
      },
    ],
    modifiers: {
      hidden: true,
    },
  };
  it('ReactClassNameGenerator is an instance of Object', function() {
    expect(ReactClassNameGenerator.constructor.name).toEqual('Function');
  });

  it('ReactClassNameGenerator should return an Object', function() {
    expect(typeof ReactClassNameGenerator(ClassNameConfig)).toEqual('object');
  });

  it('ReactClassNameGenerator should create correct number of children elements', function() {
    var cssClassNameBlock = ReactClassNameGenerator(ClassNameConfig);
    expect(Object.getOwnPropertyNames(cssClassNameBlock).length).toEqual(2);
  });

  it('ReactClassNameGenerator should return correct block class with modifiers', function() {
    var classNameBlock = ReactClassNameGenerator(ClassNameConfig);
    expect(classNameBlock.name).toEqual('test-container hidden');
  });

  it('ReactClassNameGenerator returned block class should support toString() for getting name value', function() {
    var classNameBlock = ReactClassNameGenerator(ClassNameConfig);
    expect(classNameBlock.toString()).toEqual('test-container hidden');
  });

  it('ReactClassNameGenerator should return correct block elements classes with modifiers', function() {
    var classNameBlock = ReactClassNameGenerator(ClassNameConfig);
    expect(classNameBlock.element1.name).toEqual('element1 hidden test-secondVal');
  });


  it('ReactClassNameGenerator should be able to support BEM blocks naming for elements with modifiers', function() {
    var CustomClassNameGenerator = new ReactClassNameGenerator.config({
      bemEnabled: true,
    });
    var bemBlock = CustomClassNameGenerator(ClassNameConfig);
    expect(bemBlock.element1.name).toEqual('test-container__element1 test-container__element1--hidden test-container__element1--test-secondVal');
  });

});
