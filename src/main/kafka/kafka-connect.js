'use strict'

const fs = require('fs')
const { Kafka } = require('kafkajs')

const startKafka = require('./start-kafka')

const defaultPort = parseInt(fs.readFileSync(`${__dirname}/default-kafka-test-port`))
const defaultContainerName = fs.readFileSync(`${__dirname}/default-kafka-test-container`).toString('utf8').trim()

let kafka

async function kafkaConnect ({
  port = defaultPort
} = {}, { // kafkaConnect opts
  waitUntilReady = true
} = {}) {
  if (kafka) return kafka

  let start = Date.now()
  if (!process.env.CI) {
    await startKafka()
    console.log(`started kafka container in ${Date.now() - start} ms`)
  } else {
    console.log('skipped launching container')
  }

  const opts = arguments[0] || {}
  if (!opts.brokers) {
    const port = opts.port || defaultPort
    opts.brokers = [`localhost:${port}`]
  }

  return new Kafka(opts)
  //
  // if (!waitUntilReady) return kafka
  //
  // let producer
  // try {
  //   producer = kafka.producer()
  //   await producer.connect()
  //   console.log(`connected to kafka in ${Date.now() - start} ms`)
  //   return kafka
  // } catch (e) {
  //   console.log(`error connecting Kafka producer: ${e.message}`)
  // } finally {
  //   if (producer) try {
  //     producer.disconnect()
  //   } catch (e) {
  //     console.log(`error disconnecting Kafka producer: ${e.message}`)
  //   }
  // }
}

kafkaConnect.defaultPort = defaultPort
kafkaConnect.defaultContainerName = defaultContainerName

module.exports = kafkaConnect
