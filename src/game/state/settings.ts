import { DEFAULT_MAX_PLAYERS, DEFAULT_TIMEOUT_PERIOD } from '../../constants.js'
import { GAME_TYPE, LEVEL } from '../../enums.js'

export interface GameSettings {
  port: number
  level: LEVEL
  type: GAME_TYPE
  maxPlayers: number
  timeoutPeriod: number
}

export const gameSettings: GameSettings = {
  port: -1,
  level: LEVEL.ALHAMBRA,
  type: GAME_TYPE.NORMAL,
  maxPlayers: DEFAULT_MAX_PLAYERS,
  timeoutPeriod: DEFAULT_TIMEOUT_PERIOD,
}

export function setGameSettings(port: number, level: LEVEL, type: GAME_TYPE, maxPlayers?: number, timeoutPeriod?: number) {
  gameSettings.port = port
  gameSettings.level = level
  gameSettings.type = type
  gameSettings.maxPlayers = maxPlayers ?? gameSettings.maxPlayers
  gameSettings.timeoutPeriod = timeoutPeriod ?? gameSettings.timeoutPeriod
}
