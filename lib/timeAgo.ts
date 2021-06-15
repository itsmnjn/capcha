import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

try {
  TimeAgo.addDefaultLocale(en)
} catch (e) {
  console.log(e)
}

// Create formatter (English).
export const timeAgo = new TimeAgo('en-US')
