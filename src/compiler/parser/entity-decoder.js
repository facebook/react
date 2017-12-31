/* @flow */

let decoder

export default {
  decode (html: string): string {
    decoder = decoder || document.createElement('div')
    decoder.innerHTML = html
    return decoder.textContent
  }
}
