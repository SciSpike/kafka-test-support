'use strict'

const fs = require('fs')
const os = require('os')

const startKafka = require('./start-kafka')

let dockerComposeInfo

async function kafkaConnect ({
  dockerComposeFile,
  generatedDockerComposeFilePathname,
  kafkaPort,
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
    dockerComposeInfo.brokers = [`localhost:${dockerComposeInfo.kafkaPort}`]
  }

  await startKafka()

  return dockerComposeInfo
}

function generateDockerComposeFile (opts) {
  opts = opts || {}

  const dockerComposeFile = opts.generatedDockerComposeFilePathname || `${os.tmpdir()}/kafka-test-support.docker-compose.yml`

  const kafkaPort = parseInt(opts.kafkaPort || process.env.KAFKA_TEST_SUPPORT_KAFKA_PORT || fs.readFileSync(`${__dirname}/default-kafka-test-port`).toString('utf8').trim())
  if (!kafkaPort) throw new Error('invalid kafkaPort')

  const kafkaTag = opts.kafkaTag || process.env.KAFKA_TEST_SUPPORT_KAFKA_TAG || '2'
  if (!kafkaTag) throw new Error('invalid kafkaTag')

  const zookeeperPort = parseInt(opts.zookeeperPort || process.env.KAFKA_TEST_SUPPORT_ZOOKEEPER_PORT || fs.readFileSync(`${__dirname}/default-zookeeper-test-port`).toString('utf8').trim())
  if (!zookeeperPort) throw new Error('invalid zookeeperPort')

  const zookeeperTag = opts.zookeeperTag || process.env.ZOOKEEPER_TEST_SUPPORT_ZOOKEEPER_TAG || '3'
  if (!zookeeperTag) throw new Error('invalid zookeeperTag')

  const dockerComposeInfo = {
    dockerComposeFile,
    kafkaPort,
    kafkaTag,
    zookeeperPort,
    zookeeperTag
  }

  const dockerCompose = require(`${__dirname}/docker-compose.json`)

  // see if the user overrode zookeeper port 2181 with something else & handle
  let ports = dockerCompose.services.zookeeper.ports
  if (zookeeperPort !== parseInt(ports[0].split(':')[0])) {
    ports.push(`${zookeeperPort}:2181`)
    dockerCompose.services.kafka.environment = dockerCompose.services.kafka.environment
      .map(it => {
        const kv = it.split('=')
        if ((kv[0] = kv[0].trim()) !== 'KAFKA_CFG_ZOOKEEPER_CONNECT') return it

        return it // `${kv[0]}=zookeeper:${zookeeperPort}`
      })
  }

  // see if the user overrode kafka port 29092 with something else & handle
  ports = dockerCompose.services.kafka.ports
  if (kafkaPort !== parseInt(ports[1].split(':')[0])) {
    ports[1] = `${kafkaPort}:${kafkaPort}`
    dockerCompose.services.kafka.environment = dockerCompose.services.kafka.environment
      .map(it => {
        const kv = it.split('=')
        const key = kv[0].trim()
        switch (key) {
          case 'KAFKA_CFG_LISTENERS':
          case 'KAFKA_CFG_ADVERTISED_LISTENERS': {
            const values = kv[1].split(',').map(it => it.trim())
            values[1] = values[1].replace(/29092$/g, kafkaPort)
            return `${key}=${values.join(',')}`
          }
          default:
            return it
        }
      })
  }

  fs.writeFileSync(dockerComposeFile, JSON.stringify(dockerCompose, null, 2), { encoding: 'utf8' })

  return dockerComposeInfo
}

module.exports = kafkaConnect
