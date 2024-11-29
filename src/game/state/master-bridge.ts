import type { GameSettings } from './settings.js'
import net from 'node:net'
import { GAME_EXTERNAL_IP, MASTER_INTERNAL_IP, MASTER_INTERNAL_PORT } from '../../constants.js'
import { log } from '../../utils/logging.js'
import { players } from './player.js'
import { gameSettings } from './settings.js'

let connectTimeout: NodeJS.Timeout
let updateInterval: NodeJS.Timeout

const masterClient = new net.Socket()

export type MasterBridgePacket = GameSettings & {
  currentPlayers: number
  ip: string
}

export function connectToMasterServer() {
  log('connecting to master server...', 'info')

  masterClient.connect(MASTER_INTERNAL_PORT, MASTER_INTERNAL_IP)
}

masterClient.on('connect', () => {
  log('connected to master server', 'info')

  clearInterval(updateInterval)
  updateInterval = setInterval(() => {
    masterClient.write(JSON.stringify({ ...gameSettings, currentPlayers: players.length, ip: GAME_EXTERNAL_IP } satisfies MasterBridgePacket))
  }, 1000)
})

masterClient.on('close', () => {
  clearInterval(updateInterval)
  clearTimeout(connectTimeout)
  log('master server connection lost. Retrying...', 'warning')
  connectTimeout = setTimeout(() => connectToMasterServer(), 1000)
})

masterClient.on('error', (error) => {
  log('master server error', 'warning', undefined, { errorText: error.message })
})
