/*
  Applies the color theme before the page paints, so dark mode never flashes a white page first.
  Loaded as a plain blocking script in index.html (not inline, so a strict Content-Security-Policy still allows it).
  Keep the storage key and logic in sync with src/context/ThemeContext.jsx.
*/
;(function () {
  var theme = null
  try {
    theme = window.localStorage.getItem('verifyit-theme')
  } catch (error) {
    // Storage can be blocked (private mode, strict privacy settings); the system preference is used instead.
    theme = null
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
})()
