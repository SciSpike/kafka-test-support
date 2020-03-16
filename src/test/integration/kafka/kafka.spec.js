/* global describe, it */
'use strict'

const uuid = require('uuid/v4')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const kafkaConnect = require('../../../main')

describe('integration tests of kafka', function () {
  describe('kafka-connect', function () {
    it('should work', function (done) {
      if (process.env.CI) { // don't run this in CI pipeline
        console.log('skipping because in CI pipeline')
        done()
      }

      this.timeout(40000)

      const clientId = uuid()
      const groupId = uuid()
      const topic = uuid()
      const value = uuid()

      let kafka
      let admin
      let consumer

      async function fn () {
        const kafka = await kafkaConnect()

        const admin = kafka.admin()

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
      }

      async function tryTearDown () {
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
      }

      fn()
        .then(() => {
          consumer = kafka.consumer({ groupId })
          return consumer.connect()
        })
        .then(() => {
          return consumer.subscribe({ topic, fromBeginning: true })
        })
        .then(() => {
          let err
          return consumer.run({
            eachMessage: async ({ message }) => {
              try {
                expect(message.value.toString()).to.equal(value)
              } catch (e) {
                err = e
              } finally {
                tryTearDown()
              }
              done(err)
            }
          })
        })
        .catch(async e => {
          console.log(e)
          tryTearDown()
        })
    })
  })
})
