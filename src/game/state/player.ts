import { FIGUR, GAME_PACKET, LEAVE_TYPE, WEAPON } from '../../enums.js'
import { intToStr } from '../../utils/convert.js'
import { log } from '../../utils/logging.js'
import { sendQueuedGameStateMessagesForPlayer, sendToAll, sendToPlayer } from '../utils/outbound.js'
import { gameSettings } from './settings.js'

export interface Player {
  name: string
  address: string
  port: number
  netId: number
  connecting: boolean
  deadCooldown: number
  lastHeard: number
  figur: FIGUR
  deathCounter: number
  score: number
  naessegrad: number
  alive: boolean
  team: number

  position?: {
    xpos: number
    ypos: number
    zpos: number
    xspeed: number
    yspeed: number
    zspeed: number
    rposx: number
    rposy: number
    udpCounter: number
  }

  keys?: {
    keyUp: boolean
    keyDown: boolean
    keyLeft: boolean
    keyRight: boolean
    isJump: boolean
    isShoot: boolean
  }

  weapon: WEAPON
  isHidden: boolean
  isArmorBonus: boolean
  isSpeedBonus: boolean

  udp: {
    receivedPackets: number[]
    udpCounter: number
    packetsToSend: Map<number, { message: string, lastSend: Date }>
  }
}

export const players: Player[] = []

export function addPlayer(name: string, info: { address: string, port: number }, requestId?: number) {
  // find next available netId. Start at 2, since host is always 1
  const netId = Array.from({ length: gameSettings.maxPlayers + 2 })
    .findIndex((_, checkNetId) => checkNetId > 1 && !players.find(player => player.netId === checkNetId))

  if (netId === -1) {
    log('Room full, no available netId', 'warning', requestId)
    return
  }

  // count amount of players per team
  const playersPerTeam = players
    .reduce((prev, current) => prev.set(current.team, (prev.get(current.team) ?? 0) + 1), new Map())
  // assign player to the team with the least players
  const team = (playersPerTeam.get(0) ?? 0) > (playersPerTeam.get(1) ?? 0) ? 1 : 0

  const player: Player = {
    name,
    alive: true,
    address: info.address,
    port: info.port,
    netId,
    team,
    connecting: true,
    lastHeard: Date.now(),
    figur: FIGUR.HERR_WOLF,
    weapon: WEAPON.LIQUIDATOR,
    deathCounter: 1,
    score: 0,
    naessegrad: 0,
    deadCooldown: 0,
    isArmorBonus: false,
    isSpeedBonus: false,
    isHidden: false,
    udp: {
      receivedPackets: [],
      udpCounter: 1,
      packetsToSend: new Map(),
    },
  }
  players.push(player)

  return player
}

export function removePlayer(netId: number) {
  const playerIndex = players.findIndex(player => player.netId === netId)
  sendQueuedGameStateMessagesForPlayer(players[playerIndex])
  return players.splice(playerIndex, 1)?.[0]
}

export function findPlayerByAddress(address: string, port: number) {
  return players.find(player => player.address === address && player.port === port)
}

export function findPlayerByName(name: string) {
  return players.find(player => player.name === name)
}

export function getUdpCounterForPlayer(player: Player) {
  player.udp.udpCounter++

  if (player.udp.udpCounter > 50000) {
    player.udp.udpCounter = 1
  }

  return player.udp.udpCounter
}

export function processPlayerTimeouts() {
  players.filter(p => !p.connecting).forEach((player) => {
    if (Date.now() - player.lastHeard >= gameSettings.timeoutPeriod) {
      log('player timed out!', 'warning', undefined, { netId: player.netId, name: player.name })
      sendToAll(GAME_PACKET.PLAYER_LEFT, intToStr(player.netId, 1) + intToStr(LEAVE_TYPE.LOST, 1))
      removePlayer(player.netId)
    }
    else if (Date.now() - player.lastHeard >= gameSettings.timeoutPeriod / 2 && player.alive) {
      log('player about to timeout, sending alive request', 'warning', undefined, { netId: player.netId, name: player.name })
      player.alive = false
      sendToPlayer(GAME_PACKET.ALIVE_REQUEST, 'hello?', player)
    }
  })

  players.filter(p => p.connecting).forEach((player) => {
    if (Date.now() - player.lastHeard > gameSettings.timeoutPeriod) {
      log('connecting player timed out!', 'warning', undefined, { netId: player.netId, name: player.name })
      removePlayer(player.netId)
    }
  })
}

export function processPlayerCooldowns() {
  players.forEach((p) => {
    p.deadCooldown = Math.max(0, p.deadCooldown - 1)
  })
}
