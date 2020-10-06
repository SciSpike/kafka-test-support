module.exports = { // this will become a docker compose file
  version: '2',
  services: {
    zookeeper: {
      image: 'bitnami/zookeeper',
      tmpfs: '/datalog', // see https://github.com/wurstmeister/kafka-docker/issues/389#issuecomment-467408013
      ports: [
        // this will be modified if user overrides any default ports
        '22181:22181' // default zookeeperPort
      ],
      volumes: [
        'zookeeper_data:/bitnami'
      ],
      environment: [
        // this will be modified if user overrides any default ports
        'ALLOW_ANONYMOUS_LOGIN=yes',
        'ZOO_PORT_NUMBER=22181'
      ]
    },
    kafka: {
      image: 'bitnami/kafka',
      ports: [
        '39092:9092', // default kafkaPlaintextHostPort (39092)
        '29092:29092' // default kafkaPlaintextPort
      ],
      volumes: [
        'kafka_data:/bitnami'
      ],
      environment: [
        // this will be modified if user overrides any default ports
        'KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:22181',
        'ALLOW_PLAINTEXT_LISTENER=yes',
        'KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT',
        'KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,PLAINTEXT_HOST://:29092',
        'KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092'
      ],
      depends_on: [
        'zookeeper'
      ]
    }
  },
  volumes: {
    zookeeper_data: {
      driver: 'local'
    },
    kafka_data: {
      driver: 'local'
    }
  }
}
