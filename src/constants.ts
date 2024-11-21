import process from 'node:process'
import chalk from 'chalk'
import { FIGUR } from './enums.js'

// latest version ever released
export const VERSION = '1.35'

// extracted these from the models (i.e. models/herr_wolf_dds.b3d), then applied the scaling of 0.013
export const modelDimensions: Record<FIGUR, { x: number, y: number, z: number }> = {
  [FIGUR.HERR_WOLF]: { x: 102.19 * 0.013, y: 300.50 * 0.013, z: 86.77 * 0.013 },
  [FIGUR.GERTRUDE]: { x: 91.28 * 0.013, y: 302.08 * 0.013, z: 84.1 * 0.013 },
  [FIGUR.LISA]: { x: 93.56 * 0.013, y: 267.17 * 0.013, z: 80.23 * 0.013 },
  [FIGUR.CHRIS]: { x: 87.07 * 0.013, y: 288.92 * 0.013, z: 102.82 * 0.013 },
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
