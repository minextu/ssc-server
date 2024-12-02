/* eslint-disable perfectionist/sort-imports */
import 'dotenv/config'
import { setupGameServer } from './game/game.js'
import { masterServer } from './master/master.js'
import { Argument, program } from 'commander'
import { websocketDebugServer } from './debug-client/websocket-server.js'
import { gameBridgeServer } from './master/game-bridge.js'
import { DEFAULT_MAX_PLAYERS, DEFAULT_TIMEOUT_PERIOD, MASTER_INTERNAL_IP, MASTER_INTERNAL_PORT } from './constants.js'
import { patchServer } from './patch/patch.js'
import { patchWebServer } from './patch/patch-webserver.js'

program
  .command('master')
  .description('host the master server')
  .option('-p,--port <port>', 'tcp port to host the game server (unpatched executable expects port 80)', '81')
  .action(({ port }) => {
    masterServer.listen(Number(port), '0.0.0.0')
    gameBridgeServer.listen(MASTER_INTERNAL_PORT, MASTER_INTERNAL_IP)
  })

program.command('game')
  .description('host a game server')
  .addArgument(new Argument('<level>', '1 for ALHAMBRA, 2 for DIE_INSELN, 3 for DIE_BRUECKEN').choices(['1', '2', '3', '4']))
  .addArgument(new Argument('[type]', '1 for NORMAL (Default), 2 for CTF').choices(['1', '2', '3']).default(1, 'NORMAL'))
  .option('-p,--port <port>', 'udp port to host the game server', '8085')
  .option('-m,--max-players <amount>', 'amount of players that can join this game', String(DEFAULT_MAX_PLAYERS))
  .option('-t,--timeout <milliseconds>', 'timeout period until inactive players are removed', String(DEFAULT_TIMEOUT_PERIOD))
  .option('-d,--debug-server', 'enable websocket debug server')
  .action((level, type, { port, maxPlayers, timeout, debugServer = false }) => {
    setupGameServer(Number(port), Number(level), Number(type), Number(maxPlayers), Number(timeout))

    if (debugServer) {
      const debugServerPort = 8082
      websocketDebugServer.listen(debugServerPort, () => {
        console.log(`Debug Websocket Server listening on port ${debugServerPort}`)
      })
    }
  })

program
  .command('patch')
  .description('host the patch server')
  .option('-p,--port <port>', 'tcp port to host the patch server', '8080')
  .option('-wp,--webserver-port <port>', 'tcp port to host the patch webserver at', '80')
  .action(({ port, webserverPort }) => {
    patchServer.listen(Number(port), '0.0.0.0')
    patchWebServer.listen(Number(webserverPort), '0.0.0.0')
  })

program.parse()
