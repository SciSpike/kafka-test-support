'use strict'

const cp = require('child_process')
const pause = require('./pause')

module.exports = async ({
  scriptArgs = [],
  pauseMillis = 0
} = {}) => {
  console.log(`${cp.execFileSync(`${__dirname}/start-kafka.sh`, scriptArgs)}`)
  if ((pauseMillis = parseInt(pauseMillis))) await pause(pauseMillis)
}
