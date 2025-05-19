__annotator=function(f){return f};__d_stub=[];__d=function(id,deps,factory,special){__d_stub.push([id,deps,factory,special]);};__rl_stub=[];requireLazy=function(){__rl_stub.push(arguments)};/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * https://github.com/benlesh/abort-controller-polyfill/blob/master/index.js
 * https://github.com/benlesh/event-target-polyfill/blob/master/index.js
 *
 * This module provides a polyfill to AbortController. It also provides a
 * "polyfill" for EventTarget under the name CustomEventTarget. It's mostly a
 * copy-paste of Ben Lesh's modules above.
 *
 * Why CustomEventTarget? Browsers like Firefox <= 55 will forbid constructing
 * EventTarget. None of the: new EventTarget, EventTarget.call(this),
 * Reflect.construct will work (i.e. https://codepen.io/zurfyx/pen/VwpxOaM?editors=1010).
 * To work around this limitation, we provide a custom implementation.
 *
 * Provides polyfills for:
 * - AbortController (https://caniuse.com/abortcontroller)
 *
 * @format
 * @noflow
 * @nolint
 * @oncall jsinfra
 * @polyfillUAs
 * @provides AbortController
 */

'use strict';

(function(){
var root=

typeof globalThis!=='undefined'&&globalThis||
typeof self!=='undefined'&&self||
typeof global!=='undefined'&&global;

if(typeof root.AbortController!=='undefined'){
return;
}

var CustomEventTarget=function(){
function CustomEventTarget(){
this.__listeners=new Map();
}

CustomEventTarget.prototype=Object.create(Object.prototype);

CustomEventTarget.prototype.addEventListener=function(
type,
listener,
options)
{
if(arguments.length<2){
throw new TypeError("TypeError: Failed to execute 'addEventListener' on 'CustomEventTarget': 2 arguments required, but only "+
arguments.length+" present.");

}
var __listeners=this.__listeners;
var actualType=type.toString();
if(!__listeners.has(actualType)){
__listeners.set(actualType,new Map());
}
var listenersForType=__listeners.get(actualType);
if(!listenersForType.has(listener)){

listenersForType.set(listener,options);
}
};

CustomEventTarget.prototype.removeEventListener=function(
type,
listener,
_options)
{
if(arguments.length<2){
throw new TypeError("TypeError: Failed to execute 'addEventListener' on 'CustomEventTarget': 2 arguments required, but only "+
arguments.length+" present.");

}
var __listeners=this.__listeners;
var actualType=type.toString();
if(__listeners.has(actualType)){
var listenersForType=__listeners.get(actualType);
if(listenersForType.has(listener)){
listenersForType["delete"](listener);
}
}
};

CustomEventTarget.prototype.dispatchEvent=function(event){
if(!(event instanceof Event)){
throw new TypeError("Failed to execute 'dispatchEvent' on 'CustomEventTarget': parameter 1 is not of type 'Event'.");


}
var type=event.type;
var __listeners=this.__listeners;
var listenersForType=__listeners.get(type);
if(listenersForType){
for(var _iterator=listenersForType.entries(),_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]();;){var _ref2;if(_isArray){if(_i>=_iterator.length)break;_ref2=_iterator[_i++];}else{_i=_iterator.next();if(_i.done)break;_ref2=_i.value;}var _ref3=_ref2;var listener=_ref3[0];var options=_ref3[1];
try{
if(typeof listener==='function'){

listener.call(this,event);
}else if(listener&&typeof listener.handleEvent==='function'){

listener.handleEvent(event);
}
}catch(err){





setTimeout(function setTimeout_$0(){
throw err;
});
}
if(options&&options.once){


listenersForType["delete"](listener);
}
}
}


return true;
};

return CustomEventTarget;
}();

var SECRET={};

root.AbortSignal=function(){
function AbortSignal(secret){
if(secret!==SECRET){
throw new TypeError('Illegal constructor.');
}
CustomEventTarget.call(this);
this._aborted=false;
}

AbortSignal.prototype=Object.create(CustomEventTarget.prototype);
AbortSignal.prototype.constructor=AbortSignal;

Object.defineProperty(AbortSignal.prototype,'onabort',{

get:function get(){
return this._onabort;
},

set:function set(callback){
var existing=this._onabort;
if(existing){
this.removeEventListener('abort',existing);
}
this._onabort=callback;
this.addEventListener('abort',callback);
}});


Object.defineProperty(AbortSignal.prototype,'aborted',{

get:function get(){
return this._aborted;
}});


return AbortSignal;
}();

root.AbortController=function(){
function AbortController(){
this._signal=new AbortSignal(SECRET);
}

AbortController.prototype=Object.create(Object.prototype);

Object.defineProperty(AbortController.prototype,'signal',{

get:function get(){
return this._signal;
}});


AbortController.prototype.abort=function(){
var signal=this.signal;
if(!signal.aborted){
signal._aborted=true;
signal.dispatchEvent(new Event('abort'));
}
};

return AbortController;
}();
})();
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - Array.from (https://caniuse.com/mdn-javascript_builtins_array_from)
 *
 * @provides Array.es6
 * @polyfillUAs old webkit modern
 * @noflow
 * @nolint
 */






if(!Array.from){
Array.from=function(arrayLike){
if(arrayLike==null){
throw new TypeError('Object is null or undefined');
}


var mapFn=arguments[1];
var thisArg=arguments[2];

var C=this;
var items=Object(arrayLike);
var symbolIterator=
typeof Symbol==='function'?typeof Symbol==="function"?Symbol.iterator:"@@iterator":'@@iterator';
var mapping=typeof mapFn==='function';
var usingIterator=typeof items[symbolIterator]==='function';
var key=0;
var ret;
var value;

if(usingIterator){
ret=typeof C==='function'?new C():[];
var it=items[symbolIterator]();
var next;

while(!(next=it.next()).done){
value=next.value;

if(mapping){
value=mapFn.call(thisArg,value,key);
}

ret[key]=value;
key+=1;
}

ret.length=key;
return ret;
}

var len=items.length;
if(isNaN(len)||len<0){
len=0;
}

ret=typeof C==='function'?new C(len):new Array(len);

while(key<len){
value=items[key];

if(mapping){
value=mapFn.call(thisArg,value,key);
}

ret[key]=value;

key+=1;
}

ret.length=key;
return ret;
};
}


/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfills for Array.prototype.at function
 *
 * Spec:
 * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.at
 *
 * MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.at
 * @requires Array.prototype
 */



'use strict';


if(Array.prototype.at==null){

Array.prototype.at=function at(_index){

var index=parseInt(_index,10);
if(!Number.isInteger(index)){
index=0;
}

if(index>=0&&index<this.length){
return this[index];
}else{
return this[this.length+index];
}
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfills for Array.prototype functions introduced in ES2020 (ES11)
 *
 * Provides polyfills for:
 * - Array.prototype.flat    (https://caniuse.com/array-flat)
 * - Array.prototype.flatMap (...)
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.es2020
 * @requires Array.prototype
 */



'use strict';








(function(){

if(!Array.prototype.flat){var


flat=function flat(depth){
return depth<1?

Array.prototype.slice.call(this):

Array.prototype.reduce.call(
this,
function prototype_reduce_call_$1(accu,curr){
Array.isArray(curr)?
accu.push.apply(accu,flat.call(curr,depth-1)):
accu.push(curr);
return accu;
},
[]);

};



Array.prototype.flat=function(){
return flat.call(this,isNaN(arguments[0])?1:Number(arguments[0]));
};
}


if(!Array.prototype.flatMap){var
flatMapArray=function flatMapArray(
array,
fn)
{
var ret=[];
if(typeof fn!=='function'){
throw new TypeError('Callback function must be callable.');
}
for(var ii=0;ii<array.length;ii++){
var result=fn.call(array,array[ii],ii,array);
if(Array.isArray(result)){

ret.push.apply(ret,result);
}else{
ret.push(result);
}
}
return ret;
};



Array.prototype.flatMap=function(
cb)
{
var that=arguments[1]||this;
return flatMapArray(that,cb);
};
}
})();
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - Array.prototype.findIndex (https://caniuse.com/array-find-index)
 * - Array.prototype.find (https://caniuse.com/array-find)
 * - Array.prototype.fill (https://caniuse.com/mdn-javascript_builtins_array_fill)
 *
 * 
 * @format
 * @oncall jsinfra
 * @polyfillUAs old webkit modern
 * @provides Array.prototype.es6
 */



'use strict';


(function(undefined){



function findIndex(predicate,context){


















if(this==null){

throw new TypeError(
'Array.prototype.findIndex called on null or undefined');

}
if(typeof predicate!=='function'){
throw new TypeError('predicate must be a function');
}
var list=Object(this);
var length=list.length>>>0;
for(var i=0;i<length;i++){
if(predicate.call(context,list[i],i,list)){
return i;
}
}
return-1;
}


if(!Array.prototype.findIndex){

Array.prototype.findIndex=findIndex;
}



if(!Array.prototype.find){



Array.prototype.find=function(predicate,context){


















if(this==null){
throw new TypeError('Array.prototype.find called on null or undefined');
}
var index=findIndex.call(this,predicate,context);
return index===-1?undefined:this[index];
};
}



if(!Array.prototype.fill){



Array.prototype.fill=function(value){
if(this==null){
throw new TypeError('Array.prototype.fill called on null or undefined');
}
var O=Object(this);
var len=O.length>>>0;
var start=arguments[1];
var relativeStart=start>>0;
var k=
relativeStart<0?
Math.max(len+relativeStart,0):
Math.min(relativeStart,len);
var end=arguments[2];
var relativeEnd=end===undefined?len:end>>0;
var final=
relativeEnd<0?
Math.max(len+relativeEnd,0):
Math.min(relativeEnd,len);
while(k<final){
O[k]=value;
k++;
}
return O;
};
}
})();

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - Array.prototype.includes (https://caniuse.com/array-includes)
 * - Array.prototype.values (https://caniuse.com/mdn-javascript_builtins_array_values)
 * - Array.prototype[Symbol.iterator] (https://caniuse.com/mdn-javascript_builtins_array_--iterator)
 *
 * Technically `Array.prototype.values` was a part of ES6, but browsers
 * implemented it later than other ES6 functionality.
 *
 * @provides Array.prototype.es7
 * @polyfillUAs
 * @requires Array.prototype
 * @requires Array.prototype.es6
 * @requires Number.es6
 * @noflow
 * @nolint
 */



(function(){
'use strict';

var indexOf=Array.prototype.indexOf;

if(!Array.prototype.includes){
Array.prototype.includes=function(needle){
'use strict';


if(
needle!==undefined&&
Array.isArray(this)&&
!Number.isNaN(needle))
{
return indexOf.apply(this,arguments)!==-1;
}


var o=Object(this);
var len=o.length?toLength(o.length):0;

if(len===0){
return false;
}

var fromIndex=arguments.length>1?toInteger(arguments[1]):0;

var i=fromIndex<0?Math.max(len+fromIndex,0):fromIndex;

var NaNLookup=Number.isNaN(needle);

while(i<len){
var value=o[i];
if(value===needle||NaNLookup&&Number.isNaN(value)){
return true;
}
i++;
}
return false;
};
}


function toLength(number){
return Math.min(Math.max(toInteger(number),0),Number.MAX_SAFE_INTEGER);
}


function toInteger(number){
var n=Number(number);
return Number.isFinite(n)&&n!==0?
sign(n)*Math.floor(Math.abs(n)):
n;
}

function sign(number){
return number>=0?1:-1;
}


if(!Array.prototype.values){var _Symbol$iterator=typeof Symbol==="function"?




















Symbol.iterator:"@@iterator";var ArrayIterator=function(){function ArrayIterator(array){this.$ArrayIterator_array=undefined;this.$ArrayIterator_nextIndex=0;if(array==null){throw new TypeError('Cannot convert undefined or null to object');}this.$ArrayIterator_array=Object(array);}var _proto=ArrayIterator.prototype;_proto.next=function next(){if(this.$ArrayIterator_array==null||this.$ArrayIterator_nextIndex>=this.$ArrayIterator_array.length){this.$ArrayIterator_array=undefined;return{value:undefined,done:true};}var value=this.$ArrayIterator_array[this.$ArrayIterator_nextIndex];this.$ArrayIterator_nextIndex++;return{value:value,done:false};};_proto[_Symbol$iterator]=function(){
return this;
};return ArrayIterator;}();


Array.prototype.values=function(){
return new ArrayIterator(this);
};
}



if(!Array.prototype[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]){


Array.prototype[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]=Array.prototype.values;
}
})();
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfill for the Array.prototype.findLast method
 *
 * Spec:
 * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.findlast
 *
 * MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.findLast
 */



'use strict';


if(Array.prototype.findLast==null){

Array.prototype.findLast=function findLast(

callbackFn,
thisArg)
{
var array=this;

for(var i=array.length-1;i>=0;i--){
var _element=array[i];
var result=callbackFn.call(thisArg,_element,i,array);
if(result){
return _element;
}
}

return undefined;
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfill for the Array.prototype.findLastIndex method
 *
 * Spec:
 * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.findlastindex
 *
 * MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLastIndex
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.findLastIndex
 */



'use strict';


if(Array.prototype.findLastIndex==null){

Array.prototype.findLastIndex=function findLastIndex(

callbackFn,
thisArg)
{
var array=this;

for(var i=array.length-1;i>=0;i--){
var _element=array[i];
var result=callbackFn.call(thisArg,_element,i,array);
if(result){
return i;
}
}

return-1;
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfill for the Array.prototype.toReversed method
 *
 * Spec:
 * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.toreversed
 *
 * MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.toReversed
 */



'use strict';


if(Array.prototype.toReversed==null){

Array.prototype.toReversed=function toReversed()

{
return this.slice().reverse();
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfill for the Array.prototype.toSorted method
 *
 * Spec:
 * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.tosorted
 *
 * MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.toSorted
 */



'use strict';


if(Array.prototype.toSorted==null){

Array.prototype.toSorted=function toSorted(

compareFn)
{
return this.slice().sort(compareFn);
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfill for the Array.prototype.toSpliced method
 *
 * Spec:
 * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.tospliced
 *
 * MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSpliced
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.toSpliced
 */



'use strict';


if(Array.prototype.toSpliced==null){

Array.prototype.toSpliced=function toSpliced()

{
var copy=this.slice();
copy.splice.apply(copy,arguments);
return copy;
};
}

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Polyfill for the Array.prototype.with method
 *
 * Spec:
 * https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.with
 *
 * MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/with
 *
 *  strict-local
 * @format
 * @oncall jsinfra
 * @polyfillUAs
 * @provides Array.prototype.with
 * @requires Math.es6
 */



'use strict';


if(Array.prototype["with"]==null){
var toIntegerOrInfinity=function toIntegerOrInfinity(value){

if(Number.isNaN(value)||value===0){
return 0;
}



if(value===Infinity||value===-Infinity){
return value;
}


return Math.trunc(value);
};


Array.prototype["with"]=function(

index,
value)
{

var len=this.length;


var relativeIndex=toIntegerOrInfinity(index);

var actualIndex;
if(relativeIndex>=0){

actualIndex=relativeIndex;
}else{

actualIndex=len+relativeIndex;
}


if(actualIndex>=len||actualIndex<0){

throw new RangeError('Invalid index');
}


var copy=this.slice();
copy[actualIndex]=value;

return copy;
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * This file contains the functions used for the generic JS function
 * transform. Please add your functionality to these functions if you
 * want to wrap or annotate functions.
 *
 * Please see the DEX https://fburl.com/80903169 for more information.
 *
 * @provides GenericFunctionVisitor
 * @polyfillUAs
 * @noflow
 * @nolint
 */


(function(globalScope){
var funcCalls={};

var createMeta=function createMeta(type,signature){
if(!type&&!signature){
return null;
}

var meta={};
if(typeof type!=='undefined'){
meta.type=type;
}

if(typeof signature!=='undefined'){
meta.signature=signature;
}

return meta;
};

var getMeta=function getMeta(name,params){
return createMeta(
name&&/^[A-Z]/.test(name)?name:undefined,
params&&(params.params&&params.params.length||params.returns)?
'function('+(
params.params?
params.params.
map(function params_params_map_$0(param){
return /\?/.test(param)?
'?'+param.replace('?',''):
param;
}).
join(','):
'')+
')'+(
params.returns?':'+params.returns:''):
undefined);

};

var noopAnnotator=function noopAnnotator(fn,funcMeta,params){
return fn;
};

var genericAnnotator=function genericAnnotator(fn,funcMeta,params){
if('sourcemeta'in __transform_includes){
fn.__SMmeta=funcMeta;
}

if('typechecks'in __transform_includes){
var meta=getMeta(funcMeta?funcMeta.name:undefined,params);
if(meta){
__w(fn,meta);
}
}
return fn;
};

var noopBodyWrapper=function noopBodyWrapper(scope,args,fn){
return fn.apply(scope,args);
};

var typecheckBodyWrapper=function typecheckBodyWrapper(scope,args,fn,params){
if(params&&params.params){
__t.apply(scope,params.params);
}

var result=fn.apply(scope,args);

if(params&&params.returns){
__t([result,params.returns]);
}

return result;
};

var codeUsageBodyWrapper=function codeUsageBodyWrapper(scope,args,fn,params,funcMeta){
if(funcMeta){
if(!funcMeta.callId){


funcMeta.callId=
funcMeta.module+
':'+(
funcMeta.line||0)+
':'+(
funcMeta.column||0);
}
var key=funcMeta.callId;
funcCalls[key]=(funcCalls[key]||0)+1;
}
return fn.apply(scope,args);
};


if(typeof __transform_includes==='undefined'){
globalScope.__annotator=noopAnnotator;
globalScope.__bodyWrapper=noopBodyWrapper;
}else{
globalScope.__annotator=genericAnnotator;

if('codeusage'in __transform_includes){
globalScope.__annotator=noopAnnotator;
globalScope.__bodyWrapper=codeUsageBodyWrapper;
globalScope.__bodyWrapper.getCodeUsage=function(){
return funcCalls;
};
globalScope.__bodyWrapper.clearCodeUsage=function(){
funcCalls={};
};
}else if('typechecks'in __transform_includes){
globalScope.__bodyWrapper=__DEV__?
typecheckBodyWrapper:
noopBodyWrapper;
}else{
globalScope.__bodyWrapper=noopBodyWrapper;
}
}
})(
typeof globalThis!=='undefined'?
globalThis:
typeof global!=='undefined'?
global:
typeof window!=='undefined'?
window:
typeof this!=='undefined'?
this:
typeof self!=='undefined'?
self:
{});
(function(globalScope){globalScope.__t=function(x){return x[0]};globalScope.__w=function(x){return x};})(typeof globalThis !== 'undefined'? globalThis: typeof global !== 'undefined'? global: typeof window !== 'undefined'? window: typeof this !== 'undefined'? this: typeof self !== 'undefined'? self: {});
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @provides __DEV__
 * @polyfillUAs
 * @noflow
 * @nolint
 */


self['__DEV__']=self['__DEV__']||0;



self.emptyFunction=function(){};

if(__DEV__){
if(self.__BOOTSTRAPPED__){
throw new Error(
'The JavaScript bootstrapping environment can be included only once. '+
'Fix the page including it multiple times.');

}
self.__BOOTSTRAPPED__=true;
}


/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides a polyfill for:
 * - Object.assign (https://caniuse.com/es6)
 *
 * @noflow
 * @noformat
 * @polyfillUAs old webkit modern
 * @provides Object.es6
 * @requires Object
 */



(function(){

if(Object.assign){
return;
}

var hasOwnProperty=Object.prototype.hasOwnProperty;






var _assign;
if(Object.keys&&Object.keys.name!=='object_keys_polyfill'){
_assign=function _assign(to,from){
var keys=Object.keys(from);
for(var i=0;i<keys.length;i++){
to[keys[i]]=from[keys[i]];
}
};
}else{
_assign=function _assign(to,from){
for(var key in from){
if(hasOwnProperty.call(from,key)){
to[key]=from[key];
}
}
};
}

Object.assign=function(target,sources){
if(target==null){
throw new TypeError('Object.assign target cannot be null or undefined');
}

var to=Object(target);

for(var nextIndex=1;nextIndex<arguments.length;nextIndex++){
var nextSource=arguments[nextIndex];
if(nextSource!=null){
_assign(to,Object(nextSource));
}
}

return to;
};

})();
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides specific iterators (String/Array) with fallback to a generic object
 * iterator.
 *
 * @provides iterator.enumerate
 * @requires Array
 *           Object.enumFix
 *           Object
 *           Object.es6
 * @polyfillUAs
 * @noflow
 * @nolint
 */

(function(global,undefined){
var KIND_KEYS='keys';
var KIND_VALUES='values';
var KIND_ENTRIES='entries';




var ArrayIterators=function(){
var hasNative=hasNativeIterator(Array);
var ArrayIterator;

if(!hasNative){
ArrayIterator=function(){"use strict";

function ArrayIterator(array,kind){
this.$ArrayIterator_iteratedObject=array;
this.$ArrayIterator_kind=kind;
this.$ArrayIterator_nextIndex=0;
}var _proto=ArrayIterator.prototype;_proto.


next=function next(){
if(this.$ArrayIterator_iteratedObject==null){
return{value:undefined,done:true};
}

var array=this.$ArrayIterator_iteratedObject;
var len=this.$ArrayIterator_iteratedObject.length;
var index=this.$ArrayIterator_nextIndex;
var kind=this.$ArrayIterator_kind;

if(index>=len){
this.$ArrayIterator_iteratedObject=undefined;
return{value:undefined,done:true};
}

this.$ArrayIterator_nextIndex=index+1;

if(kind===KIND_KEYS){
return{value:index,done:false};
}else if(kind===KIND_VALUES){
return{value:array[index],done:false};
}else if(kind===KIND_ENTRIES){
return{value:[index,array[index]],done:false};
}
};_proto[typeof Symbol==="function"?


Symbol.iterator:"@@iterator"]=function(){
return this;
};return ArrayIterator;}();

}

return{
keys:hasNative?
function(array){return array.keys();}:
function(array){return new ArrayIterator(array,KIND_KEYS);},

values:hasNative?
function(array){return array.values();}:
function(array){return new ArrayIterator(array,KIND_VALUES);},

entries:hasNative?
function(array){return array.entries();}:
function(array){return new ArrayIterator(array,KIND_ENTRIES);}};

}();






var StringIterators=function(){
var hasNative=hasNativeIterator(String);
var StringIterator;

if(!hasNative){
StringIterator=function(){"use strict";

function StringIterator(string){
this.$StringIterator_iteratedString=string;
this.$StringIterator_nextIndex=0;
}var _proto2=StringIterator.prototype;_proto2.


next=function next(){
if(this.$StringIterator_iteratedString==null){
return{value:undefined,done:true};
}

var index=this.$StringIterator_nextIndex;
var s=this.$StringIterator_iteratedString;
var len=s.length;

if(index>=len){
this.$StringIterator_iteratedString=undefined;
return{value:undefined,done:true};
}

var ret;
var first=s.charCodeAt(index);

if(first<0xd800||first>0xdbff||index+1===len){
ret=s[index];
}else{
var second=s.charCodeAt(index+1);
if(second<0xdc00||second>0xdfff){
ret=s[index];
}else{
ret=s[index]+s[index+1];
}
}

this.$StringIterator_nextIndex=index+ret.length;

return{value:ret,done:false};
};_proto2[typeof Symbol==="function"?


Symbol.iterator:"@@iterator"]=function(){
return this;
};return StringIterator;}();

}

return{
keys:function keys(){
throw TypeError("Strings default iterator doesn't implement keys.");
},

values:hasNative?
function(string){return string[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]();}:
function(string){return new StringIterator(string);},

entries:function entries(){
throw TypeError("Strings default iterator doesn't implement entries.");
}};

}();

function hasNativeIterator(classObject){
return(
typeof classObject.prototype[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]==='function'&&
typeof classObject.prototype.values==='function'&&
typeof classObject.prototype.keys==='function'&&
typeof classObject.prototype.entries==='function');

}var






ObjectIterator=function(){"use strict";
function ObjectIterator(object,kind){
this.$ObjectIterator_iteratedObject=object;
this.$ObjectIterator_kind=kind;
this.$ObjectIterator_keys=Object.keys(object);
this.$ObjectIterator_nextIndex=0;
}var _proto3=ObjectIterator.prototype;_proto3.

next=function next(){
var len=this.$ObjectIterator_keys.length;
var index=this.$ObjectIterator_nextIndex;
var kind=this.$ObjectIterator_kind;
var key=this.$ObjectIterator_keys[index];

if(index>=len){
this.$ObjectIterator_iteratedObject=undefined;
return{value:undefined,done:true};
}

this.$ObjectIterator_nextIndex=index+1;

if(kind===KIND_KEYS){
return{value:key,done:false};
}else if(kind===KIND_VALUES){
return{value:this.$ObjectIterator_iteratedObject[key],done:false};
}else if(kind===KIND_ENTRIES){
return{value:[key,this.$ObjectIterator_iteratedObject[key]],done:false};
}
};_proto3[typeof Symbol==="function"?

Symbol.iterator:"@@iterator"]=function(){
return this;
};return ObjectIterator;}();







var GenericIterators={
keys:function keys(object){
return new ObjectIterator(object,KIND_KEYS);
},

values:function values(object){
return new ObjectIterator(object,KIND_VALUES);
},

entries:function entries(object){
return new ObjectIterator(object,KIND_ENTRIES);
}};








function enumerate(object,kind){

if(typeof object==='string'){
return StringIterators[kind||KIND_VALUES](object);
}else if(Array.isArray(object)){
return ArrayIterators[kind||KIND_VALUES](object);


}else if(object[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]){
return object[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]();


}else{
return GenericIterators[kind||KIND_ENTRIES](object);
}
}

Object.assign(enumerate,{




KIND_KEYS:KIND_KEYS,
KIND_VALUES:KIND_VALUES,
KIND_ENTRIES:KIND_ENTRIES,





keys:function keys(object){
return enumerate(object,KIND_KEYS);
},

values:function values(object){
return enumerate(object,KIND_VALUES);
},

entries:function entries(object){
return enumerate(object,KIND_ENTRIES);
},

generic:GenericIterators.entries});


global.FB_enumerate=enumerate;
})(
typeof global==='object'?
global:
typeof this==='object'?
this:
typeof window==='object'?
window:
typeof self==='object'?
self:
{});
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Provides polyfills for:
 * - ES6 implementations of Map/Set (https://caniuse.com/es6)
 *
 * @provides Collections.es6
 * @polyfillUAs old webkit modern
 * @preventMunge
 * @requires iterator.enumerate
 * @requires TypeChecker
 * @requires GenericFunctionVisitor
 * @noflow
 * @nolint
 */






(function(global,undefined){



var windowObj=global.window||global;
function guid(){
return'f'+(Math.random()*(1<<30)).toString(16).replace('.','');
}

function isNode(object){
var doc=object?object.ownerDocument||object:document;
var defaultView=doc.defaultView||windowObj;
return!!(
object&&(
typeof defaultView.Node==='function'?
object instanceof defaultView.Node:
typeof object==='object'&&
typeof object.nodeType==='number'&&
typeof object.nodeName==='string'));

}





function shouldPolyfillES6Collection(collectionName){
var Collection=windowObj[collectionName];
if(Collection==null){
return true;
}





if(typeof windowObj.Symbol!=='function'){
return true;
}

var proto=Collection.prototype;




return(
Collection==null||
typeof Collection!=='function'||
typeof proto.clear!=='function'||
new Collection().size!==0||
typeof proto.keys!=='function'||

typeof proto['for'+'Each']!=='function');

}

var enumerate=global.FB_enumerate;

var Map=function(){




if(!shouldPolyfillES6Collection('Map')){
return windowObj.Map;
}
























































var KIND_KEY='key';
var KIND_VALUE='value';
var KIND_KEY_VALUE='key+value';



var KEY_PREFIX='$map_';



var SECRET_SIZE_PROP;
if(__DEV__){
SECRET_SIZE_PROP='$size'+guid();
}


var OLD_IE_HASH_PREFIX='IE_HASH_';var

Map=function(){"use strict";









function Map(iterable){
if(!isObject(this)){
throw new TypeError('Wrong map object type.');
}

initMap(this);

if(iterable!=null){
var it=enumerate(iterable);
var next;
while(!(next=it.next()).done){
if(!isObject(next.value)){
throw new TypeError(
'Expected iterable items to be pair objects.');

}
this.set(next.value[0],next.value[1]);
}
}
}var _proto=Map.prototype;_proto.





clear=function clear(){
initMap(this);
};_proto.








has=function has(key){
var index=getIndex(this,key);
return!!(index!=null&&this._mapData[index]);
};_proto.









set=function set(key,value){
var index=getIndex(this,key);

if(index!=null&&this._mapData[index]){
this._mapData[index][1]=value;
}else{
index=this._mapData.push([key,value])-1;
setIndex(this,key,index);
if(__DEV__){
this[SECRET_SIZE_PROP]+=1;
}else{
this.size+=1;
}
}

return this;
};_proto.








get=function get(key){
var index=getIndex(this,key);
if(index==null){
return undefined;
}else{
return this._mapData[index][1];
}
};_proto["delete"]=








function _delete(key){
var index=getIndex(this,key);
if(index!=null&&this._mapData[index]){
setIndex(this,key,undefined);
this._mapData[index]=undefined;
if(__DEV__){
this[SECRET_SIZE_PROP]-=1;
}else{
this.size-=1;
}
return true;
}else{
return false;
}
};_proto.








entries=function entries(){
return new MapIterator(this,KIND_KEY_VALUE);
};_proto.







keys=function keys(){
return new MapIterator(this,KIND_KEY);
};_proto.







values=function values(){
return new MapIterator(this,KIND_VALUE);
};_proto.










forEach=function forEach(callback,thisArg){
if(typeof callback!=='function'){
throw new TypeError('Callback must be callable.');
}

var boundCallback=callback.bind(thisArg||undefined);
var mapData=this._mapData;




for(var i=0;i<mapData.length;i++){
var entry=mapData[i];
if(entry!=null){
boundCallback(entry[1],entry[0],this);
}
}
};_proto[typeof Symbol==="function"?


Symbol.iterator:"@@iterator"]=function(){
return this.entries();
};return Map;}();var


MapIterator=function(){"use strict";








function MapIterator(map,kind){
if(!(isObject(map)&&map._mapData)){
throw new TypeError('Object is not a map.');
}

if([KIND_KEY,KIND_KEY_VALUE,KIND_VALUE].indexOf(kind)===-1){
throw new Error('Invalid iteration kind.');
}

this._map=map;
this._nextIndex=0;
this._kind=kind;
}var _proto2=MapIterator.prototype;_proto2.







next=function next(){
if(!this instanceof Map){
throw new TypeError('Expected to be called on a MapIterator.');
}

var map=this._map;
var index=this._nextIndex;
var kind=this._kind;

if(map==null){
return createIterResultObject(undefined,true);
}

var entries=map._mapData;

while(index<entries.length){
var record=entries[index];

index+=1;
this._nextIndex=index;

if(record){
if(kind===KIND_KEY){
return createIterResultObject(record[0],false);
}else if(kind===KIND_VALUE){
return createIterResultObject(record[1],false);
}else if(kind){
return createIterResultObject(record,false);
}
}
}

this._map=undefined;

return createIterResultObject(undefined,true);
};_proto2[typeof Symbol==="function"?

Symbol.iterator:"@@iterator"]=function(){
return this;
};return MapIterator;}();














function getIndex(map,key){
if(isObject(key)){
var hash=getHash(key);
return hash?map._objectIndex[hash]:undefined;
}else{
var prefixedKey=KEY_PREFIX+key;
if(typeof key==='string'){
return map._stringIndex[prefixedKey];
}else{
return map._otherIndex[prefixedKey];
}
}
}







function setIndex(map,key,index){
var shouldDelete=index==null;

if(isObject(key)){
var hash=getHash(key);
if(!hash){
hash=createHash(key);
}
if(shouldDelete){
delete map._objectIndex[hash];
}else{
map._objectIndex[hash]=index;
}
}else{
var prefixedKey=KEY_PREFIX+key;
if(typeof key==='string'){
if(shouldDelete){
delete map._stringIndex[prefixedKey];
}else{
map._stringIndex[prefixedKey]=index;
}
}else if(shouldDelete){
delete map._otherIndex[prefixedKey];
}else{
map._otherIndex[prefixedKey]=index;
}
}
}






function initMap(map){






map._mapData=[];







map._objectIndex={};


map._stringIndex={};


map._otherIndex={};







if(__DEV__){
if(Map.__isES5){



if(Object.prototype.hasOwnProperty.call(map,SECRET_SIZE_PROP)){
map[SECRET_SIZE_PROP]=0;
}else{
Object.defineProperty(map,SECRET_SIZE_PROP,{
value:0,
writable:true});

Object.defineProperty(map,'size',{
set:function set(v){
console.error(
'PLEASE FIX ME: You are changing the map size property which '+
'should not be writable and will break in production.');

throw new Error('The map size property is not writable.');
},
get:function get(){return map[SECRET_SIZE_PROP];}});

}


return;
}
}



map.size=0;
}







function isObject(o){
return o!=null&&(typeof o==='object'||typeof o==='function');
}








function createIterResultObject(value,done){
return{value:value,done:done};
}


Map.__isES5=function(){
try{
Object.defineProperty({},'__.$#x',{});
return true;
}catch(e){
return false;
}
}();







function isExtensible(o){
if(!Map.__isES5||!Object.isExtensible){
return true;
}else{
return Object.isExtensible(o);
}
}









function getIENodeHash(node){
var uniqueID;
switch(node.nodeType){
case 1:
uniqueID=node.uniqueID;
break;
case 9:
uniqueID=node.documentElement.uniqueID;
break;
default:
return null;}


if(uniqueID){
return OLD_IE_HASH_PREFIX+uniqueID;
}else{
return null;
}
}

var hashProperty=guid();






function getHash(o){
if(o[hashProperty]){
return o[hashProperty];
}else if(
!Map.__isES5&&
o.propertyIsEnumerable&&
o.propertyIsEnumerable[hashProperty])
{
return o.propertyIsEnumerable[hashProperty];
}else if(!Map.__isES5&&isNode(o)&&getIENodeHash(o)){
return getIENodeHash(o);
}else if(!Map.__isES5&&o[hashProperty]){
return o[hashProperty];
}
}

var createHash=function(){
var propIsEnumerable=Object.prototype.propertyIsEnumerable;
var hashCounter=0;







return function createHash(o){
if(isExtensible(o)){
hashCounter+=1;
if(Map.__isES5){
Object.defineProperty(o,hashProperty,{
enumerable:false,
writable:false,
configurable:false,
value:hashCounter});

}else if(o.propertyIsEnumerable){




o.propertyIsEnumerable=function(){
return propIsEnumerable.apply(this,arguments);
};
o.propertyIsEnumerable[hashProperty]=hashCounter;
}else if(isNode(o)){




o[hashProperty]=hashCounter;
}else{
throw new Error(
'Unable to set a non-enumerable property on object.');

}
return hashCounter;
}else{
throw new Error('Non-extensible objects are not allowed as keys.');
}
};
}();




return __annotator(Map,{name:'Map'});
}();

var Set=function(){





if(!shouldPolyfillES6Collection('Set')){
return windowObj.Set;
}var










































Set=function(){"use strict";









function Set(iterable){
if(
this==null||
typeof this!=='object'&&typeof this!=='function')
{
throw new TypeError('Wrong set object type.');
}

initSet(this);

if(iterable!=null){
var it=enumerate(iterable);
var next;
while(!(next=it.next()).done){
this.add(next.value);
}
}
}var _proto3=Set.prototype;_proto3.









add=function add(value){
this._map.set(value,value);
this.size=this._map.size;
return this;
};_proto3.






clear=function clear(){
initSet(this);
};_proto3["delete"]=










function _delete(value){
var ret=this._map["delete"](value);
this.size=this._map.size;
return ret;
};_proto3.






entries=function entries(){
return this._map.entries();
};_proto3.








forEach=function forEach(callback){
var thisArg=arguments[1];
var it=this._map.keys();
var next;
while(!(next=it.next()).done){
callback.call(thisArg,next.value,next.value,this);
}
};_proto3.









has=function has(value){
return this._map.has(value);
};_proto3.






values=function values(){
return this._map.values();
};_proto3.




keys=function keys(){
return this.values();
};_proto3[typeof Symbol==="function"?


Symbol.iterator:"@@iterator"]=function(){
return this.values();
};return Set;}();


function initSet(set){
set._map=new Map();
set.size=set._map.size;
}




return __annotator(Set,{name:'Set'});
}();

global.Map=Map;
global.Set=Set;
})(
typeof globalThis!=='undefined'?
globalThis:
typeof global!=='undefined'?
global:
typeof window!=='undefined'?
window:
typeof this!=='undefined'?
this:
typeof self!=='undefined'?
self:
{});




/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - Element.prototype.scroll   (https://caniuse.com/element-scroll-methods)
 * - Element.prototype.scrollBy (...)
 *
 *  strict-local
 * @format
 * @polyfillUAs
 * @provides Element.prototype.scroll
 */



'use strict';

(function(){



if(typeof Element==='undefined'||Element.prototype.scroll){
return;
}



function scroll(
args,
isRelative)
{if(isRelative===void 0){isRelative=false;}
if(args.length===0){
return;
}var


left=args[0],top=args[1];

left=Number(left)||0;
top=Number(top)||0;

if(args.length===1){var

options=args[0];
if(options==null){
return;
}
left=options.left;top=options.top;

if(left!==undefined){
left=Number(left)||0;
}
if(top!==undefined){
top=Number(top)||0;
}
}

if(left!==undefined){
this.scrollLeft=(isRelative?this.scrollLeft:0)+left;
}
if(top!==undefined){
this.scrollTop=(isRelative?this.scrollTop:0)+top;
}
}





Element.prototype.scroll=Element.prototype.scrollTo=function(){
scroll.call(this,arguments);
};



Element.prototype.scrollBy=function(){
scroll.call(this,arguments,true);
};

})();

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @provides Function.prototype-shield
 * @requires __DEV__ Function.prototype
 * @polyfillUAs
 * @nostacktrace
 * @noflow
 * @nolint
 */







if(__DEV__){
(function(bind){
Function.prototype.bind=function(){
var bound=bind.apply(this,arguments);
bound.toString=bind.call(this.toString,this);
return bound;
};
})(Function.prototype.bind);


if(Object.preventExtensions){
Object.preventExtensions(Function.prototype);
}
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - `IntersectionObserver` (https://caniuse.com/intersectionobserver)
 *
 * This is a copy/paste of the polyfill from the Google Chrome team:
 *  - https://github.com/GoogleChromeLabs/intersection-observer/blob/main/intersection-observer.js
 *
 * @oncall jsinfra
 * @polyfillUAs old webkit modern
 * @provides IntersectionObserver
 * @noflow
 * @nolint
 */

(function(){

if(typeof window!=='object'){
return;
}



if(
'IntersectionObserver'in window&&
'IntersectionObserverEntry'in window&&
'intersectionRatio'in window.IntersectionObserverEntry.prototype)
{


if(!('isIntersecting'in window.IntersectionObserverEntry.prototype)){
Object.defineProperty(
window.IntersectionObserverEntry.prototype,
'isIntersecting',
{
get:function get(){
return this.intersectionRatio>0;
}});


}
return;
}






function getFrameElement(doc){
try{
return doc.defaultView&&doc.defaultView.frameElement||null;
}catch(e){

return null;
}
}




var document=function(startDoc){
var doc=startDoc;
var frame=getFrameElement(doc);
while(frame){
doc=frame.ownerDocument;
frame=getFrameElement(doc);
}
return doc;
}(window.document);







var registry=[];






var crossOriginUpdater=null;





var crossOriginRect=null;







function IntersectionObserverEntry(entry){
this.time=entry.time;
this.target=entry.target;
this.rootBounds=ensureDOMRect(entry.rootBounds);
this.boundingClientRect=ensureDOMRect(entry.boundingClientRect);
this.intersectionRect=ensureDOMRect(
entry.intersectionRect||getEmptyRect());

this.isIntersecting=!!entry.intersectionRect;


var targetRect=this.boundingClientRect;
var targetArea=targetRect.width*targetRect.height;
var intersectionRect=this.intersectionRect;
var intersectionArea=intersectionRect.width*intersectionRect.height;


if(targetArea){


this.intersectionRatio=Number(
(intersectionArea/targetArea).toFixed(4));

}else{

this.intersectionRatio=this.isIntersecting?1:0;
}
}










function IntersectionObserver(callback,opt_options){
var options=opt_options||{};

if(typeof callback!='function'){
throw new Error('callback must be a function');
}

if(
options.root&&
options.root.nodeType!=1&&
options.root.nodeType!=9)
{
throw new Error('root must be a Document or Element');
}


this._checkForIntersections=throttle(
this._checkForIntersections.bind(this),
this.THROTTLE_TIMEOUT);



this._callback=callback;
this._observationTargets=[];
this._queuedEntries=[];
this._rootMarginValues=this._parseRootMargin(options.rootMargin);


this.thresholds=this._initThresholds(options.threshold);
this.root=options.root||null;
this.rootMargin=this._rootMarginValues.
map(function _rootMarginValues_map_$0(margin){
return margin.value+margin.unit;
}).
join(' ');


this._monitoringDocuments=[];

this._monitoringUnsubscribes=[];
}





IntersectionObserver.prototype.THROTTLE_TIMEOUT=100;






IntersectionObserver.prototype.POLL_INTERVAL=null;





IntersectionObserver.prototype.USE_MUTATION_OBSERVER=true;










IntersectionObserver._setupCrossOriginUpdater=function(){
if(!crossOriginUpdater){




crossOriginUpdater=function crossOriginUpdater(boundingClientRect,intersectionRect){
if(!boundingClientRect||!intersectionRect){
crossOriginRect=getEmptyRect();
}else{
crossOriginRect=convertFromParentRect(
boundingClientRect,
intersectionRect);

}
registry.forEach(function registry_forEach_$0(observer){
observer._checkForIntersections();
});
};
}
return crossOriginUpdater;
};




IntersectionObserver._resetCrossOriginUpdater=function(){
crossOriginUpdater=null;
crossOriginRect=null;
};






IntersectionObserver.prototype.observe=function(target){
var isTargetAlreadyObserved=this._observationTargets.some(
function _observationTargets_some_$0(item){
return item.element==target;
});


if(isTargetAlreadyObserved){
return;
}

if(!(target&&target.nodeType==1)){
throw new Error('target must be an Element');
}

this._registerInstance();
this._observationTargets.push({element:target,entry:null});
this._monitorIntersections(target.ownerDocument);
this._checkForIntersections();
};





IntersectionObserver.prototype.unobserve=function(target){
this._observationTargets=this._observationTargets.filter(function _observationTargets_filter_$0(item){
return item.element!=target;
});
this._unmonitorIntersections(target.ownerDocument);
if(this._observationTargets.length==0){
this._unregisterInstance();
}
};




IntersectionObserver.prototype.disconnect=function(){
this._observationTargets=[];
this._unmonitorAllIntersections();
this._unregisterInstance();
};







IntersectionObserver.prototype.takeRecords=function(){
var records=this._queuedEntries.slice();
this._queuedEntries=[];
return records;
};










IntersectionObserver.prototype._initThresholds=function(opt_threshold){
var threshold=opt_threshold||[0];
if(!Array.isArray(threshold))threshold=[threshold];

return threshold.sort().filter(function filter_$0(t,i,a){
if(typeof t!='number'||isNaN(t)||t<0||t>1){
throw new Error(
'threshold must be a number between 0 and 1 inclusively');

}
return t!==a[i-1];
});
};












IntersectionObserver.prototype._parseRootMargin=function(opt_rootMargin){
var marginString=opt_rootMargin||'0px';
var margins=marginString.split(/\s+/).map(function map_$0(margin){
var parts=/^(-?\d*\.?\d+)(px|%)$/.exec(margin);
if(!parts){
throw new Error('rootMargin must be specified in pixels or percent');
}
return{value:parseFloat(parts[1]),unit:parts[2]};
});


margins[1]=margins[1]||margins[0];
margins[2]=margins[2]||margins[0];
margins[3]=margins[3]||margins[1];

return margins;
};







IntersectionObserver.prototype._monitorIntersections=function(doc){
var win=doc.defaultView;
if(!win){

return;
}
if(this._monitoringDocuments.indexOf(doc)!=-1){

return;
}


var callback=this._checkForIntersections;
var monitoringInterval=null;
var domObserver=null;



if(this.POLL_INTERVAL){
monitoringInterval=win.setInterval(callback,this.POLL_INTERVAL);
}else{
addEvent(win,'resize',callback,true);
addEvent(doc,'scroll',callback,true);
if(this.USE_MUTATION_OBSERVER&&'MutationObserver'in win){
domObserver=new win.MutationObserver(callback);
domObserver.observe(doc,{
attributes:true,
childList:true,
characterData:true,
subtree:true});

}
}

this._monitoringDocuments.push(doc);
this._monitoringUnsubscribes.push(function _monitoringUnsubscribes_push_$0(){


var win=doc.defaultView;

if(win){
if(monitoringInterval){
win.clearInterval(monitoringInterval);
}
removeEvent(win,'resize',callback,true);
}

removeEvent(doc,'scroll',callback,true);
if(domObserver){
domObserver.disconnect();
}
});


var rootDoc=
this.root&&(this.root.ownerDocument||this.root)||document;
if(doc!=rootDoc){
var frame=getFrameElement(doc);
if(frame){
this._monitorIntersections(frame.ownerDocument);
}
}
};






IntersectionObserver.prototype._unmonitorIntersections=function(doc){
var index=this._monitoringDocuments.indexOf(doc);
if(index==-1){
return;
}

var rootDoc=
this.root&&(this.root.ownerDocument||this.root)||document;


var hasDependentTargets=this._observationTargets.some(function _observationTargets_some_$0(item){
var itemDoc=item.element.ownerDocument;

if(itemDoc==doc){
return true;
}

while(itemDoc&&itemDoc!=rootDoc){
var frame=getFrameElement(itemDoc);
itemDoc=frame&&frame.ownerDocument;
if(itemDoc==doc){
return true;
}
}
return false;
});
if(hasDependentTargets){
return;
}


var unsubscribe=this._monitoringUnsubscribes[index];
this._monitoringDocuments.splice(index,1);
this._monitoringUnsubscribes.splice(index,1);
unsubscribe();


if(doc!=rootDoc){
var frame=getFrameElement(doc);
if(frame){
this._unmonitorIntersections(frame.ownerDocument);
}
}
};






IntersectionObserver.prototype._unmonitorAllIntersections=function(){
var unsubscribes=this._monitoringUnsubscribes.slice(0);
this._monitoringDocuments.length=0;
this._monitoringUnsubscribes.length=0;
for(var i=0;i<unsubscribes.length;i++){
unsubscribes[i]();
}
};







IntersectionObserver.prototype._checkForIntersections=function(){
if(!this.root&&crossOriginUpdater&&!crossOriginRect){

return;
}

var rootIsInDom=this._rootIsInDom();
var rootRect=rootIsInDom?this._getRootRect():getEmptyRect();

this._observationTargets.forEach(function _observationTargets_forEach_$0(item){
var target=item.element;
var targetRect=getBoundingClientRect(target);
var rootContainsTarget=this._rootContainsTarget(target);
var oldEntry=item.entry;
var intersectionRect=
rootIsInDom&&
rootContainsTarget&&
this._computeTargetAndRootIntersection(target,targetRect,rootRect);

var rootBounds=null;
if(!this._rootContainsTarget(target)){
rootBounds=getEmptyRect();
}else if(!crossOriginUpdater||this.root){
rootBounds=rootRect;
}

var newEntry=item.entry=new IntersectionObserverEntry({
time:now(),
target:target,
boundingClientRect:targetRect,
rootBounds:rootBounds,
intersectionRect:intersectionRect});


if(!oldEntry){
this._queuedEntries.push(newEntry);
}else if(rootIsInDom&&rootContainsTarget){


if(this._hasCrossedThreshold(oldEntry,newEntry)){
this._queuedEntries.push(newEntry);
}
}else{



if(oldEntry&&oldEntry.isIntersecting){
this._queuedEntries.push(newEntry);
}
}
},this);

if(this._queuedEntries.length){
this._callback(this.takeRecords(),this);
}
};














IntersectionObserver.prototype._computeTargetAndRootIntersection=function(
target,
targetRect,
rootRect)
{

if(window.getComputedStyle(target).display=='none')return;

var intersectionRect=targetRect;
var parent=getParentNode(target);
var atRoot=false;

while(!atRoot&&parent){
var parentRect=null;
var parentComputedStyle=
parent.nodeType==1?window.getComputedStyle(parent):{};


if(parentComputedStyle.display=='none')return null;

if(parent==this.root||parent.nodeType==9){
atRoot=true;
if(parent==this.root||parent==document){
if(crossOriginUpdater&&!this.root){
if(
!crossOriginRect||
crossOriginRect.width==0&&crossOriginRect.height==0)
{

parent=null;
parentRect=null;
intersectionRect=null;
}else{
parentRect=crossOriginRect;
}
}else{
parentRect=rootRect;
}
}else{

var frame=getParentNode(parent);
var frameRect=frame&&getBoundingClientRect(frame);
var frameIntersect=
frame&&
this._computeTargetAndRootIntersection(frame,frameRect,rootRect);
if(frameRect&&frameIntersect){
parent=frame;
parentRect=convertFromParentRect(frameRect,frameIntersect);
}else{
parent=null;
intersectionRect=null;
}
}
}else{




var doc=parent.ownerDocument;
if(
parent!=doc.body&&
parent!=doc.documentElement&&
parentComputedStyle.overflow!='visible')
{
parentRect=getBoundingClientRect(parent);
}
}



if(parentRect){
intersectionRect=computeRectIntersection(
parentRect,
intersectionRect);

}
if(!intersectionRect)break;
parent=parent&&getParentNode(parent);
}
return intersectionRect;
};






IntersectionObserver.prototype._getRootRect=function(){
var rootRect;
if(this.root&&!isDoc(this.root)){
rootRect=getBoundingClientRect(this.root);
}else{

var doc=isDoc(this.root)?this.root:document;
var html=doc.documentElement;
var body=doc.body;
rootRect={
top:0,
left:0,
right:html.clientWidth||body.clientWidth,
width:html.clientWidth||body.clientWidth,
bottom:html.clientHeight||body.clientHeight,
height:html.clientHeight||body.clientHeight};

}
return this._expandRectByRootMargin(rootRect);
};







IntersectionObserver.prototype._expandRectByRootMargin=function(rect){
var margins=this._rootMarginValues.map(function _rootMarginValues_map_$0(margin,i){
return margin.unit=='px'?
margin.value:
margin.value*(i%2?rect.width:rect.height)/100;
});
var newRect={
top:rect.top-margins[0],
right:rect.right+margins[1],
bottom:rect.bottom+margins[2],
left:rect.left-margins[3]};

newRect.width=newRect.right-newRect.left;
newRect.height=newRect.bottom-newRect.top;

return newRect;
};











IntersectionObserver.prototype._hasCrossedThreshold=function(
oldEntry,
newEntry)
{


var oldRatio=
oldEntry&&oldEntry.isIntersecting?
oldEntry.intersectionRatio||0:
-1;
var newRatio=newEntry.isIntersecting?
newEntry.intersectionRatio||0:
-1;


if(oldRatio===newRatio)return;

for(var i=0;i<this.thresholds.length;i++){
var threshold=this.thresholds[i];



if(
threshold==oldRatio||
threshold==newRatio||
threshold<oldRatio!==threshold<newRatio)
{
return true;
}
}
};






IntersectionObserver.prototype._rootIsInDom=function(){
return!this.root||containsDeep(document,this.root);
};







IntersectionObserver.prototype._rootContainsTarget=function(target){
var rootDoc=
this.root&&(this.root.ownerDocument||this.root)||document;
return(
containsDeep(rootDoc,target)&&(
!this.root||rootDoc==target.ownerDocument));

};






IntersectionObserver.prototype._registerInstance=function(){
if(registry.indexOf(this)<0){
registry.push(this);
}
};





IntersectionObserver.prototype._unregisterInstance=function(){
var index=registry.indexOf(this);
if(index!=-1)registry.splice(index,1);
};






function now(){
return window.performance&&performance.now&&performance.now();
}









function throttle(fn,timeout){
var timer=null;
return function(){
if(!timer){
timer=setTimeout(function setTimeout_$0(){
fn();
timer=null;
},timeout);
}
};
}









function addEvent(node,event,fn,opt_useCapture){
if(typeof node.addEventListener=='function'){
node.addEventListener(event,fn,opt_useCapture||false);
}else if(typeof node.attachEvent=='function'){
node.attachEvent('on'+event,fn);
}
}









function removeEvent(node,event,fn,opt_useCapture){
if(typeof node.removeEventListener=='function'){
node.removeEventListener(event,fn,opt_useCapture||false);
}else if(typeof node.detachEvent=='function'){
node.detachEvent('on'+event,fn);
}
}








function computeRectIntersection(rect1,rect2){
var top=Math.max(rect1.top,rect2.top);
var bottom=Math.min(rect1.bottom,rect2.bottom);
var left=Math.max(rect1.left,rect2.left);
var right=Math.min(rect1.right,rect2.right);
var width=right-left;
var height=bottom-top;

return(
width>=0&&
height>=0&&{
top:top,
bottom:bottom,
left:left,
right:right,
width:width,
height:height}||

null);

}






function getBoundingClientRect(el){
var rect;

try{
rect=el.getBoundingClientRect();
}catch(err){


}

if(!rect)return getEmptyRect();


if(!(rect.width&&rect.height)){
rect={
top:rect.top,
right:rect.right,
bottom:rect.bottom,
left:rect.left,
width:rect.right-rect.left,
height:rect.bottom-rect.top};

}
return rect;
}






function getEmptyRect(){
return{
top:0,
bottom:0,
left:0,
right:0,
width:0,
height:0};

}








function ensureDOMRect(rect){

if(!rect||'x'in rect){
return rect;
}




return{
top:rect.top,
y:rect.top,
bottom:rect.bottom,
left:rect.left,
x:rect.left,
right:rect.right,
width:rect.width,
height:rect.height};

}








function convertFromParentRect(parentBoundingRect,parentIntersectionRect){
var top=parentIntersectionRect.top-parentBoundingRect.top;
var left=parentIntersectionRect.left-parentBoundingRect.left;
return{
top:top,
left:left,
height:parentIntersectionRect.height,
width:parentIntersectionRect.width,
bottom:top+parentIntersectionRect.height,
right:left+parentIntersectionRect.width};

}








function containsDeep(parent,child){
var node=child;
while(node){
if(node==parent)return true;

node=getParentNode(node);
}
return false;
}







function getParentNode(node){
var parent=node.parentNode;

if(node.nodeType==9&&node!=document){

return getFrameElement(node);
}


if(parent&&parent.assignedSlot){
parent=parent.assignedSlot.parentNode;
}

if(parent&&parent.nodeType==11&&parent.host){

return parent.host;
}

return parent;
}






function isDoc(node){
return node&&node.nodeType===9;
}


window.IntersectionObserver=IntersectionObserver;
window.IntersectionObserverEntry=IntersectionObserverEntry;
})();
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Added protection for some common (ab)uses of JSON.stringify, applied on top
 * of the native implementation if possible.
 *
 * With the standard implementation,
 *   eval(JSON.stringify('\u2028'))
 * crashes (\u2028 is a newline in JS but not escaped in JSON), and
 *   location = 'javascript:alert(' + JSON.stringify(s) + ')';
 * is an XSS hole.
 *
 * This pollyfill is only needed on older browser as this was fixed in ECMA2019
 * See https://v8.dev/features/subsume-json
 * https://github.com/tc39/proposal-json-superset
 * And https://caniuse.com/mdn-javascript_builtins_json_json_superset
 *
 * Important: the polyfill annotation does not work (not yet supported by makehase).
 * Once haste supports it, the value should be firefox<62 chrome<66 safari<12 mobile_safari<12 other<ALL
 *
 * @provides JSON-shield
 * @polyfillUAs
 * @noflow
 * @nolint
 */

(function(){
function shouldUsePolyfill(){

if(typeof JSON!=='object'||typeof JSON.stringify!=='function'){
return false;
}








if(typeof navigator==='undefined'||!navigator.userAgent){
return true;
}
var userAgent=navigator.userAgent;




if(userAgent.indexOf('Firefox/')>-1){
return!(parseInt(userAgent.match(/Firefox\/([0-9]+)/)[1],10)>=62);
}else if(userAgent.indexOf('Edg/')>-1){
return!(parseInt(userAgent.match(/Edg\/([0-9]+)/)[1],10)>=79);
}else if(userAgent.indexOf('Chrome/')>-1){
return!(parseInt(userAgent.match(/Chrome\/([0-9]+)/)[1],10)>=66);
}else if(userAgent.indexOf('CriOS/')>-1){
return!(parseInt(userAgent.match(/CriOS\/([0-9]+)/)[1],10)>=66);
}else if(userAgent.indexOf('Safari/')>-1){
if(userAgent.indexOf('Version/')>-1){
return!(parseInt(userAgent.match(/Version\/([0-9]+)/)[1],10)>=12);
}
}
return true;
}

function isAlreadyPolyfilled(){

return JSON.stringify(['\u2028\u2029'])==='["\\u2028\\u2029"]';
}

if(shouldUsePolyfill()&&!isAlreadyPolyfilled()){
JSON.stringify=function(stringify){

var u2028=/\u2028/g,
u2029=/\u2029/g;

return function JSONShieldedStringify(any,replacer,space){
var json=stringify.call(this,any,replacer,space);
if(json){
if(-1<json.indexOf('\u2028')){
json=json.replace(u2028,'\\u2028');
}
if(-1<json.indexOf('\u2029')){
json=json.replace(u2029,'\\u2029');
}
}
return json;
};
}(JSON.stringify);
}
})();

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - Object.entries (https://caniuse.com/object-entries)
 * - Object.fromEntries (https://caniuse.com/mdn-javascript_builtins_object_fromentries)
 * - Object.values (https://caniuse.com/object-values)
 *
 * @noflow
 * @noformat
 * @polyfillUAs
 * @provides Object.es7
 */

(function(){

var hasOwnProperty=Object.prototype.hasOwnProperty;









Object.entries=function(object){

if(object==null){
throw new TypeError('Object.entries called on non-object');
}

var entries=[];
for(var key in object){
if(hasOwnProperty.call(object,key)){
entries.push([key,object[key]]);
}
}
return entries;
};









if(typeof Object.fromEntries!=='function'){
Object.fromEntries=function fromEntries(iterable){
var obj={};
for(var _iterator=iterable,_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]();;){var _ref2;if(_isArray){if(_i>=_iterator.length)break;_ref2=_iterator[_i++];}else{_i=_iterator.next();if(_i.done)break;_ref2=_i.value;}var _ref3=_ref2;var key=_ref3[0];var val=_ref3[1];
obj[key]=val;
}
return obj;
};
}









Object.values=function(object){

if(object==null){
throw new TypeError('Object.values called on non-object');
}

var values=[];
for(var key in object){
if(hasOwnProperty.call(object,key)){
values.push(object[key]);
}
}
return values;
};


})();


/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - `ResizeObserver` (https://caniuse.com/ResizeObserver)
 *
 * This is a copy/paste of this polyfill:
 *  - https://github.com/que-etc/resize-observer-polyfill/blob/master/dist/ResizeObserver.js
 *
 * @format
 * @nolint
 * @oncall jsinfra
 * @polyfillUAs old webkit modern
 * @provides ResizeObserver
 */

(function(){

if(typeof window!=='object'){
return;
}








var MapShim=function(){
if(typeof Map!=='undefined'){
return Map;
}







function getIndex(arr,key){
var result=-1;
arr.some(function arr_some_$0(entry,index){
if(entry[0]===key){
result=index;
return true;
}
return false;
});
return result;
}
return function(){
function class_1(){
this.__entries__=[];
}
Object.defineProperty(class_1.prototype,'size',{



get:function get(){
return this.__entries__.length;
},
enumerable:true,
configurable:true});





class_1.prototype.get=function(key){
var index=getIndex(this.__entries__,key);
var entry=this.__entries__[index];
return entry&&entry[1];
};





class_1.prototype.set=function(key,value){
var index=getIndex(this.__entries__,key);
if(~index){
this.__entries__[index][1]=value;
}else{
this.__entries__.push([key,value]);
}
};




class_1.prototype["delete"]=function(key){
var entries=this.__entries__;
var index=getIndex(entries,key);
if(~index){
entries.splice(index,1);
}
};




class_1.prototype.has=function(key){
return!!~getIndex(this.__entries__,key);
};



class_1.prototype.clear=function(){
this.__entries__.splice(0);
};





class_1.prototype.forEach=function(callback,ctx){
if(ctx===void 0){
ctx=null;
}
for(var _i=0,_a=this.__entries__;_i<_a.length;_i++){
var entry=_a[_i];
callback.call(ctx,entry[1],entry[0]);
}
};
return class_1;
}();
}();





var isBrowser=
typeof window!=='undefined'&&
typeof document!=='undefined'&&
window.document===document;


var global$1=function(){
if(typeof global!=='undefined'&&global.Math===Math){
return global;
}
if(typeof self!=='undefined'&&self.Math===Math){
return self;
}
if(typeof window!=='undefined'&&window.Math===Math){
return window;
}

return Function('return this')();
}();







var requestAnimationFrame$1=function(){
if(typeof requestAnimationFrame==='function'){



return requestAnimationFrame.bind(global$1);
}
return function(callback){
return setTimeout(function setTimeout_$0(){
return callback(Date.now());
},1000/60);
};
}();


var trailingTimeout=2;








function throttle(callback,delay){
var leadingCall=false;
var trailingCall=false;
var lastCallTime=0;






function resolvePending(){
if(leadingCall){
leadingCall=false;
callback();
}
if(trailingCall){
proxy();
}
}







function timeoutCallback(){
requestAnimationFrame$1(resolvePending);
}





function proxy(){
var timeStamp=Date.now();
if(leadingCall){

if(timeStamp-lastCallTime<trailingTimeout){
return;
}




trailingCall=true;
}else{
leadingCall=true;
trailingCall=false;
setTimeout(timeoutCallback,delay);
}
lastCallTime=timeStamp;
}
return proxy;
}


var REFRESH_DELAY=20;


var transitionKeys=[
'top',
'right',
'bottom',
'left',
'width',
'height',
'size',
'weight'];


var mutationObserverSupported=typeof MutationObserver!=='undefined';




var ResizeObserverController=function(){





function ResizeObserverController(){





this.connected_=false;





this.mutationEventsAdded_=false;





this.mutationsObserver_=null;





this.observers_=[];
this.onTransitionEnd_=this.onTransitionEnd_.bind(this);
this.refresh=throttle(this.refresh.bind(this),REFRESH_DELAY);
}






ResizeObserverController.prototype.addObserver=function(observer){
if(!~this.observers_.indexOf(observer)){
this.observers_.push(observer);
}

if(!this.connected_){
this.connect_();
}
};






ResizeObserverController.prototype.removeObserver=function(observer){
var observers=this.observers_;
var index=observers.indexOf(observer);

if(~index){
observers.splice(index,1);
}

if(!observers.length&&this.connected_){
this.disconnect_();
}
};






ResizeObserverController.prototype.refresh=function(){
var changesDetected=this.updateObservers_();


if(changesDetected){
this.refresh();
}
};








ResizeObserverController.prototype.updateObservers_=function(){

var activeObservers=this.observers_.filter(function observers__filter_$0(observer){
return observer.gatherActive(),observer.hasActive();
});






activeObservers.forEach(function activeObservers_forEach_$0(observer){
return observer.broadcastActive();
});
return activeObservers.length>0;
};






ResizeObserverController.prototype.connect_=function(){


if(!isBrowser||this.connected_){
return;
}



document.addEventListener('transitionend',this.onTransitionEnd_);
window.addEventListener('resize',this.refresh);
if(mutationObserverSupported){
this.mutationsObserver_=new MutationObserver(this.refresh);
this.mutationsObserver_.observe(document,{
attributes:true,
childList:true,
characterData:true,
subtree:true});

}else{
document.addEventListener('DOMSubtreeModified',this.refresh);
this.mutationEventsAdded_=true;
}
this.connected_=true;
};






ResizeObserverController.prototype.disconnect_=function(){


if(!isBrowser||!this.connected_){
return;
}
document.removeEventListener('transitionend',this.onTransitionEnd_);
window.removeEventListener('resize',this.refresh);
if(this.mutationsObserver_){
this.mutationsObserver_.disconnect();
}
if(this.mutationEventsAdded_){
document.removeEventListener('DOMSubtreeModified',this.refresh);
}
this.mutationsObserver_=null;
this.mutationEventsAdded_=false;
this.connected_=false;
};







ResizeObserverController.prototype.onTransitionEnd_=function(_a){
var _b=_a.propertyName;
var propertyName=_b===void 0?'':_b;

var isReflowProperty=transitionKeys.some(function transitionKeys_some_$0(key){
return!!~propertyName.indexOf(key);
});
if(isReflowProperty){
this.refresh();
}
};





ResizeObserverController.getInstance=function(){
if(!this.instance_){
this.instance_=new ResizeObserverController();
}
return this.instance_;
};





ResizeObserverController.instance_=null;
return ResizeObserverController;
}();








var defineConfigurable=function defineConfigurable(target,props){
for(var _i=0,_a=Object.keys(props);_i<_a.length;_i++){
var key=_a[_i];
Object.defineProperty(target,key,{
value:props[key],
enumerable:false,
writable:false,
configurable:true});

}
return target;
};







var getWindowOf=function getWindowOf(target){



var ownerGlobal=
target&&target.ownerDocument&&target.ownerDocument.defaultView;


return ownerGlobal||global$1;
};


var emptyRect=createRectInit(0,0,0,0);






function toFloat(value){
return parseFloat(value)||0;
}







function getBordersSize(styles){
var positions=[];
for(var _i=1;_i<arguments.length;_i++){
positions[_i-1]=arguments[_i];
}
return positions.reduce(function positions_reduce_$0(size,position){
var value=styles['border-'+position+'-width'];
return size+toFloat(value);
},0);
}






function getPaddings(styles){
var positions=['top','right','bottom','left'];
var paddings={};
for(var _i=0,positions_1=positions;_i<positions_1.length;_i++){
var position=positions_1[_i];
var value=styles['padding-'+position];
paddings[position]=toFloat(value);
}
return paddings;
}







function getSVGContentRect(target){
var bbox=target.getBBox();
return createRectInit(0,0,bbox.width,bbox.height);
}







function getHTMLElementContentRect(target){


var clientWidth=target.clientWidth;
var clientHeight=target.clientHeight;








if(!clientWidth&&!clientHeight){
return emptyRect;
}
var styles=getWindowOf(target).getComputedStyle(target);
var paddings=getPaddings(styles);
var horizPad=paddings.left+paddings.right;
var vertPad=paddings.top+paddings.bottom;





var width=toFloat(styles.width);
var height=toFloat(styles.height);


if(styles.boxSizing==='border-box'){






if(Math.round(width+horizPad)!==clientWidth){
width-=getBordersSize(styles,'left','right')+horizPad;
}
if(Math.round(height+vertPad)!==clientHeight){
height-=getBordersSize(styles,'top','bottom')+vertPad;
}
}




if(!isDocumentElement(target)){




var vertScrollbar=Math.round(width+horizPad)-clientWidth;
var horizScrollbar=Math.round(height+vertPad)-clientHeight;





if(Math.abs(vertScrollbar)!==1){
width-=vertScrollbar;
}
if(Math.abs(horizScrollbar)!==1){
height-=horizScrollbar;
}
}
return createRectInit(paddings.left,paddings.top,width,height);
}






var isSVGGraphicsElement=function(){


if(typeof SVGGraphicsElement!=='undefined'){
return function(target){
return target instanceof getWindowOf(target).SVGGraphicsElement;
};
}



return function(target){
return(
target instanceof getWindowOf(target).SVGElement&&
typeof target.getBBox==='function');

};
}();






function isDocumentElement(target){
return target===getWindowOf(target).document.documentElement;
}








function getContentRect(target){
if(!isBrowser){
return emptyRect;
}
if(isSVGGraphicsElement(target)){
return getSVGContentRect(target);
}
return getHTMLElementContentRect(target);
}








function createReadOnlyRect(_a){
var x=_a.x;
var y=_a.y;
var width=_a.width;
var height=_a.height;

var Constr=
typeof DOMRectReadOnly!=='undefined'?DOMRectReadOnly:Object;
var rect=Object.create(Constr.prototype);

defineConfigurable(rect,{
x:x,
y:y,
width:width,
height:height,
top:y,
right:x+width,
bottom:height+y,
left:x});

return rect;
}











function createRectInit(x,y,width,height){
return{x:x,y:y,width:width,height:height};
}





var ResizeObservation=function(){





function ResizeObservation(target){





this.broadcastWidth=0;





this.broadcastHeight=0;





this.contentRect_=createRectInit(0,0,0,0);
this.target=target;
}







ResizeObservation.prototype.isActive=function(){
var rect=getContentRect(this.target);
this.contentRect_=rect;
return(
rect.width!==this.broadcastWidth||
rect.height!==this.broadcastHeight);

};






ResizeObservation.prototype.broadcastRect=function(){
var rect=this.contentRect_;
this.broadcastWidth=rect.width;
this.broadcastHeight=rect.height;
return rect;
};
return ResizeObservation;
}();

var ResizeObserverEntry=function(){






function ResizeObserverEntry(target,rectInit){
var contentRect=createReadOnlyRect(rectInit);






defineConfigurable(this,{target:target,contentRect:contentRect});
}
return ResizeObserverEntry;
}();

var ResizeObserverSPI=function(){











function ResizeObserverSPI(callback,controller,callbackCtx){






this.activeObservations_=[];





this.observations_=new MapShim();
if(typeof callback!=='function'){
throw new TypeError(
'The callback provided as parameter 1 is not a function.');

}
this.callback_=callback;
this.controller_=controller;
this.callbackCtx_=callbackCtx;
}






ResizeObserverSPI.prototype.observe=function(target){
if(!arguments.length){
throw new TypeError('1 argument required, but only 0 present.');
}

if(typeof Element==='undefined'||!(Element instanceof Object)){
return;
}
if(!(target instanceof getWindowOf(target).Element)){
throw new TypeError('parameter 1 is not of type "Element".');
}
var observations=this.observations_;

if(observations.has(target)){
return;
}
observations.set(target,new ResizeObservation(target));
this.controller_.addObserver(this);

this.controller_.refresh();
};






ResizeObserverSPI.prototype.unobserve=function(target){
if(!arguments.length){
throw new TypeError('1 argument required, but only 0 present.');
}

if(typeof Element==='undefined'||!(Element instanceof Object)){
return;
}
if(!(target instanceof getWindowOf(target).Element)){
throw new TypeError('parameter 1 is not of type "Element".');
}
var observations=this.observations_;

if(!observations.has(target)){
return;
}
observations["delete"](target);
if(!observations.size){
this.controller_.removeObserver(this);
}
};





ResizeObserverSPI.prototype.disconnect=function(){
this.clearActive();
this.observations_.clear();
this.controller_.removeObserver(this);
};






ResizeObserverSPI.prototype.gatherActive=function(){
var _this=this;
this.clearActive();
this.observations_.forEach(function observations__forEach_$0(observation){
if(observation.isActive()){
_this.activeObservations_.push(observation);
}
});
};






ResizeObserverSPI.prototype.broadcastActive=function(){

if(!this.hasActive()){
return;
}
var ctx=this.callbackCtx_;

var entries=this.activeObservations_.map(function activeObservations__map_$0(observation){
return new ResizeObserverEntry(
observation.target,
observation.broadcastRect());

});
this.callback_.call(ctx,entries,ctx);
this.clearActive();
};





ResizeObserverSPI.prototype.clearActive=function(){
this.activeObservations_.splice(0);
};





ResizeObserverSPI.prototype.hasActive=function(){
return this.activeObservations_.length>0;
};
return ResizeObserverSPI;
}();




var observers=
typeof WeakMap!=='undefined'?new WeakMap():new MapShim();




var ResizeObserver=function(){






function ResizeObserver(callback){
if(!(this instanceof ResizeObserver)){
throw new TypeError('Cannot call a class as a function.');
}
if(!arguments.length){
throw new TypeError('1 argument required, but only 0 present.');
}
var controller=ResizeObserverController.getInstance();
var observer=new ResizeObserverSPI(callback,controller,this);
observers.set(this,observer);
}
return ResizeObserver;
}();


['observe','unobserve','disconnect'].forEach(function forEach_$0(method){
ResizeObserver.prototype[method]=function(){
var _a;
return(_a=observers.get(this))[method].apply(_a,arguments);
};
});


window.ResizeObserver=ResizeObserver;
})();
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @noflow
 * @noformat
 * @nosourcemeta
 * @nostacktrace
 * @oncall static_resources
 * @polyfillUAs
 * @provides SourceMetaAnnotator
 */




(function(global){
global.__m=function(fn,meta){
fn.__SMmeta=meta;
return fn;
};
})(
typeof globalThis!=='undefined'?
globalThis:
typeof global!=='undefined'?
global:
typeof window!=='undefined'?
window:
typeof this!=='undefined'?
this:
typeof self!=='undefined'?
self:
{});
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - String.fromCodePoint (https://caniuse.com/mdn-javascript_builtins_string_fromcodepoint)
 *
 * @noflow
 * @noformat
 * @polyfillUAs old webkit modern
 * @provides String.es6
 */



if(typeof String.fromCodePoint!=='function'){
String.fromCodePoint=function(){

var utf16Chars=[];

for(var i=0;i<arguments.length;i++){
var codePoint=Number(i<0||arguments.length<=i?undefined:arguments[i]);


if(
!isFinite(codePoint)||
Math.floor(codePoint)!=codePoint||
codePoint<0||0x10FFFF<codePoint)
{
throw RangeError('Invalid code point '+codePoint);
}

if(codePoint<0x10000){
utf16Chars.push(String.fromCharCode(codePoint));
}else{
codePoint-=0x10000;
utf16Chars.push(
String.fromCharCode((codePoint>>10)+0xD800),
String.fromCharCode(codePoint%0x400+0xDC00));

}
}

return utf16Chars.join('');
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - ES6 String.prototype functions (https://caniuse.com/es6)
 *
 * @noflow
 * @noformat
 * @polyfillUAs old webkit modern
 * @provides String.prototype.es6
 */







if(!String.prototype.startsWith){
String.prototype.startsWith=function(search){
"use strict";
if(this==null){
throw TypeError();
}
var string=String(this);
var pos=arguments.length>1?
Number(arguments[1])||0:0;
var start=Math.min(Math.max(pos,0),string.length);
return string.indexOf(String(search),pos)==start;
};
}

if(!String.prototype.endsWith){
String.prototype.endsWith=function(search){
"use strict";
if(this==null){
throw TypeError();
}
var string=String(this);
var stringLength=string.length;
var searchString=String(search);
var pos=arguments.length>1?
Number(arguments[1])||0:stringLength;
var end=Math.min(Math.max(pos,0),stringLength);
var start=end-searchString.length;
if(start<0){
return false;
}
return string.lastIndexOf(searchString,start)==start;
};
}

if(!String.prototype.includes){
String.prototype.includes=function(search){
"use strict";
if(this==null){
throw TypeError();
}
var string=String(this);
var pos=arguments.length>1?
Number(arguments[1])||0:0;
return string.indexOf(String(search),pos)!=-1;
};
}

if(!String.prototype.repeat){
String.prototype.repeat=function(count){
"use strict";
if(this==null){
throw TypeError();
}
var string=String(this);
count=Number(count)||0;
if(count<0||count===Infinity){
throw RangeError();
}
if(count===1){
return string;
}
var result='';
while(count){
if(count&1){
result+=string;
}
if(count>>=1){
string+=string;
}
}
return result;
};
}

if(!String.prototype.codePointAt){
String.prototype.codePointAt=function(pos){
'use strict';


if(this==null){
throw TypeError('Invalid context: '+this);
}

var str=String(this);
var size=str.length;

pos=Number(pos)||0;
if(pos<0||size<=pos){
return undefined;
}

var chr1=str.charCodeAt(pos);
if(0xD800<=chr1&&chr1<=0xDBFF&&size>pos+1){
var chr2=str.charCodeAt(pos+1);
if(0xDC00<=chr2&&chr2<=0xDFFF){
return(chr1-0xD800)*0x400+chr2-0xDC00+0x10000;
}
}
return chr1;
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * .contains() is non-standard so we have to polyfill it for all browsers. It
 * should be replaced with .includes() which is standardized and identical, but
 * there seem to be hundreds of uses so it will be difficult to do practically.
 *
 * @noflow
 * @noformat
 * @polyfillUAs
 * @provides String.prototype.contains
 * @requires String.prototype.es6
 */




if(!String.prototype.contains){
String.prototype.contains=String.prototype.includes;
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - String.prototype.padStart (https://caniuse.com/pad-start-end)
 * - String.prototype.padEnd
 *
 * @format
 * @noflow
 * @oncall jsinfra
 * @polyfillUAs
 * @provides String.prototype.es2017
 * @requires String.prototype.es6
 */


if(!String.prototype.padStart){
String.prototype.padStart=function(targetLength,padString){
targetLength=targetLength>>0;
padString=String(padString||' ');
if(this.length>targetLength){
return String(this);
}else{
targetLength=targetLength-this.length;
if(targetLength>padString.length){
padString+=padString.repeat(targetLength/padString.length);
}
return padString.slice(0,targetLength)+String(this);
}
};
}


if(!String.prototype.padEnd){
String.prototype.padEnd=function(targetLength,padString){
targetLength=targetLength>>0;
padString=String(padString||' ');
if(this.length>targetLength){
return String(this);
}else{
targetLength=targetLength-this.length;
if(targetLength>padString.length){
padString+=padString.repeat(targetLength/padString.length);
}
return String(this)+padString.slice(0,targetLength);
}
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - String.prototype.matchAll (https://caniuse.com/mdn-javascript_builtins_string_matchall)
 *
 * @format
 * @noflow
 * @oncall jsinfra
 * @polyfillUAs
 * @provides String.prototype.es2020
 * @requires String.prototype.es2017
 */


if(!String.prototype.matchAll){
var MAX_CALLS_TO_EXEC=250;


String.prototype.matchAll=function(regex){
if(!regex.global){

throw new TypeError(
'String.prototype.matchAll called with a non-global RegExp argument');

}


var string=String(this);

var matches=[];
var match;
var lastIndex=0;

while((match=regex.exec(string))&&lastIndex++<MAX_CALLS_TO_EXEC){
matches.push(match);
}

return matches;
};
}
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills for:
 * - String.prototype.trimLeft (https://caniuse.com/mdn-javascript_builtins_string_trimstart)
 * - String.prototype.trimRight (https://caniuse.com/mdn-javascript_builtins_string_trimend)
 *
 * @noflow
 * @noformat
 * @polyfillUAs
 * @provides String.prototype.es7
 */

if(!String.prototype.trimLeft){
String.prototype.trimLeft=function(){
return this.replace(/^\s+/,'');
};
}

if(!String.prototype.trimRight){
String.prototype.trimRight=function(){
return this.replace(/\s+$/,'');
};
}





/**
 * Copyright 2021-present Facebook. All Rights Reserved.
 *
 * Overrides URL.createObjectURL and URL.revokeObjectURL, in order to
 * instrument those methods
 *
 * @format
 * @noflow
 * @polyfillUAs
 * @provides URL.createObjectURL
 */

'use strict';

(function(global){
function createObjectURLSupported(){
if(typeof URL!=='function'){
return false;
}

if(
typeof URL.createObjectURL!=='function'||
typeof URL.revokeObjectURL!=='function')
{
return false;
}

if(typeof File!=='function'||typeof Blob!=='function'){
return false;
}

return true;
}

if(!createObjectURLSupported()){
return;
}

var urlRegister={};
var nativeCreateObjectURL=URL.createObjectURL;
var nativeRevokeObjectURL=URL.revokeObjectURL;

URL.createObjectURL=function(object){
var type=null;
var size=0;

if(object instanceof File){
type='File';
size=object.size;
}else if(object instanceof Blob){
type='Blob';
size=object.size;
}else if(
typeof MediaSource==='function'&&
object instanceof MediaSource)
{
type='MediaSource';
size=0;
}

var url=nativeCreateObjectURL.call(URL,object);
if(type!==null){
urlRegister[url]={type:type,size:size};
}
return url;
};

URL.revokeObjectURL=function(url){
nativeRevokeObjectURL.call(URL,url);
delete urlRegister[url];
};


URL._fbRegisteredObjectURL=function(){
return Object.values(urlRegister);
};
})(this);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Provides polyfills necessary for babel.
 *
 * @format
 * @noflow
 * @oncall jsinfra
 * @polyfillUAs
 * @provides babelHelpers
 * @requires Function.prototype
 * @requires Object.es6
 */





(function(global){
var babelHelpers=global.babelHelpers={};
var hasOwn=Object.prototype.hasOwnProperty;

if(typeof Symbol!=='undefined'&&!(typeof Symbol==="function"?Symbol.asyncIterator:"@@asyncIterator")){
Symbol['asyncIterator']=Symbol('Symbol.asyncIterator');
}

function AwaitValue(value){
this.wrapped=value;
}

function AsyncGenerator(gen){
var front,back;
function send(key,arg){
return new Promise(function(resolve,reject){
var request={
key:key,
arg:arg,
resolve:resolve,
reject:reject,
next:null};

if(back){
back=back.next=request;
}else{
front=back=request;
resume(key,arg);
}
});
}
function resume(key,arg){
try{
var result=gen[key](arg);
var value=result.value;
var wrappedAwait=value instanceof AwaitValue;
Promise.resolve(wrappedAwait?value.wrapped:value).then(
function then_$0(arg){
if(wrappedAwait){
resume(key==='return'?'return':'next',arg);
return;
}
settle(result.done?'return':'normal',arg);
},
function then_$1(err){
resume('throw',err);
});

}catch(err){
settle('throw',err);
}
}
function settle(type,value){
switch(type){
case'return':
front.resolve({value:value,done:true});
break;
case'throw':
front.reject(value);
break;
default:
front.resolve({value:value,done:false});
break;}

front=front.next;
if(front){
resume(front.key,front.arg);
}else{
back=null;
}
}
this._invoke=send;

if(typeof gen["return"]!=='function'){
this["return"]=undefined;
}
}
if(typeof Symbol==='function'&&(typeof Symbol==="function"?Symbol.asyncIterator:"@@asyncIterator")){
AsyncGenerator.prototype[typeof Symbol==="function"?Symbol.asyncIterator:"@@asyncIterator"]=function(){
return this;
};
}
AsyncGenerator.prototype.next=function(arg){
return this._invoke('next',arg);
};
AsyncGenerator.prototype["throw"]=function(arg){
return this._invoke('throw',arg);
};
AsyncGenerator.prototype["return"]=function(arg){
return this._invoke('return',arg);
};

babelHelpers.createClass=function(){
function defineProperties(target,props){
for(var i=0;i<props.length;i++){
var descriptor=props[i];
descriptor.enumerable=descriptor.enumerable||false;
descriptor.configurable=true;
if('value'in descriptor){
descriptor.writable=true;
}
Object.defineProperty(target,descriptor.key,descriptor);
}
}

return function(Constructor,protoProps,staticProps){
if(protoProps){
defineProperties(Constructor.prototype,protoProps);
}
if(staticProps){
defineProperties(Constructor,staticProps);
}
return Constructor;
};
}();




babelHelpers.inheritsLoose=function(subClass,superClass){
Object.assign(subClass,superClass);
subClass.prototype=Object.create(superClass&&superClass.prototype);
subClass.prototype.constructor=subClass;
subClass.__superConstructor__=superClass;
return superClass;
};







babelHelpers.wrapNativeSuper=function(Class){
var _cache=typeof Map==='function'?new Map():undefined;

babelHelpers.wrapNativeSuper=function(Class){
if(Class===null){
return null;
}
if(typeof Class!=='function'){
throw new TypeError(
'Super expression must either be null or a function');

}
if(_cache!==undefined){
if(_cache.has(Class)){
return _cache.get(Class);
}
_cache.set(Class,Wrapper);
}
babelHelpers.inheritsLoose(Wrapper,Class);
function Wrapper(){
Class.apply(this,arguments);
}
return Wrapper;
};

return babelHelpers.wrapNativeSuper(Class);
};

babelHelpers.assertThisInitialized=function(self){
if(self===void 0){
throw new ReferenceError(
"this hasn't been initialised - super() hasn't been called");

}
return self;
};




babelHelpers._extends=Object.assign;




babelHelpers["extends"]=babelHelpers._extends;





babelHelpers.construct=function(klass,arr){
return new(Function.prototype.bind.apply(klass,[null].concat(arr)))();
};




babelHelpers.objectWithoutPropertiesLoose=function(obj,keys){
var target={};
for(var i in obj){
if(!hasOwn.call(obj,i)||keys.indexOf(i)>=0){
continue;
}
target[i]=obj[i];
}
return target;
};




babelHelpers.taggedTemplateLiteralLoose=function(strings,raw){
if(!raw){
raw=strings.slice(0);
}
strings.raw=raw;
return strings;
};




babelHelpers.bind=Function.prototype.bind;

babelHelpers.wrapAsyncGenerator=function(fn){
return function(){
return new AsyncGenerator(fn.apply(this,arguments));
};
};

babelHelpers.awaitAsyncGenerator=function(value){
return new AwaitValue(value);
};

babelHelpers.asyncIterator=function(iterable){
var method;
if(typeof Symbol!=='undefined'){
if(typeof Symbol==="function"?Symbol.asyncIterator:"@@asyncIterator"){
method=iterable[Symbol.asyncIterator];
if(method!=null)return method.call(iterable);
}
if(typeof Symbol==="function"?Symbol.iterator:"@@iterator"){
method=iterable[Symbol.iterator];
if(method!=null)return method.call(iterable);
}
}
throw new TypeError('Object is not async iterable');
};

babelHelpers.asyncGeneratorDelegate=function(inner,awaitWrap){
var iter={},
waiting=false;
function pump(key,value){
waiting=true;
value=new Promise(function(resolve){
resolve(inner[key](value));
});
return{done:false,value:awaitWrap(value)};
}
if(typeof Symbol==='function'&&(typeof Symbol==="function"?Symbol.iterator:"@@iterator")){
iter[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]=function(){
return this;
};
}
iter.next=function(value){
if(waiting){
waiting=false;
return value;
}
return pump('next',value);
};
if(typeof inner["throw"]==='function'){
iter["throw"]=function(value){
if(waiting){
waiting=false;
throw value;
}
return pump('throw',value);
};
}
if(typeof inner["return"]==='function'){
iter["return"]=function(value){
if(waiting){
waiting=false;
return value;
}
return pump('return',value);
};
}
return iter;
};
})(typeof global==='undefined'?self:global);

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * This is a lightweigh implementation of require and __d which is used by the
 * JavaScript SDK.
 * This implementation requires that all modules are defined in order by how
 * they depend on each other, so that it is guaranteed that no module will
 * require a module that has not got all of its dependencies satisfied.
 * This means that it is generally only usable in cases where all resources are
 * resolved and packaged together.
 *
 *  strict
 * @format
 * @oncall jsinfra
 * @providesInline fbmodule-runtime-lite
 */




































(function(global){
var map={};

var defaultCJSDeps=[
'global',
'require',
'requireDynamic',
'requireLazy',
'module',
'exports'];

var defaultESMDeps=[
'global',
'require',
'importDefault',
'importNamespace',
'requireLazy',
'module',
'exports'];

var REQUIRE_WHEN_READY=0x1;
var ES_MODULE_IMPORTS=0x20;
var ES_MODULE_EXPORTS=0x40;
var EMPTY={};

var hasOwnProperty=Object.prototype.hasOwnProperty;

function getOrIntializeModule(
id,
soft)
{
if(!hasOwnProperty.call(map,id)){

if(soft){
return null;
}
throw new Error('Module '+id+' has not been defined');
}

var module=map[id];
if(module.resolved){
return module;
}

var _special=module.special;
var length=module.factory.length;

var deps=
_special&ES_MODULE_IMPORTS?
defaultESMDeps.concat(module.deps):
defaultCJSDeps.concat(module.deps);

var args=[];
var dep;
for(var i=0;i<length;i++){
switch(deps[i]){
case'module':
dep=module;
break;
case'exports':
dep=module.exports;
break;
case'global':
dep=global;
break;
case'require':
dep=requireInterop;
break;
case'requireDynamic':
dep=null;
break;
case'requireLazy':
dep=null;
break;
case'importDefault':
dep=importDefault;
break;
case'importNamespace':
dep=importNamespace;
break;
default:
if(typeof deps[i]==='string'){
dep=requireInterop.call(null,deps[i]);
}}

args.push(dep);
}
var ret=module.factory.apply(global,args);


if(ret){
module.exports=ret;
}

if(_special&ES_MODULE_EXPORTS){
if(
module.exports!=null&&
hasOwnProperty.call(module.exports,'default'))
{

module.defaultExport=module.exports["default"];
}
}else{
module.defaultExport=module.exports;
}


module.resolved=true;

return module;
}

function requireInterop(id,soft){
var module=getOrIntializeModule(id,soft);

if(module){
return module.defaultExport!==EMPTY?
module.defaultExport:
module.exports;
}
}

function importDefault(id){
var module=getOrIntializeModule(id);

if(module){
return module.defaultExport!==EMPTY?module.defaultExport:null;
}
}

function importNamespace(id){
var module=getOrIntializeModule(id);

if(module){
return module.exports;
}
}

function define(
id,
deps,
factory,
_special)
{
if(typeof factory==='function'){
map[id]={

factory:factory,
deps:deps,
defaultExport:EMPTY,
exports:{},
special:_special||0,
resolved:false};



if(_special!=null&&_special&REQUIRE_WHEN_READY){
requireInterop.call(null,id);
}
}else{
map[id]={
defaultExport:factory,
exports:factory,
resolved:true};

}
}

global.__d=define;
global.require=requireInterop;
global.importDefault=importDefault;
global.importNamespace=importNamespace;

global.$RefreshReg$=function(){};
global.$RefreshSig$=function(){return function(type){return type;};};

})(this);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Custom FB polyfill to override resourcetiming API defaults.
 *
 * @format
 * @noflow
 * @oncall static_resources
 * @polyfillUAs
 * @provides performance-polyfill
 * @requires __DEV__
 */
(function(global){
var p=global.performance;
if(p&&p.setResourceTimingBufferSize){
p.setResourceTimingBufferSize(100000);
p.onresourcetimingbufferfull=function(){
global.__isresourcetimingbufferfull=true;
};
p.setResourceTimingBufferSize=function(){
if(__DEV__){
console.warn(
'setResourceTimingBufferSize is not supported at Facebook and will be ignored.');

}
};
}
})(
typeof this==='object'?
this:
typeof global==='object'?
global:
typeof window==='object'?
window:
typeof self==='object'?
self:
{});

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 *  strict-local
 * @format
 * @oncall ws_tools
 */__d("CometDevToolsConstants",[],(function $module_CometDevToolsConstants(global,require,requireDynamic,requireLazy,module,exports){

'use strict';







module.exports={
PANEL_CONNECTION_HASH:'cometdev://panel'};}),null);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 *  strict
 * @format
 * @oncall web_perf_infra
 * @generated SignedSource<<29686df1a58a1c40d2610537959b90ac>>
 * @codegen-command: scripts/fwp/build.sh
 * source: [www]/scripts/fwp/src/browser-tools-common/BrowserToolsNamespace.js
 */__d("BrowserToolsNamespace",[],(function $module_BrowserToolsNamespace(global,require,requireDynamic,requireLazy,module,exports){

'use strict';































function ensureNamespace(str){
switch(str){
case'_meta':
case'scheduler':
case'welcome':
case'visual_completion':
case'cheat_codes':
case'payload_debugger':
case'interaction_tracing':
case'ssr_inspector':
case'loom':
case'gk_tool':
case'qe_tool':
case'error_console':
case'memory':
case'tepig':
case'relay':
case'laminar':
case'qpl':
case'sdp_decoder':
case'lightspeed':
case'armadillo':
case'router':
case'longtasks_inspection':
case'e2e':
case'smax':
case'accessibility':
case'geodesic':
return str;
default:
return null;}

}exports.ensureNamespace=ensureNamespace;}),66);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 *  strict
 * @format
 * @oncall web_perf_infra
 * @generated SignedSource<<5b0273db89b8eb1ed44ecc0b77c73809>>
 * @codegen-command: scripts/fwp/build.sh
 * source: [www]/scripts/fwp/src/browser-tools-common/BrowserToolsMessageValidation.js
 */__d("BrowserToolsMessageValidation",["BrowserToolsNamespace"],(function $module_BrowserToolsMessageValidation(global,require,importDefault,importNamespace,requireLazy,module,exports){

'use strict';






function isValidMessage(message){
return(
typeof message==='object'&&
message!==null&&
typeof message.action==='string');

}



function getMessageNamespace(
message)
{
var namespace=message.namespace;
if(typeof namespace!=='string'){
return null;
}else{
return importNamespace("BrowserToolsNamespace").ensureNamespace(namespace);
}
}

function getMessageString(
message,
key)
{
var result=message[key];
if(typeof result!=='string'){
return null;
}else{
return result;
}
}

function asNumber(i){
if(typeof i==='number'){
return i;
}else{
return null;
}
}

function asStringArray(arr){
if(!Array.isArray(arr)){
return null;
}

var result=[];
for(var i=0;i<arr.length;i++){
if(typeof arr[i]!=='string'){
return null;
}else{
result.push(arr[i]);
}
}

return[].concat(result);
}

function asObject(obj){
if(typeof obj!=='object'){
return null;
}else{
return obj;
}
}

function asBoolean(bool){
if(typeof bool!=='boolean'){
return null;
}
return bool;
}exports.isValidMessage=isValidMessage;exports.getMessageNamespace=getMessageNamespace;exports.getMessageString=getMessageString;exports.asNumber=asNumber;exports.asStringArray=asStringArray;exports.asObject=asObject;exports.asBoolean=asBoolean;}),98);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 *  strict
 * @format
 * @oncall web_perf_infra
 * @generated SignedSource<<fbca142a8a39fbe8fdc04cc5d5a02259>>
 * @codegen-command: scripts/fwp/build.sh
 * source: [www]/scripts/fwp/src/browser-tools-common/EasyMessageChannels.js
 */__d("EasyMessageChannels",[],(function $module_EasyMessageChannels(global,require,requireDynamic,requireLazy,module,exports){

'use strict';























var DEFAULT_TIMEOUT=5000;







function connect(
options,
onConnected)
{
var time=
typeof options.timeout==='number'?options.timeout:DEFAULT_TIMEOUT;
var win=options.window?options.window:window;

var timeout=window.setTimeout(function window_setTimeout_$0(){
onConnected(new Error('ERROR 2200: timed out before getting a connection'));
},time);

var channel=new MessageChannel();


var receiveREQ_ACK=function receiveREQ_ACK(message){
var data=message.data;
if(typeof data!=='object'||data===null){
return;
}

if(data.type!=='REQ_ACK'){
return;
}

channel.port1.onmessage=null;
window.clearTimeout(timeout);
onConnected(null,channel.port1);
};


channel.port1.onmessage=receiveREQ_ACK;


win.postMessage({hash:options.hash,type:'REQ'},'*',[channel.port2]);
}

function listen(options,onConnected){
var win=options.window?options.window:window;


var receiveREQ=function receiveREQ(message)


{
if(message.data.type!=='REQ'){
return;
}

if(!(message.ports&&message.ports[0])){
onConnected(
new Error('ERROR 2315: connection request was malformed. No port.'));

return;
}

if(!message.data.hash){
onConnected(
new Error('ERROR 2315: connection request was malformed. No hash.'));

return;
}

if(message.data.hash!==options.hash){

return;
}

message.ports[0].postMessage({type:'REQ_ACK'});
onConnected(null,message.ports[0]);
};


win.addEventListener('message',receiveREQ);
}exports.connect=connect;exports.listen=listen;}),66);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 *  strict
 * @format
 * @oncall web_perf_infra
 * @generated SignedSource<<8b3283c357757a0d99f122b9bf61baba>>
 * @codegen-command: scripts/fwp/build.sh
 * source: [www]/scripts/fwp/src/browser-tools-common/index.js
 */__d("browser-tools-common",["BrowserToolsMessageValidation","BrowserToolsNamespace","EasyMessageChannels"],(function $module_browser_tools_common(global,require,importDefault,importNamespace,requireLazy,module,exports){

'use strict';exports.BrowserToolsMessageValidation=importNamespace("BrowserToolsMessageValidation");exports.EasyMessageChannels=importNamespace("EasyMessageChannels");exports.ensureNamespace=importNamespace("BrowserToolsNamespace").ensureNamespace;}),98);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 *  strict-local
 * @format
 * @oncall ws_tools
 */__d("CometDevToolsPanelConnection",["CometDevToolsConstants","browser-tools-common"],(function $module_CometDevToolsPanelConnection(global,require,importDefault,importNamespace,requireLazy,module,exports){

'use strict';











var runtime=window.chrome?window.chrome.runtime:window.browser.runtime;

function createPanelConnection(inspectedWindowTabId){
var iframePort=null;
var backgroundPort=null;
var frameId=null;


importNamespace("browser-tools-common").EasyMessageChannels.listen({hash:importNamespace("CometDevToolsConstants").PANEL_CONNECTION_HASH},function listen_$1(err,port){
if(!port){
throw err;
}

iframePort=port;
iframePort.onmessage=onIframeMessage;

backgroundPort=runtime.connect({name:'panel'});
backgroundPort.onMessage.addListener(onMessageFromBackground);
});

function postMessageToBackground(
msg)


{
if(!backgroundPort){
throw new Error('no background port for communication.');
}

if(frameId===null){
throw new Error('Panel is not registered yet! No frameId.');
}

var message=babelHelpers["extends"]({},
msg,{
dest:inspectedWindowTabId,
src:frameId});

backgroundPort.postMessage(message);
}










function onMessageFromBackground(message){
if(!importNamespace("browser-tools-common").BrowserToolsMessageValidation.isValidMessage(message)){
throw new Error(
'Invalid message from background thread to extension panel.');

}
if(!iframePort){

console.error('message',message);
throw new Error('no iframe port for communication.');
}
switch(message.action){



case'you_are':{
var maybeFrameId=importNamespace("browser-tools-common").BrowserToolsMessageValidation.asNumber(message.body);
if(maybeFrameId===null){
throw new Error(
'Background script attempted to register panel with invalid frameId.');

}

if(frameId!==null){
throw new Error('Panel got a new ID but it already has one');
}

frameId=maybeFrameId;
postMessageToBackground({action:'register'});
break;
}

case'ready':
iframePort.postMessage({
action:'ready',
body:message.body.concat(['panel'])});

return;

case'relay':
default:
iframePort.postMessage(message);}

}


function onIframeMessage(event){
var message=event.data;

if(!importNamespace("browser-tools-common").BrowserToolsMessageValidation.isValidMessage(message)){

throw new Error('Invalid message from iframe on the extension panel.');
}

switch(message.action){
case'navigate':{
var payload=message.body;

var maybeURL=null;
if(typeof payload==='object'&&payload!==null){
maybeURL=payload.url;
}


if(maybeURL==='_reloadTools'){
window.location.reload();
return;
}
break;
}}


postMessageToBackground(message);
}
}exports.createPanelConnection=createPanelConnection;}),98);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @noflow
 * @oncall ws_tools
 * @providesLegacy CometDevToolsDevelopmentContentScriptImpl
 */__d("legacy:CometDevToolsDevelopmentContentScriptImpl",["CometDevToolsPanelConnection"],(function $module_legacy_CometDevToolsDevelopmentContentScriptImpl(global,require,importDefault,importNamespace,requireLazy,__DO_NOT_USE__module,__DO_NOT_USE__exports){







function initAsDevtoolsPane(){
var params=new URLSearchParams(location.search);
var inspectedTabIdStr=params.get('tab_id');
var selectedPanel=params.get('selected_panel');
if(inspectedTabIdStr==null){
throw new Error('tab_id url param is missing');
}
var inspectedTabId=Number(inspectedTabIdStr);

if(selectedPanel!=null){
window.localStorage.setItem('comet_dev_tools_selected_tool',selectedPanel);
}

importNamespace("CometDevToolsPanelConnection").createPanelConnection(inspectedTabId);
}

if(window.location.pathname==='/intern/comet_dev_tools/main'){
initAsDevtoolsPane();
}}),35);
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *  strict-local
 * @format
 * @oncall ws_tools
 * @providesMeta CometDevToolsDevelopmentContentScript
 * @requires CometDevToolsDevelopmentContentScriptImpl
 * @use-commonjs-require-lite
 */