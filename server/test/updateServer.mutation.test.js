const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const { decrypt } = require('../data/crypto')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const {
  createPlayer,
  createServer
} = require('./fixtures')
const { insert } = require('../data/udify')

describe('Mutation update server', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  }, 20000)

  test('should error if unauthenticated', async () => {
    const player = createPlayer()
    const server = createServer(unparse(player.id), 'test')
    const serverId = server.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should require servers.manage', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const player = createPlayer()
    const server = createServer(unparse(player.id), 'test')
    const serverId = server.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = createServer(unparse(player.id), setup.dbPool.pool.config.connectionConfig.database)
    const serverId = server.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Server not found')
  })

  test('should error if tables missing', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = createServer(unparse(player.id), setup.dbPool.pool.config.connectionConfig.database)
    const serverId = config.id

    delete server.id
    server.tables = JSON.parse(server.tables)
    server.tables.players = 'doesNotExist'

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Tables do not exist in the database: players')
  })

  test('should error if console does not exist', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = createServer(unparse(player.id), setup.dbPool.pool.config.connectionConfig.database)
    const serverId = config.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Console UUID not found in bm_players table')
  })

  test('should error if name already exists', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = createServer(player.id, setup.dbPool.pool.config.connectionConfig.database)
    const serverId = config.id

    await insert(setup.dbPool, 'bm_web_servers', server)

    delete server.id
    server.console = unparse(server.console)
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'A server with this name already exists')
  })

  test('should encrypt password', async () => {
    const { config, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()

    await insert(pool, 'bm_players', player)

    // Create temp user
    await pool.execute('GRANT ALL PRIVILEGES ON *.* TO \'foobar\'@\'localhost\' IDENTIFIED BY \'password\';')
    const server = createServer(unparse(player.id), setup.dbPool.pool.config.connectionConfig.database)
    const serverId = config.id

    delete server.id

    server.user = 'foobar'
    server.password = 'password'
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    // Delete custom user
    await pool.execute('DELETE FROM mysql.user WHERE user = "foobar";')

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data.updateServer.id)

    const [[result]] = await pool.execute('SELECT * FROM bm_web_servers WHERE id = ?'
      , [body.data.updateServer.id])
    const decrypted = await decrypt(process.env.ENCRYPTION_KEY, result.password)

    assert.strictEqual(decrypted, 'password')
  })
})
