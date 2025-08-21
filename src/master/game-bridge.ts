import type { GameSettings } from '../game/state/settings.js'
import net from 'node:net'
import chalk from 'chalk'

export interface MasterInfoPacket {
  packetType: 'INFO'
}

export type MasterBridgePacket = GameSettings & {
  packetType: 'GAME_UPDATE'
  currentPlayers: number
  names: string[]
  ip: string
}

export const servers: (MasterBridgePacket & { lastHeard: number })[] = []

/**
 * Communication between master server and other game servers
 */
export const gameBridgeServer = net.createServer((socket) => {
  socket.on('data', (data) => {
    let server: MasterBridgePacket | MasterInfoPacket
    try {
      server = JSON.parse(data.toString())
    }
    catch (err) {
      console.log(chalk.red(`MASTER BRIDGE: receive error`, err))
      return
    }

    // external info request, return list of servers (i.e. for outside projects)
    if (server.packetType === 'INFO') {
      socket.write(JSON.stringify(servers))
      socket.end()
    }
    // new game server started, add it to the list
    else if (server.packetType === 'GAME_UPDATE') {
      if (!('port' in server) || !('ip' in server)) {
        console.log(chalk.red('MASTER BRIDGE: invalid game server packet received'), server)
        return
      }

      let index = servers.findIndex(s => s.ip === server.ip && s.port === server.port)
      if (index === -1) {
        index = servers.length
        console.log(chalk.whiteBright('MASTER BRIDGE: game server added'), server)
      }

      servers[index] = { ...server, lastHeard: Date.now() }
    }
    else {
      console.log(chalk.red(`MASTER BRIDGE: Invalid packet type ${(server as any)?.packetType ?? '??'}`))
    }
  })
})

gameBridgeServer.on('listening', () => {
  const address = gameBridgeServer.address()
  if (typeof address === 'string' || address === null) {
    console.log(`Master Game Bridge server listening on socket`)
    return
  }

  const port = address.port
  const ipaddr = address.address
  console.log(`Master Game Bridge Server is listening at ${ipaddr} port ${port}`)

  setInterval(() => {
    servers.forEach((server, idx) => {
      if (Date.now() - server.lastHeard >= 2000) {
        console.log(chalk.whiteBright('MASTER: game server removed'), server)
        servers.splice(idx, 1)
      }
    })
  }, 1000)
})
