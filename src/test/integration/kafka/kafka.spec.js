/* global describe, it */
'use strict'

const { Kafka } = require('kafkajs')
const uuid = require('uuid').v4
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const kafkaConnect = require('../../../main')

describe('integration tests of kafka', function () {
  describe('kafka-connect', function () {
    let kafka
    let admin
    let consumer
    let tornDown
    const topic = uuid()

    async function tryTearDown () {
      if (tornDown) return

      try {
        if (consumer) await consumer.disconnect()
      } catch (e) {
        console.log('WARN: could not disconnect consumer')
      }

      try {
        if (admin) await admin.deleteTopics({ topics: [topic] })
      } catch (e) {
        console.log('WARN: could not delete topics')
      }

      try {
        if (admin) await admin.disconnect()
      } catch (e) {
        console.log('WARN: could not disconnect admin')
      }

      tornDown = true
    }

    it('should work', async function () {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        try {
          if (process.env.CI) { // don't run this in CI pipeline
            console.log('skipping because in CI pipeline')
            resolve()
          }

          this.timeout(40000)

          const clientId = uuid()
          const groupId = uuid()
          const value = uuid()

          const kafkaInfo = await kafkaConnect({
            brokerOpts: {
              'log.retention.ms': 1000
            }
          })

          kafka = new Kafka({ clientId, brokers: kafkaInfo.brokers })

          admin = kafka.admin()

          while (true) {
            try {
              await admin.connect()
              break
            } catch (e) {
              console.log('WARN: could not connect; retrying...')
            }
          }
          await admin.createTopics({ topics: [{ topic }] })

          const producer = kafka.producer()
          await producer.connect()
          await producer.send({
            topic,
            messages: [
              { value }
            ]
          })
          try {
            await producer.disconnect()
          } catch (e) {
            console.log('WARN: could not disconnect producer')
          }

          consumer = kafka.consumer({ groupId })
          await consumer.connect()
          await consumer.subscribe({ topic, fromBeginning: true })
          await consumer.run({
            eachMessage: async ({ message }) => {
              try {
                expect(message.value.toString()).to.equal(value)
              } catch (e) {
                reject(e)
              } finally {
                tryTearDown()
              }
              resolve()
            }
          })
        } catch (e) {
          reject(e)
        }
      })
    })
  })
})
