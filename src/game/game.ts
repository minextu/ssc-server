import udp from 'node:dgram'
import chalk from 'chalk'
import { strToInt } from '../utils/convert.js'
import { gameDecryptBuffer } from '../utils/encryption.js'
import { flushLog, populateLogContext } from '../utils/logging.js'
import { handleMessage } from './requests/handleMessage.js'
import { connectToMasterServer } from './state/master-bridge.js'
import { findPlayerByAddress, processPlayerCooldowns, processPlayerTimeouts } from './state/player.js'
import { gameSettings, setGameSettings } from './state/settings.js'
import { trackShots } from './state/shot.js'
import { sendQueuedGameStateMessages, updatePositions } from './utils/outbound.js'

export const gameServer = udp.createSocket('udp4')

export function setupGameServer(...settings: Parameters<typeof setGameSettings>) {
  setGameSettings(...settings)

  let requestId = 0
  gameServer.on('message', (data, info) => {
    const message = gameDecryptBuffer(data)
    if (!message) {
      return
    }

    const packetType = strToInt(message, 1)
    const target = strToInt(message[1], 1)
    const messageData = message.slice(2)

    const player = findPlayerByAddress(info.address, info.port)
    if (player) {
      player.alive = true
      player.lastHeard = Date.now()
    }

    requestId++
    populateLogContext(requestId, { message, packetType, target, messageData, player, data })
    handleMessage(requestId, packetType, messageData, info, target, player)
    flushLog(requestId)
  })

  gameServer.on('error', (error) => {
    console.log(chalk.red(`GAME ERROR: ${error}`))
    gameServer.close()
  })

  gameServer.on('listening', () => {
    const address = gameServer.address()
    const port = address.port
    const ipaddr = address.address
    console.log(`Game Server is listening at ${ipaddr} port ${port}`)

    setInterval(() => updatePositions(), 33)
    setInterval(() => sendQueuedGameStateMessages(), 33)
    setInterval(() => trackShots(), 33)
    setInterval(() => processPlayerCooldowns(), 33)
    setInterval(() => processPlayerTimeouts(), gameSettings.timeoutPeriod / 2)

    connectToMasterServer()
  })

  gameServer.bind(Number(gameSettings.port), '0.0.0.0')
}
