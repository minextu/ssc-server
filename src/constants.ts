import process from 'node:process'
import chalk from 'chalk'
import { FIGUR, WEAPON } from './enums.js'

// latest version ever released
export const VERSION = '1.35'

// extracted these from the models (i.e. models/herr_wolf_dds.b3d), then applied the scaling of 0.013
export const modelDimensions: Record<FIGUR, { x: number, y: number, z: number, scale: number }> = {
  [FIGUR.HERR_WOLF]: { x: 102.19, y: 300.50, z: 86.77, scale: 0.013 },
  [FIGUR.GERTRUDE]: { x: 91.28, y: 302.08, z: 84.1, scale: 0.013 },
  [FIGUR.LISA]: { x: 93.56, y: 267.17, z: 80.23, scale: 0.013 },
  [FIGUR.CHRIS]: { x: 87.07, y: 288.92, z: 102.82, scale: 0.013 },
}
export const shotDimensions: Record<WEAPON, { x: number, y: number, z: number, scale: number }> = {
  [WEAPON.LIQUIDATOR]: { x: 1, y: 1, z: 1, scale: 0.53 },
  [WEAPON.WATERMINATOR]: { x: 1, y: 1, z: 1, scale: 0.01 },
  [WEAPON.TRIPLE_SHOT]: { x: 1, y: 1, z: 1, scale: 0.3 },
  [WEAPON.ARCTIC_SHOCK]: { x: 1, y: 1, z: 1, scale: 0.6 },
  [WEAPON.WASSERBOMBEN_ARMBRUST]: { x: 10.34, y: 9.07, z: 11.89, scale: 0.05 },
  [WEAPON.WASSERBOMBEN_EXPLOSION]: { x: 1, y: 1, z: 1, scale: 0.3 },
}

// get these from a hexdump from the original game file
export const MASTER_SECRET = process.env.MASTER_SECRET ?? ''
export const GAME_SECRETS = process.env.GAME_SECRETS?.split(',') ?? []
if (!MASTER_SECRET || GAME_SECRETS?.length !== 9) {
  console.log(GAME_SECRETS)
  console.error(chalk.red('Error: please provide valid MASTER_SECRET and GAME_SECRETS env variables'))
  process.exit(1)
}

export const MAX_PLAYERS = 8
export const TIMEOUT_PERIOD = 0x3A98
export const HOST_ID = 1

// should be half according to
// https://www.helles-koepfchen.de/online_spiele/super_soaker_championship/index.html
export const ARMOR_DAMAGE_PERCENTAGE = 50

// TODO: figure these out, maybe some are random too?
export const WEAPON1_DAMAGE = 30
export const WEAPON2_DAMAGE = 30
export const WEAPON3_DAMAGE = 60
export const WEAPON4_DAMAGE = 10
export const WEAPON5_DAMAGE = 60
export const WEAPON9_DAMAGE = 10
// documentation only mentions it should reduce by a bit
// https://www.helles-koepfchen.de/online_spiele/super_soaker_championship/index.html
export const TOWEL_HEALTH = 70
