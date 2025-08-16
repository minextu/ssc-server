import type { GAME_STATE_TYPE } from '../../enums.js'
import type { Player } from '../state/player.js'
import { HOST_ID } from '../../constants.js'
import { GAME_PACKET } from '../../enums.js'
import { intToStr } from '../../utils/convert.js'
import { gameEncryptString } from '../../utils/encryption.js'
import { logOutbound, logReply } from '../../utils/logging.js'
import { gameServer } from '../game.js'
import { getUdpCounterForPlayer, players } from '../state/player.js'

export function sendResponse(messageType: GAME_PACKET, messageData: string, player: { port: number, address: string }, requestId: number, silentLog = false) {
  const message = intToStr(messageType, 1) + intToStr(HOST_ID, 1) + messageData
  if (!silentLog) {
    logReply(requestId, message, { packetType: messageType, messageData })
  }
  gameServer.send(gameEncryptString(message), player.port, player.address)
}

export function sendToPlayer(messageType: GAME_PACKET, messageData: string, player: { port: number, address: string }) {
  const message = intToStr(messageType, 1) + intToStr(HOST_ID, 1) + messageData
  logOutbound(message, { messageData, packetType: messageType, broadcast: 0 })

  gameServer.send(gameEncryptString(message), player.port, player.address)
}

export function sendToAll(messageType: GAME_PACKET, messageData: string, exceptPlayers?: Player[], requestId?: number) {
  const message = intToStr(messageType, 1) + intToStr(HOST_ID, 1) + messageData
  logOutbound(message, { packetType: messageType, messageData }, requestId)

  for (const player of players) {
    if (exceptPlayers?.map(p => p.netId).includes(player.netId) || player.connecting) {
      continue
    }

    gameServer.send(gameEncryptString(message), player.port, player.address)
  }
}

export function sendGameStateResponse(gameStateType: GAME_STATE_TYPE, messageData: string, player: Player, requestId: number) {
  const udpCounter = getUdpCounterForPlayer(player)

  const message = intToStr(GAME_PACKET.GAME_STATE, 1) + intToStr(HOST_ID, 1) + intToStr(gameStateType, 2) + intToStr(udpCounter, 4) + messageData
  logOutbound(message, { packetType: GAME_PACKET.GAME_STATE, gameStateType, messageData, broadcast: 0 }, requestId)

  player.udp.packetsToSend.set(udpCounter, { message, lastSend: new Date(0, 0) })
}

export function sendGameStateToAll(gameStateType: GAME_STATE_TYPE, messageData: string, exceptPlayers?: Player[], requestId?: number) {
  const messagePre = intToStr(GAME_PACKET.GAME_STATE, 1) + intToStr(HOST_ID, 1) + intToStr(gameStateType, 2)
  logOutbound(messagePre + intToStr(0, 4) + messageData, { packetType: GAME_PACKET.GAME_STATE, gameStateType, messageData }, requestId)

  for (const player of players) {
    if (exceptPlayers?.map(p => p.netId).includes(player.netId) || player.connecting) {
      continue
    }

    const udpCounter = getUdpCounterForPlayer(player)
    const message = messagePre + intToStr(player.udp.udpCounter, 4) + messageData
    player.udp.packetsToSend.set(udpCounter, { message, lastSend: new Date(0, 0) })
  }
}

/**
 * Sends all queued udp messages and resends them again if they haven't been received
 */
export function sendQueuedGameStateMessages() {
  for (const player of players) {
    player.udp.packetsToSend.forEach((packet) => {
      // this has been sent recently already
      if (Date.now() - packet.lastSend.getTime() < 33 * 25) {
        return
      }

      gameServer.send(gameEncryptString(packet.message), player.port, player.address)
      packet.lastSend = new Date()
    })
  }
}

export function updatePositions() {
  if (players.length === 0) {
    return
  }

  const filteredPlayers = players
    .filter(
      player => !player.connecting && player.position && player.keys,
    ) as (Required<Pick<Player, 'position' | 'keys'>> & Player)[]

  const playerUpdateString = filteredPlayers
    .map((player) => {
      const xpos = player.position.xpos * 20 + 2000
      const ypos = player.position.ypos * 20 + 2000
      const zpos = player.position.zpos * 20 + 2000
      const xspeed = player.position.xspeed * 1000 + 5000
      const yspeed = player.position.yspeed * 1000 + 5000
      const zspeed = player.position.zspeed * 1000 + 5000
      const rposx = player.position.rposx + 5000
      const rposy = player.position.rposy + 5000

      const state = [
        player.keys.keyUp,
        player.keys.keyDown,
        player.keys.keyLeft,
        player.keys.keyRight,
        player.keys.isJump,
        player.keys.isShoot,
        player.isHidden,
        player.isArmorBonus,
        player.isSpeedBonus,
      ].map(s => s ? '1' : '0').reverse().join('')

      return intToStr(player.position.udpCounter, 2)
        + intToStr(xpos, 2) + intToStr(ypos, 2) + intToStr(zpos, 2)
        + intToStr(xspeed, 2) + intToStr(yspeed, 2) + intToStr(zspeed, 2)
        + intToStr(rposx, 2) + intToStr(rposy, 2)
        + intToStr(Number.parseInt(state, 2), 2)
        + intToStr(player.weapon, 1)
        + intToStr(player.netId, 1)
    })
    .join('')

  for (const targetPlayer of players) {
    if (targetPlayer.connecting) {
      continue
    }

    const naessegrad = targetPlayer.naessegrad
    const deathCounter = targetPlayer.deathCounter

    const posUpdate
      = intToStr(GAME_PACKET.POSITION_UPDATE, 1)
      + intToStr(targetPlayer.netId, 1)
      + intToStr(filteredPlayers.length, 1)
      + playerUpdateString
      + intToStr(deathCounter, 2)
      + intToStr(naessegrad, 1)

    gameServer.send(gameEncryptString(posUpdate), targetPlayer.port, targetPlayer.address)
  }
}
