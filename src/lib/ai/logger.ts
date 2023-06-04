import pino from 'pino'

export let logger = pino()

const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node'
const isBrowser = typeof window !== 'undefined'

if (isNode) {

} else if (isBrowser) {
  // Code specific to web client/browser environment

  logger = pino({
    browser: {asObject: true}, transport: {
      target: 'pino-pretty',
      options: {
        colorize: false
      }
    }
  })

} else {
  // Code for other contexts or fallback behavior
}



