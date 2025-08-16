import { ARMOR_DAMAGE_PERCENTAGE, modelDimensions, shotDimensions, WEAPON1_DAMAGE, WEAPON2_DAMAGE, WEAPON3_DAMAGE, WEAPON4_DAMAGE, WEAPON5_DAMAGE, WEAPON9_DAMAGE } from '../../constants.js'
import { FIGURE_SOUND, GAME_STATE_TYPE, GAME_TYPE, WEAPON } from '../../enums.js'
import { intToStr } from '../../utils/convert.js'
import { log } from '../../utils/logging.js'
import { rnd, seedRnd } from '../../utils/random.js'
import { sendGameStateToAll } from '../utils/outbound.js'
import { players } from './player.js'
import { gameSettings } from './settings.js'

export interface Shot {
  netId: number
  shotId: number
  team: number
  weapon: WEAPON
  entityX: number
  entityY: number
  entityZ: number
  rposX: number
  rposY: number
  speedX: number
  speedY: number
  speedZ: number
  lifespan: number
  gravity: number
  sizeX: number
  sizeY: number
  sizeZ: number
  scale: number
  damage: number
}

let shotId = 1
export const shots: Shot[] = []

export function fire(requestId: number, netId: number, team: number, weapon: WEAPON | 10 | 11, entityX: number, entityY: number, entityZ: number, rposX: number, rposY: number, isRecursive = false) {
  shotId++
  if (shotId > 40000) {
    shotId = 1
  }

  if (!isRecursive) {
    seedRnd(shotId)
  }

  let speedX
  let speedY
  let speedZ
  let dimensions
  let gravity
  let lifespan
  let damage

  switch (weapon) {
    // fire.bb:7
    case WEAPON.LIQUIDATOR: {
      speedX = (1.4 * (-Math.sin(rposX * Math.PI / 180))) * Math.cos(rposY * Math.PI / 180)
      speedY = 1.4 * (-Math.sin(rposY * Math.PI / 180))
      speedZ = (1.4 * Math.cos(rposX * Math.PI / 180)) * Math.cos(rposY * Math.PI / 180)
      lifespan = 0x64
      gravity = -0.003

      dimensions = shotDimensions[weapon]

      damage = WEAPON1_DAMAGE
      break
    }
    case WEAPON.WATERMINATOR:
      speedX = (1.5 * (-Math.sin(rposX * Math.PI / 180))) * Math.cos(rposY * Math.PI / 180)
      speedY = 1.5 * (-Math.sin(rposY * Math.PI / 180))
      speedZ = (1.5 * Math.cos(rposX * Math.PI / 180)) * Math.cos(rposY * Math.PI / 180)
      lifespan = 0x5A
      gravity = -0.003

      dimensions = shotDimensions[weapon]

      damage = WEAPON2_DAMAGE
      break

    case WEAPON.TRIPLE_SHOT:
      speedX = (1.3 * (-Math.sin((rnd(22, 0) + rposX - 11) * Math.PI / 180))) * Math.cos((rnd(22, 0) + rposY - 11) * Math.PI / 180)
      speedY = 1.3 * (-Math.sin((rnd(22, 0) + rposY - 11) * Math.PI / 180))
      speedZ = (1.3 * (Math.cos((rnd(22, 0) + rposX - 11) * Math.PI / 180))) * Math.cos((rnd(22, 0) + rposY - 11) * Math.PI / 180)
      lifespan = Math.floor(rnd(6, 0) + 30 - 3)
      gravity = -0.008

      dimensions = shotDimensions[weapon]

      damage = WEAPON3_DAMAGE

      break

    case WEAPON.ARCTIC_SHOCK: {
      const speedFactor = rnd(0.4, 0) - 0.2
      speedX = ((1.1 + speedFactor) * (-Math.sin((rnd(4, 0) + rposX - 2) * Math.PI / 180))) * Math.cos((rnd(4, 0) + rposY - 2) * Math.PI / 180)
      speedY = (1.1 + speedFactor) * (-Math.sin((rnd(4, 0) + rposY - 2) * Math.PI / 180))
      speedZ = ((1.1 + speedFactor) * (Math.cos((rnd(4, 0) + rposX - 2) * Math.PI / 180))) * Math.cos((rnd(4, 0) + rposY - 2) * Math.PI / 180)
      lifespan = Math.floor(rnd(6, 0) + 39 - 3)
      gravity = -0.007

      dimensions = shotDimensions[weapon]

      damage = WEAPON4_DAMAGE
      break
    }

    case WEAPON.WASSERBOMBEN_ARMBRUST:
      speedX = (1.3 * (-Math.sin(rposX * Math.PI / 180))) * Math.cos(rposY * Math.PI / 180)
      speedY = 1.3 * (-Math.sin(rposY * Math.PI / 180))
      speedZ = (1.3 * Math.cos(rposX * Math.PI / 180)) * Math.cos(rposY * Math.PI / 180)
      lifespan = 0x82
      gravity = -0.022

      dimensions = shotDimensions[weapon]

      damage = WEAPON5_DAMAGE
      break

    case WEAPON.WASSERBOMBEN_EXPLOSION:
      // this is a bomb explosion, we need to create 24 + 10
      for (let i = 1; i <= 24; i++) {
        fire(requestId, netId, team, 10, entityX, entityY, entityZ, rposX, rposY)
      }
      for (let i = 1; i <= 10; i++) {
        fire(requestId, netId, team, 11, entityX, entityY, entityZ, rposX, rposY)
      }
      return { shotId }

    // 10 and 11 are decendends of 9 (water bomb explosion)
    case 10:
      weapon = WEAPON.WASSERBOMBEN_EXPLOSION
      speedX = rnd(0.7, 0) - 0.35
      speedY = rnd(0.4, 0)
      speedZ = rnd(0.8, 0) - 0.35
      lifespan = rnd(6, 0) + 32 - 3
      gravity = -0.038

      dimensions = shotDimensions[WEAPON.WASSERBOMBEN_EXPLOSION]

      damage = WEAPON9_DAMAGE
      break

    case 11: {
      weapon = WEAPON.WASSERBOMBEN_EXPLOSION
      speedX = rnd(0.5, 0) - 0.25
      speedY = rnd(0.5, 0) - 0.55
      speedZ = rnd(0.5, 0) - 0.25
      lifespan = rnd(6, 0) + 32 - 3
      gravity = -0.038

      dimensions = shotDimensions[WEAPON.WASSERBOMBEN_EXPLOSION]

      damage = WEAPON9_DAMAGE
      break
    }
    default:
      log('fire: Invalid weapon', 'error', requestId, { weapon })
      return
  }

  const shot: Shot = {
    netId,
    team,
    shotId,
    weapon,
    entityX,
    entityY,
    entityZ,
    rposX,
    rposY,
    speedX,
    speedY,
    speedZ,
    gravity,
    lifespan,
    sizeX: dimensions.x,
    sizeY: dimensions.y,
    sizeZ: dimensions.z,
    scale: dimensions.scale,
    damage,
  }

  shots.push(shot)

  return shot
}

export function trackShots() {
  for (const shot of shots.slice()) {
    shot.entityX += shot.speedX
    shot.entityY += shot.speedY
    shot.entityZ += shot.speedZ

    shot.speedY += shot.gravity

    for (const player of players) {
      if (player.connecting || !player.position || player.deadCooldown > 0
        // self hit only possible with baloon bomb
        || (player.netId === shot.netId && shot.weapon !== WEAPON.WASSERBOMBEN_EXPLOSION)
        // friendly fire is disabled
        || (gameSettings.type === GAME_TYPE.TEAM && player.team === shot.team && player.netId !== shot.netId)
      ) {
        continue
      }

      const playerDimensions = modelDimensions[player.figur]
      if (!playerDimensions) {
        throw new Error(`trackShots: Invalid model dimensions for model ${player.figur}`)
      }

      const transPlayerX = player.position.xpos - (playerDimensions.x / 2) * playerDimensions.scale
      const transPlayerY = player.position.ypos - (playerDimensions.y / 2) * playerDimensions.scale
      const transPlayerZ = player.position.zpos - (playerDimensions.z / 2) * playerDimensions.scale
      const transPlayerDimX = playerDimensions.x * playerDimensions.scale
      const transPlayerDimY = playerDimensions.y * playerDimensions.scale
      const transPlayerDimZ = playerDimensions.z * playerDimensions.scale
      const transShotX = shot.entityX - (shot.sizeX / 2) * shot.scale
      const transShotY = shot.entityY - (shot.sizeY / 2) * shot.scale
      const transShotZ = shot.entityZ - (shot.sizeZ / 2) * shot.scale
      const transShotDimX = shot.sizeX * shot.scale
      const transShotDimY = shot.sizeY * shot.scale
      const transShotDimZ = shot.sizeZ * shot.scale

      // TODO: this doesn't consider walls, but I'm not sure if the official server did either
      // TODO: rotation?
      if (transShotX <= transPlayerX + transPlayerDimX && transShotX + transShotDimX >= transPlayerX
        && transShotY <= transPlayerY + transPlayerDimY && shot.entityY + transShotDimY >= transPlayerY
        && transShotZ <= transPlayerZ + transPlayerDimZ && shot.entityZ + transShotDimZ >= transPlayerZ
      ) {
        shots.splice(shots.indexOf(shot), 1)

        const shootingPlayer = players.find(p => p.netId === shot.netId)
        const playerSelfHit = shot.netId === player.netId

        if (!playerSelfHit) {
          sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(shot.netId, 2) + intToStr(FIGURE_SOUND.GOTHIT1 + Math.floor(Math.random() * 5), 2))
        }

        if (player.isArmorBonus) {
          player.naessegrad += Math.floor(shot.damage / 100 * ARMOR_DAMAGE_PERCENTAGE)
        }
        else {
          player.naessegrad += shot.damage
        }

        if (player.naessegrad >= 100) {
          player.deadCooldown = 0x64
          player.naessegrad = 0
          player.deathCounter++

          if (playerSelfHit) {
            sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(player.netId, 2) + intToStr(FIGURE_SOUND.WATER1 + Math.floor(Math.random() * 3), 2))
          }
          else {
            sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(player.netId, 2) + intToStr(FIGURE_SOUND.DEAD1 + Math.floor(Math.random() * 3), 2))
          }
          sendGameStateToAll(GAME_STATE_TYPE.PLAYER_DIED, intToStr(shot.netId, 2) + intToStr(player.netId, 2))

          if (playerSelfHit && shootingPlayer) {
            shootingPlayer.score--
            sendGameStateToAll(GAME_STATE_TYPE.SCORE_UPDATE, intToStr(shootingPlayer.netId, 2) + intToStr(shootingPlayer.score, 4))
          }
          else if (shootingPlayer) {
            shootingPlayer.score++
            sendGameStateToAll(GAME_STATE_TYPE.SCORE_UPDATE, intToStr(shootingPlayer.netId, 2) + intToStr(shootingPlayer.score, 4))
          }
        }
        else if (!playerSelfHit) {
          sendGameStateToAll(GAME_STATE_TYPE.SOUND, intToStr(player.netId, 2) + intToStr(FIGURE_SOUND.HIT1 + Math.floor(Math.random() * 8), 2))
        }

        sendGameStateToAll(
          GAME_STATE_TYPE.FIRE_STOP,
          intToStr(shot.shotId, 2)
          + intToStr(shot.netId, 1)
          + intToStr(player.netId, 1)
          // no sure what this is suppose to be, but it's not getting used in the client code anyway
          + intToStr(0, 1)
          + intToStr(player.naessegrad, 1)
          + intToStr(player.deathCounter, 4),
        )
      }
    }

    shot.lifespan--
    if (shot.lifespan <= 0) {
      shots.splice(shots.indexOf(shot), 1)
    }
  }
}
