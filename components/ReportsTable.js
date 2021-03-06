import React, { useEffect, useState } from 'react'
import { Image, Loader, Pagination, Table } from 'semantic-ui-react'
import PlayerSelector from './admin/PlayerSelector'
import { useApi } from '../utils'
import ServerSelector from './admin/ServerSelector'

const query = `
query listReports($serverId: ID!, $actor: UUID, $assigned: UUID, $player: UUID, $state: ID, $limit: Int) {
  listReports(serverId: $serverId, actor: $actor, assigned: $assigned, player: $player, state: $state, limit: $limit) {
    total
    records {
      id
      created
      updated
      server {
        id
        name
      }
      actor {
        id
        name
      }
      state {
        id
        name
      }
      player {
        id
        name
      }
      assignee {
        id
        name
      }
    }
  }
}`

export default function ReportsTable ({ limit = 30 }) {
  const [tableState, setTableState] = useState({ serverId: null, activePage: 1, limit, offset: 0, actor: null, assigned: null, player: null, state: null })
  const { load, loading, data } = useApi({ query, variables: tableState }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => {
    if (tableState.serverId) load()
  }, [tableState])

  const handlePageChange = (e, { activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const handleFieldChange = (field) => (id) => setTableState({ ...tableState, [field]: id || null })
  const rows = data?.listReports?.records || []
  const total = data?.listReports.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <Table selectable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell><ServerSelector handleChange={handleFieldChange('serverId')} /></Table.HeaderCell>
          <Table.HeaderCell>ID</Table.HeaderCell>
          <Table.HeaderCell><PlayerSelector multiple={false} clearable placeholder='Reporter' handleChange={handleFieldChange('actor')} /></Table.HeaderCell>
          <Table.HeaderCell><PlayerSelector multiple={false} clearable placeholder='Reported' handleChange={handleFieldChange('player')} /></Table.HeaderCell>
          <Table.HeaderCell>State</Table.HeaderCell>
          <Table.HeaderCell><PlayerSelector multiple={false} clearable placeholder='Assigned' handleChange={handleFieldChange('assigned')} /></Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {loading
          ? <Table.Row><Table.Cell colSpan='6'><Loader active inline='centered' /></Table.Cell></Table.Row>
          : rows.map((row, i) => (
            <Table.Row key={i}>
              <Table.Cell>{row.server.name}</Table.Cell>
              <Table.Cell><a href={`/reports/${row.server.id}/${row.id}`}>#{row.id}</a></Table.Cell>
              <Table.Cell>
                <a href={`player/${row.actor.id}`}>
                  <Image src={`https://crafatar.com/avatars/${row.actor.id}?size=26&overlay=true`} fluid avatar />
                  {row.actor.name}
                </a>
              </Table.Cell>
              <Table.Cell>
                <a href={`player/${row.player.id}`}>
                  <Image src={`https://crafatar.com/avatars/${row.player.id}?size=26&overlay=true`} fluid avatar />
                  {row.player.name}
                </a>
              </Table.Cell>
              <Table.Cell>{row.state.name}</Table.Cell>
              <Table.Cell>
                {row.assignee &&
                  <a href={`player/${row.assignee.id}`}>
                    <Image src={`https://crafatar.com/avatars/${row.assignee.id}?size=26&overlay=true`} fluid avatar />
                    {row.assignee.name}
                  </a>}
              </Table.Cell>
            </Table.Row>
          ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.HeaderCell colSpan='6'>
            <Pagination
              fluid
              totalPages={totalPages}
              activePage={tableState.activePage}
              onPageChange={handlePageChange}
            />
          </Table.HeaderCell>
        </Table.Row>
      </Table.Footer>
    </Table>
  )
}
