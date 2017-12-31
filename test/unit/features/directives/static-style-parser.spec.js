import { parseStyleText } from 'web/util/style'
const base64ImgUrl = 'url("data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==")'
const logoUrl = 'url(https://vuejs.org/images/logo.png)'

it('should parse normal static style', () => {
  const staticStyle = `font-size: 12px;background: ${logoUrl};color:red`
  const res = parseStyleText(staticStyle)
  expect(res.background).toBe(logoUrl)
  expect(res.color).toBe('red')
  expect(res['font-size']).toBe('12px')
})

it('should parse base64 background', () => {
  const staticStyle = `background: ${base64ImgUrl}`
  const res = parseStyleText(staticStyle)
  expect(res.background).toBe(base64ImgUrl)
})

it('should parse multiple background images ', () => {
  let staticStyle = `background: ${logoUrl}, ${logoUrl};`
  let res = parseStyleText(staticStyle)
  expect(res.background).toBe(`${logoUrl}, ${logoUrl}`)

  staticStyle = `background: ${base64ImgUrl}, ${base64ImgUrl}`
  res = parseStyleText(staticStyle)
  expect(res.background).toBe(`${base64ImgUrl}, ${base64ImgUrl}`)
})

it('should parse other images ', () => {
  let staticStyle = `shape-outside: ${logoUrl}`
  let res = parseStyleText(staticStyle)
  expect(res['shape-outside']).toBe(logoUrl)

  staticStyle = `list-style-image: ${logoUrl}`
  res = parseStyleText(staticStyle)
  expect(res['list-style-image']).toBe(logoUrl)

  staticStyle = `border-image: ${logoUrl} 30 30 repeat`
  res = parseStyleText(staticStyle)
  expect(res['border-image']).toBe(`${logoUrl} 30 30 repeat`)
})
