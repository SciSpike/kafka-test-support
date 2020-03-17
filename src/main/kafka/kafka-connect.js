'use strict'

const fs = require('fs')
const os = require('os')

const startKafka = require('./start-kafka')

let dockerComposeInfo

async function kafkaConnect ({
  dockerComposeFile,
  generatedDockerComposeFilePathname,
  kafkaPlaintextPort,
  kafkaPlaintextHostPort,
  kafkaTag,
  zookeeperPort,
  zookeeperTag
} = {}) {
  if (dockerComposeInfo) return dockerComposeInfo

  if (dockerComposeFile) {
    process.env.KAFKA_TEST_SUPPORT_DOCKER_COMPOSE_FILE = dockerComposeFile
    dockerComposeInfo = { dockerComposeFile }
  } else {
    dockerComposeInfo = generateDockerComposeFile(arguments[0])
    process.env.KAFKA_TEST_SUPPORT_DOCKER_COMPOSE_FILE = dockerComposeInfo.dockerComposeFile
    dockerComposeInfo.brokers = [`localhost:${dockerComposeInfo.kafkaPlaintextPort}`]
  }

  await startKafka()

  return dockerComposeInfo
}

function generateDockerComposeFile (opts) {
  opts = opts || {}

  const dockerComposeFile = opts.generatedDockerComposeFilePathname || `${os.tmpdir()}/kafka-test-support.docker-compose.yml`

  const kafkaPlaintextPort = parseInt(opts.kafkaPlaintextPort || process.env.KAFKA_TEST_SUPPORT_KAFKA_PLAINTEXT_PORT || fs.readFileSync(`${__dirname}/default-kafka-plaintext-test-port`).toString('utf8').trim())
  if (!kafkaPlaintextPort) throw new Error('invalid kafkaPlaintextPort')

  const kafkaPlaintextHostPort = parseInt(opts.kafkaPlaintextHostPort || process.env.KAFKA_TEST_SUPPORT_KAFKA_PLAINTEXT_HOST_PORT || fs.readFileSync(`${__dirname}/default-kafka-plaintext-host-test-port`).toString('utf8').trim())
  if (!kafkaPlaintextHostPort) throw new Error('invalid kafkaPlaintextHostPort')

  const kafkaTag = opts.kafkaTag || process.env.KAFKA_TEST_SUPPORT_KAFKA_TAG || '2'
  if (!kafkaTag) throw new Error('invalid kafkaTag')

  const zookeeperPort = parseInt(opts.zookeeperPort || process.env.KAFKA_TEST_SUPPORT_ZOOKEEPER_PORT || fs.readFileSync(`${__dirname}/default-zookeeper-test-port`).toString('utf8').trim())
  if (!zookeeperPort) throw new Error('invalid zookeeperPort')

  const zookeeperTag = opts.zookeeperTag || process.env.ZOOKEEPER_TEST_SUPPORT_ZOOKEEPER_TAG || '3'
  if (!zookeeperTag) throw new Error('invalid zookeeperTag')

  const dockerComposeInfo = {
    dockerComposeFile,
    kafkaPlaintextPort,
    kafkaTag,
    zookeeperPort,
    zookeeperTag
  }

  const dockerCompose = require(`${__dirname}/docker-compose`)

  dockerCompose.services.zookeeper.image = `bitnami/zookeeper:${zookeeperTag}`
  dockerCompose.services.kafka.image = `bitnami/kafka:${kafkaTag}`

  // see if the user overrode zookeeper port 22181 with something else & handle
  let ports = dockerCompose.services.zookeeper.ports
  if (zookeeperPort !== parseInt(ports[0].split(':')[0])) {
    ports[0] = `${zookeeperPort}:${zookeeperPort}`

    dockerCompose.services.zookeeper.environment = dockerCompose.services.zookeeper.environment
      .map(it => {
        const kv = it.split('=')
        if (kv[0].trim() === 'ZOO_PORT_NUMBER') {
          return `ZOO_PORT_NUMBER=${zookeeperPort}`
        }
        return it
      })

    dockerCompose.services.kafka.environment = dockerCompose.services.kafka.environment
      .map(it => {
        const kv = it.split('=')
        if (kv[0].trim() === 'KAFKA_CFG_ZOOKEEPER_CONNECT') {
          return `KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:${zookeeperPort}`
        }
        return it
      })
  }

  // see if the user overrode kafka plaintext host port 39092 or plaintext port 29092 with something else & handle
  ports = dockerCompose.services.kafka.ports

  if (kafkaPlaintextHostPort !== parseInt(ports[0].split(':')[0])) {
    ports[0] = `${kafkaPlaintextHostPort}:9092`
  }

  if (kafkaPlaintextPort !== parseInt(ports[1].split(':')[0])) {
    ports[1] = `${kafkaPlaintextPort}:${kafkaPlaintextPort}`
    dockerCompose.services.kafka.environment = dockerCompose.services.kafka.environment
      .map(it => {
        const kv = it.split('=')
        const key = kv[0].trim()
        switch (key) {
          case 'KAFKA_CFG_LISTENERS':
            return `KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,PLAINTEXT_HOST://:${kafkaPlaintextPort}`
          case 'KAFKA_CFG_ADVERTISED_LISTENERS':
            return `KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:${kafkaPlaintextPort}`
          default:
            return it
        }
      })
  }

  fs.writeFileSync(dockerComposeFile, JSON.stringify(dockerCompose, null, 2), { encoding: 'utf8' })

  return dockerComposeInfo
}

module.exports = kafkaConnect
