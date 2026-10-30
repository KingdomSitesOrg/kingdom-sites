/**
 * Makes the page dark everywhere the browser shows it: the html and body
 * background, the dark colour scheme, and the browser's own theme colour (iOS
 * Safari tints its status bar from it). Returns a function that puts it back.
 */
export function paintDark() {
  const html = document.documentElement
  const was = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  const meta = was ?? document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }))
  const before = meta.content
  meta.content = '#0b0b0c'
  html.classList.add('cn-dark-room')
  return () => {
    html.classList.remove('cn-dark-room')
    if (was) was.content = before
    else meta.remove()
  }
}
