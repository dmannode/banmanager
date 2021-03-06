const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createReport } = require('./fixtures')
const { insert } = require('../data/udify')

describe('Mutation assignReport', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  })

  test('should error if unauthenticated', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await insert(pool, 'bm_players', player)
    const [{ insertId }] = await insert(pool, 'bm_player_reports', report)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${server.id}", report: ${insertId}) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow update.assign.any', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await insert(pool, 'bm_players', player)

    const [{ insertId }] = await insert(pool, 'bm_player_reports', report)
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.assign.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${server.id}", report: ${insertId}) {
          id
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignReport.id, '' + insertId)
  })

  test('should allow update.assign.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    await insert(pool, 'bm_players', player)

    const [{ insertId }] = await insert(pool, 'bm_player_reports', report)
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.assign.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${server.id}", report: ${insertId}) {
          id
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignReport.id, '' + insertId)
  })

  test('should allow update.assign.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    report.assignee_id = account.id

    await insert(pool, 'bm_players', player)

    const [{ insertId }] = await insert(pool, 'bm_player_reports', report)
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.assign.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${server.id}", report: ${insertId}) {
          id
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignReport.id, '' + insertId)
  })

  test('should allow update.assign.reported', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(account, player)

    await insert(pool, 'bm_players', player)

    const [{ insertId }] = await insert(pool, 'bm_player_reports', report)
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.assign.reported')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${server.id}", report: ${insertId}) {
          id
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignReport.id, '' + insertId)
  })

  test('should error if report does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await insert(pool, 'bm_players', player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${server.id}", report: 123123) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Report 123123 does not exist')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await insert(pool, 'bm_players', player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "3", report: 3) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server 3 does not exist')
  })

  test('should error if player does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config } = setup.serversPool.values().next().value
    const player = createPlayer()

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${config.id}", report: 3) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, `Player ${unparse(player.id)} does not exist`)
  })

  test('should assign player', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await insert(pool, 'bm_players', player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignReport {
        assignReport(player: "${unparse(player.id)}", serverId: "${server.id}", report: 3) {
          id
          assignee {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.assignReport.id, '3')
    assert.strictEqual(body.data.assignReport.assignee.id, unparse(player.id))
  })
})
