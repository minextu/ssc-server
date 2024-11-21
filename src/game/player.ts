import { FIGUR, WEAPON } from '../enums.js'

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

export function addPlayer(name: string, info: { address: string, port: number }) {
  // start at 2, since host is at one
  const netId = players.length + 2

  const player: Player = {
    name,
    alive: true,
    address: info.address,
    port: info.port,
    netId,
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
