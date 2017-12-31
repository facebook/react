/* @flow */

/**
 * Add class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
export function addClass (el: HTMLElement, cls: ?string) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(c => el.classList.add(c))
    } else {
      el.classList.add(cls)
    }
  } else {
    const cur = ` ${el.getAttribute('class') || ''} `
    if (cur.indexOf(' ' + cls + ' ') < 0) {
      el.setAttribute('class', (cur + cls).trim())
    }
  }
}

/**
 * Remove class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
export function removeClass (el: HTMLElement, cls: ?string) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(c => el.classList.remove(c))
    } else {
      el.classList.remove(cls)
    }
    if (!el.classList.length) {
      el.removeAttribute('class')
    }
  } else {
    let cur = ` ${el.getAttribute('class') || ''} `
    const tar = ' ' + cls + ' '
    while (cur.indexOf(tar) >= 0) {
      cur = cur.replace(tar, ' ')
    }
    cur = cur.trim()
    if (cur) {
      el.setAttribute('class', cur)
    } else {
      el.removeAttribute('class')
    }
  }
}
