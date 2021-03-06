module.exports.tables = {
  players: 'bm_players',
  playerBans: 'bm_player_bans',
  playerBanRecords: 'bm_player_ban_records',
  playerMutes: 'bm_player_mutes',
  playerMuteRecords: 'bm_player_mute_records',
  playerKicks: 'bm_player_kicks',
  playerNotes: 'bm_player_notes',
  playerHistory: 'bm_player_history',
  playerReports: 'bm_player_reports',
  playerReportLocations: 'bm_player_report_locations',
  playerReportStates: 'bm_player_report_states',
  playerReportCommands: 'bm_player_report_commands',
  playerReportComments: 'bm_player_report_comments',
  playerWarnings: 'bm_player_warnings',
  ipBans: 'bm_ip_bans',
  ipBanRecords: 'bm_ip_ban_records',
  ipMutes: 'bm_ip_mutes',
  ipMuteRecords: 'bm_ip_mute_records',
  ipRangeBans: 'bm_ip_range_bans',
  ipRangeBanRecords: 'bm_ip_range_ban_records',
  playerPins: 'bm_player_pins',
  serverLogs: 'bm_server_logs',
  playerReportLogs: 'bm_report_logs'
}

const enums = {
  PlayerBan: { table: 'playerBans', resource: 'player.bans' },
  PlayerKick: { table: 'playerKicks', resource: 'player.kicks' },
  PlayerMute: { table: 'playerMutes', resource: 'player.mutes' },
  PlayerNote: { table: 'playerNotes', resource: 'player.notes' },
  PlayerWarning: { table: 'playerWarnings', resource: 'player.warnings' }
}

module.exports.recordToTable = (type) => enums[type].table
module.exports.recordToResource = (type) => enums[type].record
