/* @flow */

import { makeMap } from 'shared/util'

const isAttr = makeMap(
  'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,' +
  'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,' +
  'checked,cite,class,code,codebase,color,cols,colspan,content,http-equiv,' +
  'name,contenteditable,contextmenu,controls,coords,data,datetime,default,' +
  'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,method,for,' +
  'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,' +
  'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,' +
  'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,' +
  'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,' +
  'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,' +
  'scope,scoped,seamless,selected,shape,size,type,text,password,sizes,span,' +
  'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,' +
  'target,title,type,usemap,value,width,wrap'
)

/* istanbul ignore next */
const isRenderableAttr = (name: string): boolean => {
  return (
    isAttr(name) ||
    name.indexOf('data-') === 0 ||
    name.indexOf('aria-') === 0
  )
}
export { isRenderableAttr }

export const propsToAttrMap = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv'
}

const ESC = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '&': '&amp;'
}

export function escape (s: string) {
  return s.replace(/[<>"&]/g, escapeChar)
}

function escapeChar (a) {
  return ESC[a] || a
}
