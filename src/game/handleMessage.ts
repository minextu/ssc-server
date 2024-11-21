import type { WEAPON } from '../enums.js'
import { GAME_PACKET, LEAVE_TYPE } from '../enums.js'
import { intToStr, strToInt } from '../utils/convert.js'
import { log } from '../utils/logging.js'
import { handleGameState } from './handleGameState.js'
import { handleJoinRequest } from './handleJoinRequest.js'
import { sendResponse, sendToAll } from './outbound.js'
import { type Player, removePlayer } from './player.js'

export function handleMessage(
  requestId: number,
  packetType: GAME_PACKET,
  messageData: string,
  info: { address: string, port: number },
  target?: number,
  player?: Player,
) {
  if (packetType === GAME_PACKET.PLAYER_JOIN_REQUEST) {
    handleJoinRequest(requestId, messageData, player ?? info)
    return
  }

  if (!player) {
    log('dropping packet from unknown player', 'error', requestId)
    return
  }

  switch (packetType) {
    case GAME_PACKET.CONFIRM_RECEIVE: {
      const udpCounter = strToInt(messageData, 4)
      player.udp.packetsToSend.delete(udpCounter)
      break
    }
    // lastHeard has already been updated when we get here, nothing else to do
    case GAME_PACKET.KEEP_ALIVE:
      break
    case GAME_PACKET.ALIVE_REQUEST: {
      sendResponse(GAME_PACKET.KEEP_ALIVE, 'yup', player, requestId)
      break
    }
    case GAME_PACKET.PLAYER_LEFT: {
      const targetNetId = strToInt(messageData, 1)

      const removedPlayer = removePlayer(targetNetId)

      if (!removedPlayer) {
        log(`player ${targetNetId} not found for removing`, 'error', requestId)
        break
      }

      log(`player ${removedPlayer.name} (${removedPlayer.netId}) left`, 'info', requestId)
      sendToAll(GAME_PACKET.PLAYER_LEFT, intToStr(targetNetId, 1) + intToStr(LEAVE_TYPE.LEFT, 1))
      break
    }
    case GAME_PACKET.POSITION_UPDATE: {
      const udpCounter = strToInt(messageData, 2)
      const xpos = (strToInt(messageData.slice(2), 2) - 2000) / 20
      const ypos = (strToInt(messageData.slice(4), 2) - 2000) / 20
      const zpos = (strToInt(messageData.slice(6), 2) - 2000) / 20
      const xspeed = (strToInt(messageData.slice(8), 2) - 5000) / 1000
      const yspeed = (strToInt(messageData.slice(10), 2) - 5000) / 1000
      const zspeed = (strToInt(messageData.slice(12), 2) - 5000) / 1000
      const rposx = strToInt(messageData.slice(14), 2) - 5000
      const rposy = strToInt(messageData.slice(16), 2) - 5000
      player.position = {
        udpCounter,
        xpos,
        ypos,
        zpos,
        xspeed,
        yspeed,
        zspeed,
        rposx,
        rposy,
      }

      const state = strToInt(messageData.slice(18), 2).toString(2).padStart(9, '0').split('').map(bit => bit === '1').reverse()
      const [keyUp, keyDown, keyLeft, keyRight, isJump, isShoot, isHidden, isArmorBonus, isSpeedBonus] = state
      player.keys = {
        keyUp,
        keyDown,
        keyLeft,
        keyRight,
        isJump,
        isShoot,
      }
      player.isHidden = isHidden
      player.isArmorBonus = isArmorBonus
      player.isSpeedBonus = isSpeedBonus

      const _deathCounter = strToInt(messageData.slice(21), 4)
      const weapon = strToInt(messageData.slice(20), 1) as WEAPON
      player.weapon = weapon

      break
    }
    case GAME_PACKET.GAME_STATE:
      // game state packet has it's own subtypes
      return handleGameState(requestId, player, messageData)
    default:
      log(`Invalid type ${packetType}. Dropping packet...`, 'error', requestId)
  }
}
