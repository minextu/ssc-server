import type { FIGUR, WEAPON } from '../enums.js'
import { TOWEL_HEALTH } from '../constants.js'
import { FIGURE_SOUND, GAME_PACKET, GAME_STATE_TYPE, ITEM_TYPE } from '../enums.js'
import { intToStr, strToInt } from '../utils/convert.js'
import { extendLogContext, log } from '../utils/logging.js'
import { sendGameStateResponse, sendGameStateToAll, sendResponse } from './outbound.js'
import { type Player, players } from './player.js'
import { fire } from './trackShots.js'

export function handleGameState(requestId: number, player: Player, message: string) {
  const gameStateType = strToInt(message, 2)
  const udpCounter = strToInt(message.slice(2), 4)
  const messageData = message.slice(6)

  extendLogContext(requestId, { gameStateType, udpCounter, messageData })

  // confirm this packet as received
  sendResponse(GAME_PACKET.CONFIRM_RECEIVE, intToStr(udpCounter, 4), player, requestId, true)

  // skip packet if it was processed in the last 50 packets
  if (player.udp.receivedPackets.includes(udpCounter)) {
    log(`udpCounter ${udpCounter} already processed, dropping...`, 'warning', requestId)
    return
  }
  player.udp.receivedPackets.unshift(udpCounter)
  player.udp.receivedPackets.length = 50

  switch (gameStateType) {
    case GAME_STATE_TYPE.PLAYER_READY: {
      // broadcast gamestate login to other players with correct figur attached
      sendGameStateToAll(GAME_STATE_TYPE.NEW_PLAYER, intToStr(player.netId, 2) + intToStr(player.figur, 2), player, requestId)

      // update score
      const otherPlayers = players.filter(p => !p.connecting)
      sendGameStateResponse(GAME_STATE_TYPE.ALL_SCORE, intToStr(otherPlayers.length, 1) + otherPlayers.map(p => intToStr(p.netId, 1) + intToStr(p.score, 4)).join(''), player, requestId)
      break
    }
    case GAME_STATE_TYPE.FIGUR_UPDATE: {
      const figur = strToInt(messageData, 2) as FIGUR
      player.figur = figur
      sendGameStateToAll(GAME_STATE_TYPE.FIGUR_UPDATE, intToStr(figur, 2) + intToStr(player.netId, 2), player, requestId)
      break
    }
    case GAME_STATE_TYPE.FIRE: {
      const weapon = strToInt(messageData, 1) as WEAPON

      const entityX = (strToInt(messageData.slice(1), 2) - 2000) / 20
      const entityY = (strToInt(messageData.slice(3), 2) - 2000) / 20
      const entityZ = (strToInt(messageData.slice(5), 2) - 2000) / 20

      const rposX = strToInt(messageData.slice(7), 2) - 5000
      const rposY = strToInt(messageData.slice(9), 2) - 5000
      const deathCounter = strToInt(messageData.slice(11), 4)

      log(`shoot`, 'info', requestId, { weapon, entityX, entityY, entityZ, rposX, rposY, deathCounter })

      const shot = fire(requestId, player.netId, weapon, entityX, entityY, entityZ, rposX, rposY)
      if (!shot) {
        break
      }

      sendGameStateToAll(
        GAME_STATE_TYPE.FIRE,
        intToStr(weapon, 1)
        + intToStr(entityX * 20 + 2000, 2) + intToStr(entityY * 20 + 2000, 2) + intToStr(entityZ * 20 + 2000, 2)
        + intToStr(rposX + 5000, 2) + intToStr(rposY + 5000, 2)
        + intToStr(player.netId, 1) + intToStr(shot.shotId, 2),
        undefined,
        requestId,
      )
      break
    }
    case GAME_STATE_TYPE.SOUND: {
      const netId = strToInt(messageData, 2)
      const sound = strToInt(messageData.slice(2), 2)

      sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(netId, 2) + intToStr(sound, 2), undefined, requestId)
      break
    }
    case GAME_STATE_TYPE.OUT_OF_MAP: {
      const type = messageData[0]
      const deathCounter = strToInt(messageData.slice(1), 4)

      if (type === 'o') {
        player.score--
        player.deathCounter++
        player.naessegrad = 0

        const deadsound = Math.floor(Math.random() * 3)
        sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(player.netId, 2) + intToStr(FIGURE_SOUND.WATER1 + deadsound, 2), undefined, requestId)
        sendGameStateToAll(GAME_STATE_TYPE.PLAYER_SELF_DIED, intToStr(player.netId, 2), undefined, requestId)
        sendGameStateToAll(GAME_STATE_TYPE.SCORE_UPDATE, intToStr(player.netId, 2) + intToStr(player.score, 4), undefined, requestId)
      }
      else {
        log('unhandeled out of map', 'error', requestId, { type, deathCounter })
      }
      break
    }
    case GAME_STATE_TYPE.PICKUP_WEAPON: {
      const weaponIndex = strToInt(messageData, 1) as WEAPON
      const _deathCounter = strToInt(messageData.slice(1), 4)

      sendGameStateToAll(GAME_STATE_TYPE.PICKUP_WEAPON, intToStr(weaponIndex, 1), undefined, requestId)
      break
    }
    case GAME_STATE_TYPE.PICKUP_ITEM: {
      const itemIndex = strToInt(messageData, 1)
      const itemType = strToInt(messageData.slice(1), 1)
      const _deathCounter = strToInt(messageData.slice(2), 4)

      if (itemType === ITEM_TYPE.TOWEL) {
        player.naessegrad = Math.max(0, player.naessegrad - TOWEL_HEALTH)
      }
      if (itemType === ITEM_TYPE.SPEED) {
        sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(player.netId, 2) + intToStr(FIGURE_SOUND.SPEED, 2), undefined, requestId)
      }
      if (itemType === ITEM_TYPE.ARMOR) {
        sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(player.netId, 2) + intToStr(FIGURE_SOUND.ARMOR, 2), undefined, requestId)
      }

      sendGameStateToAll(
        GAME_STATE_TYPE.PICKUP_ITEM,
        intToStr(itemIndex, 1)
        + intToStr(itemType, 1)
        + intToStr(player.netId, 2)
        + intToStr(player.naessegrad, 2),
        undefined,
        requestId,
      )
      break
    }
    default:
      return log(`Invalid game state type ${gameStateType}`, 'error', requestId)
  }
}
