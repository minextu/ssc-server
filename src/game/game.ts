import udp from 'node:dgram'
import chalk from 'chalk'
import { TIMEOUT_PERIOD } from '../constants.js'
import { GAME_PACKET, LEAVE_TYPE } from '../enums.js'
import { intToStr, strToInt } from '../utils/convert.js'
import { gameDecryptBuffer } from '../utils/encryption.js'
import { flushLog, log, populateLogContext } from '../utils/logging.js'
import { handleMessage } from './handleMessage.js'
import { sendQueuedGameStateMessages, sendToAll, sendToPlayer, updatePositions } from './outbound.js'
import { findPlayerByAddress, players, removePlayer } from './player.js'
import { trackShots } from './trackShots.js'

export const gameServer = udp.createSocket('udp4')

let requestId = 0
gameServer.on('message', (data, info) => {
  requestId++
  const message = gameDecryptBuffer(data)

  const packetType = strToInt(message, 1)
  const target = strToInt(message[1], 1)
  const messageData = message.slice(2)

  const player = findPlayerByAddress(info.address, info.port)
  if (player) {
    player.alive = true
    player.lastHeard = Date.now()
  }

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
  setInterval(() => players.forEach((p) => { p.deadCooldown = Math.max(0, p.deadCooldown - 1) }), 33)
  setInterval(() => {
    players.filter(p => !p.connecting).forEach((player) => {
      if (Date.now() - player.lastHeard >= TIMEOUT_PERIOD) {
        log('player timed out!', 'warning', undefined, { netId: player.netId, name: player.name })
        sendToAll(GAME_PACKET.PLAYER_LEFT, intToStr(player.netId, 1) + intToStr(LEAVE_TYPE.LOST, 1))
        removePlayer(player.netId)
      }
      else if (Date.now() - player.lastHeard >= TIMEOUT_PERIOD / 2 && player.alive) {
        log('player about to timeout, sending alive request', 'warning', undefined, { netId: player.netId, name: player.name })
        player.alive = false
        sendToPlayer(GAME_PACKET.ALIVE_REQUEST, 'hello?', player)
      }
    })

    players.filter(p => p.connecting).forEach((player) => {
      if (Date.now() - player.lastHeard > TIMEOUT_PERIOD) {
        log('connecting player timed out!', 'warning', undefined, { netId: player.netId, name: player.name })
      }
    })
  }, TIMEOUT_PERIOD / 2)
})
