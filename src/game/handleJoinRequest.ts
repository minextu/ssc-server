import { HOST_ID, MAX_PLAYERS, TIMEOUT_PERIOD } from '../constants.js'
import { GAME_PACKET, GAME_STATE_TYPE, JOIN_FAIL_REASON, JOIN_TYPE } from '../enums.js'
import { intToStr, strToInt } from '../utils/convert.js'
import { log } from '../utils/logging.js'
import { sendGameStateResponse, sendResponse, sendToAll } from './outbound.js'
import { addPlayer, findPlayerByAddress, findPlayerByName, players } from './player.js'

export function handleJoinRequest(requestId: number, messageData: string, info: { port: number, address: string }) {
  const joinType = strToInt(messageData, 1)

  if (joinType === JOIN_TYPE.REQUEST) {
    const name = messageData.slice(1)

    log('player joined', 'info', requestId, { joinType, name })

    if (findPlayerByName(name)) {
      // TODO: restore session
      log('duplicated name', 'warning', requestId)
      sendResponse(
        GAME_PACKET.PLAYER_JOIN_REQUEST,
        intToStr(JOIN_TYPE.FAILURE, 1) + intToStr(JOIN_FAIL_REASON.BANNED, 1),
        info,
        requestId,
      )
      return
    }

    const player = addPlayer(name, info, requestId)
    if (!player) {
      sendResponse(
        GAME_PACKET.PLAYER_JOIN_REQUEST,
        intToStr(JOIN_TYPE.FAILURE, 1) + intToStr(JOIN_FAIL_REASON.NO_ROOM, 1),
        info,
        requestId,
      )
      return
    }

    // host is the only player for now
    const numPlayers = 1
    const gameType = 1

    sendResponse(
      GAME_PACKET.PLAYER_JOIN_REQUEST,
      intToStr(JOIN_TYPE.REQUEST, 1)
      + intToStr(player.netId, 1)
      + intToStr(HOST_ID, 1)
      + intToStr(numPlayers, 1)
      + intToStr(MAX_PLAYERS, 1)
      + intToStr(gameType, 1)
      + intToStr(TIMEOUT_PERIOD, 1),
      player,
      requestId,
    )

    // at this stage we will only let the client know about the host
    // this will make sure future packets are processed properly
    sendResponse(
      GAME_PACKET.PLAYER_JOIN_REQUEST,
      `${intToStr(JOIN_TYPE.SUCCESS, 1)
      + intToStr(HOST_ID, 1)
      }host`,
      player,
      requestId,
    )
  }
  else if (joinType === JOIN_TYPE.SUCCESS) {
    const player = findPlayerByAddress(info.address, info.port)
    if (!player) {
      log('Join failed, player not found', 'error', requestId)
      return
    }

    player.connecting = false

    sendToAll(
      GAME_PACKET.PLAYER_JOIN_REQUEST,
      intToStr(JOIN_TYPE.SUCCESS, 1)
      + intToStr(player.netId, 1)
      + player.name,
      player,
      requestId,
    )

    for (const otherPlayer of players) {
      if (otherPlayer.netId === player.netId || otherPlayer.connecting) {
        continue
      }

      // prepare other connected players
      sendResponse(
        GAME_PACKET.PLAYER_JOIN_SUCCESS,
        intToStr(otherPlayer.netId, 1)
        + otherPlayer.name,
        player,
        requestId,
      )

      sendGameStateResponse(GAME_STATE_TYPE.NEW_PLAYER, intToStr(otherPlayer.netId, 2) + intToStr(otherPlayer.figur, 2), player, requestId)
    }
  }
  else {
    log(`unkown join type: ${JSON.stringify(joinType)}`, 'error', requestId)
  }
}
