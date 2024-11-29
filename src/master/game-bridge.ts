import type { MasterBridgePacket } from '../game/state/master-bridge.js'
import net from 'node:net'
import chalk from 'chalk'

export const servers: (MasterBridgePacket & { lastHeard: number })[] = []

/**
 * Communication between master server and other game servers
 */
export const gameBridgeServer = net.createServer((socket) => {
  socket.on('data', (data) => {
    const server = JSON.parse(data.toString()) as MasterBridgePacket
    if (!('port' in server) || !('ip' in server)) {
      console.log(chalk.red('MASTER: invalid game server packet received'), server)
      return
    }

    let index = servers.findIndex(s => s.ip === server.ip && s.port === server.port)
    if (index === -1) {
      index = servers.length
      console.log(chalk.whiteBright('MASTER: game server added'), server)
    }

    servers[index] = { ...server, lastHeard: Date.now() }
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
