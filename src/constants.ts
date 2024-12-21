import process from 'node:process'
import chalk from 'chalk'
import { FIGUR, WEAPON } from './enums.js'

// 1.35 seems to be the latest version ever released
export const VERSION = process.env.SERVER_VERSION ?? '1.35'

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
export const PATCH_SECRET = process.env.PATCH_SECRET ?? ''
export const GAME_SECRETS = process.env.GAME_SECRETS?.split(',') ?? []
if (!MASTER_SECRET || !PATCH_SECRET || GAME_SECRETS?.length !== 9) {
  console.log(GAME_SECRETS)
  console.error(chalk.red('Error: please provide valid MASTER_SECRET, PATCH_SECRET and GAME_SECRETS env variables'))
  process.exit(1)
}

export const DEFAULT_MAX_PLAYERS = 8
export const DEFAULT_TIMEOUT_PERIOD = 0x3A98
export const HOST_ID = 1

// should be half according to
// https://www.helles-koepfchen.de/online_spiele/super_soaker_championship/index.html
export const ARMOR_DAMAGE_PERCENTAGE = 50

// TODO: figure these out, maybe some are random too?
export const WEAPON1_DAMAGE = Number(process.env.WEAPON1_DAMAGE ?? 60)
export const WEAPON2_DAMAGE = Number(process.env.WEAPON2_DAMAGE ?? 40)
export const WEAPON3_DAMAGE = Number(process.env.WEAPON3_DAMAGE ?? 90)
export const WEAPON4_DAMAGE = Number(process.env.WEAPON4_DAMAGE ?? 40)
export const WEAPON5_DAMAGE = Number(process.env.WEAPON5_DAMAGE ?? 50)
export const WEAPON9_DAMAGE = Number(process.env.WEAPON9_DAMAGE ?? 20)
// documentation only mentions it should reduce by a bit
// https://www.helles-koepfchen.de/online_spiele/super_soaker_championship/index.html
export const TOWEL_HEALTH = Number(process.env.TOWEL_HEALTH ?? 70)

// game server to master server connection
export const MASTER_INTERNAL_IP = process.env.MASTER_INTERNAL_IP ?? '127.0.0.1'
export const MASTER_INTERNAL_PORT = Number(process.env.MASTER_INTERNAL_PORT ?? 8081)
export const GAME_EXTERNAL_IP = process.env.GAME_EXTERNAL_IP ?? '127.0.0.1'

// patch server versions
export const PATCH_SUPERSOAKER_VERSION = process.env.PATCH_SUPERSOAKER_VERSION ?? '1.40'
export const PATCH_DATA_VERSIONS = (process.env.PATCH_DATA_VERSIONS ?? '1.40,1.40').split(',')
export const PATCH_BANNER_VERSION = process.env.PATCH_BANNER_VERSION ?? '1.35'
