import type Buffer from 'node:buffer'
import type { Player } from '../game/state/player.js'
import chalk from 'chalk'
import { GAME_PACKET, GAME_STATE_TYPE } from '../enums.js'

type AdditionalContext = Record<string, string | number | boolean | Array<string | number | boolean>>
type LogType = 'error' | 'info' | 'warning'

interface LogContext {
  message: string
  packetType: number
  target: number
  messageData: string
  data: Buffer
  player?: Player
  outbound: {
    packetType: number
    gameStateType?: number
    messageData: string
    message: string
    isResponse: boolean
    additionalContext: AdditionalContext
  }[]
  gameStateType?: number
  udpCounter?: number
  logs: { message: string, additionalContext: AdditionalContext, type: LogType }[]
}

export const requestContexts: { [requestId: number]: LogContext } = {}

function validateContext(requestId: number) {
  if (requestContexts[requestId] === undefined) {
    throw new Error('Log context not populated')
  }
}

export function populateLogContext(requestId: number, context: Omit<LogContext, 'outbound' | 'logs'>) {
  requestContexts[requestId] = { ...context, outbound: [], logs: [] }
}

export function extendLogContext(requestId: number, context: Partial<LogContext>) {
  validateContext(requestId)
  requestContexts[requestId] = { ...requestContexts[requestId], ...context }
}

export function logReply(requestId: number, message: string, additionalContext: AdditionalContext & { packetType: number, gameStateType?: number, messageData: string }) {
  const { packetType, gameStateType, messageData, ...context } = additionalContext
  validateContext(requestId)
  requestContexts[requestId].outbound.push({ isResponse: true, message, additionalContext: context, packetType, gameStateType, messageData })
}

export function log(message: string, type: LogType = 'info', requestId?: number, additionalContext: AdditionalContext = {}) {
  const logCtx = { message, additionalContext, type }

  if (requestId) {
    validateContext(requestId)
    requestContexts[requestId].logs.push(logCtx)
  }
  else {
    console.log(internalLog([logCtx]))
  }
}

export function logOutbound(message: string, additionalContext: AdditionalContext & { packetType: number, gameStateType?: number, messageData: string }, requestId?: number) {
  const { packetType, gameStateType, messageData, ...context } = additionalContext

  const logCtx = { packetType, gameStateType, messageData, isResponse: false, message, additionalContext: { broadcast: 1, ...context } }
  if (requestId) {
    validateContext(requestId)
    requestContexts[requestId].outbound.push(logCtx)
  }
  else {
    console.log(internalLogOutbound([logCtx]))
  }
}

function internalLog(logs: LogContext['logs']) {
  let output = ''
  logs.forEach((l) => {
    let color = chalk.white
    if (l.type === 'error') {
      color = chalk.red
    }
    else if (l.type === 'warning') {
      color = chalk.yellow
    }

    output += color(`\nGAME LOG: ${l.message} ${JSON.stringify(l.additionalContext)}`)
  })

  return output
}

function internalLogOutbound(outboundList: LogContext['outbound']) {
  let output = ''
  outboundList.forEach((outbound) => {
    const isGameState = outbound.gameStateType !== undefined
    output += chalk.blue(`\n${outbound.isResponse ? 'GAME REPLY' : 'GAME OUT'
    }: | ${!isGameState
      ? `TYPE: ${Object.entries(GAME_PACKET).find(([,value]) => value === outbound.packetType)?.[0] ?? outbound.packetType}`
      : `STATE: ${Object.entries(GAME_STATE_TYPE).find(([,value]) => value === outbound.gameStateType)?.[0] ?? outbound.gameStateType}`
    } | DATA: ${
      JSON.stringify(outbound.messageData)} (${JSON.stringify(outbound.additionalContext)})`,
    )
  })

  return output
}

export function flushLog(requestId: number) {
  validateContext(requestId)

  const context = requestContexts[requestId]

  const isGameState = context.gameStateType !== undefined

  // don't output packets without logs
  if (context.logs.length > 0 || context.outbound.length > 0) {
    let fullLog = chalk.gray(
      `GAME IN from ${context.player?.name ?? '?'
      }: | ${!isGameState
        ? `TYPE: ${Object.entries(GAME_PACKET).find(([,value]) => value === context.packetType)?.[0] ?? context.packetType}`
        : `STATE: ${Object.entries(GAME_STATE_TYPE).find(([,value]) => value === context.gameStateType)?.[0] ?? context.gameStateType}`
      } | TARGET: ${context.target
      }${context.udpCounter !== undefined ? ` | COUNTER: ${context.udpCounter}` : ''
      } | DATA: ${JSON.stringify(context.messageData)}`,
    )

    fullLog += internalLog(context.logs)
    fullLog += internalLogOutbound(context.outbound)

    console.log(fullLog)
  }

  delete requestContexts[requestId]
}
