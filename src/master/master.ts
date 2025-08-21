import net from 'node:net'
import chalk from 'chalk'
import { VERSION } from '../constants.js'
import { MASTER_RESPONSE } from '../enums.js'
import { convertIp, intToStr, strToInt } from '../utils/convert.js'
import { masterDecryptString, masterEncryptString } from '../utils/encryption.js'
import { servers } from './game-bridge.js'

function generateServerListResponse() {
  const response = intToStr(servers.length, 4)
    + servers.map(server =>
      intToStr(convertIp(server.ip), 4)
      + intToStr(server.port, 4)
      + intToStr(server.maxPlayers, 2)
      + intToStr(server.currentPlayers, 2)
      + intToStr(server.level, 2)
      + intToStr(server.type, 2),
    ).join('')
  return response
}

export const masterServer = net.createServer((socket) => {
  socket.on('data', (data) => {
    const str = data.toString().replaceAll('\n', '').replaceAll('\r', '')
    if (!str) {
      return
    }

    if (str.includes('HTTP')) {
      socket.write(
        'HTTP/1.0 501 Not Implemented\r\n'
        + '\r\n',
      )
      // this request was not made by the game client, we can close it safely
      return socket.end()
    }

    const message = masterDecryptString(str)
    if (!message) {
      return
    }

    console.log(chalk.gray(`MASTER IN: ${JSON.stringify(message)}`))

    const operation = strToInt(message, 1)

    switch (operation) {
      case 1: {
        const serverList = generateServerListResponse()
        const response = MASTER_RESPONSE.UPDATE + serverList

        console.log(chalk.blueBright('MASTER REPLY: ', JSON.stringify(response)))

        socket.write(`${masterEncryptString(response)}\r\n`)
        break
      }
      case 80: {
        const mode = strToInt(message[1], 1)
        const name = message.slice(2)
        console.log(chalk.whiteBright(`MASTER LOG: list with mode ${mode}; name ${name}`))

        let response
        // The original game client always sends 1 here
        if (mode !== 1) {
          console.log(chalk.yellow(`MASTER LOG: mode ${mode} is invalid`))
          response = MASTER_RESPONSE.UNKNOWN_GAME_TYPE
        }
        // ensure this name is unique across every game server
        else if (servers.flatMap(server => server.names).filter(name => name !== 'Herr Unbekannt').includes(name)) {
          console.log(chalk.yellow(`MASTER LOG: name ${name} is aleady taken`))
          response = MASTER_RESPONSE.INVALID_NAME
        }
        else {
          const serverList = generateServerListResponse()
          response = MASTER_RESPONSE.SUCCESS + serverList + VERSION.padStart(4, '0')
        }

        console.log(chalk.blueBright(`MASTER REPLY: ${JSON.stringify(response)}`))
        socket.write(`${masterEncryptString(response)}\r\n`)
        break
      }
      default:
        console.log(chalk.red(`MASTER LOG: Unsupported operation, operation: ${JSON.stringify(message[0])} (${operation})`))
    }
  })

  socket.on('error', (error) => {
    console.log(chalk.red(`MASTER SOCKET ERROR: ${error}`))
  })
})

masterServer.on('listening', () => {
  const address = masterServer.address()
  if (typeof address === 'string' || address === null) {
    console.log(`Master server listening on socket`)
    return
  }

  const port = address.port
  const ipaddr = address.address
  console.log(`Master Server is listening at ${ipaddr} port ${port}`)
})

masterServer.on('error', (error) => {
  console.log(chalk.red(`MASTER ERROR: ${error}`))
})
