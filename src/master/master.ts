import net from 'node:net'
import chalk from 'chalk'
import { MAX_PLAYERS, VERSION } from '../constants.js'
import { GAME_TYPE, LEVEL, MASTER_RESPONSE } from '../enums.js'
import { convertIp, intToStr, strToInt } from '../utils/convert.js'
import { masterDecryptString, masterEncryptString } from '../utils/encryption.js'

// TODO: make this dynamic maybe
const servers = [
  { port: 8085, maxPlayers: MAX_PLAYERS, players: 2, level: LEVEL.DIE_INSELN, type: GAME_TYPE.NORMAL, ip: '127.0.0.1' },
]

function generateServerListResponse() {
  const response
        = intToStr(servers.length)
        + servers.map(server => intToStr(convertIp(server.ip))
          + intToStr(server.port)
          + intToStr(server.maxPlayers, 2)
          + intToStr(server.players, 2)
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

    console.log(chalk.gray(`MASTER IN: ${JSON.stringify(str)}`))
    const message = masterDecryptString(str)
    console.log(chalk.blueBright('MASTER REPLY: ', JSON.stringify(message)))

    const operation = strToInt(message, 1)

    switch (operation) {
      case 1:
        // TODO: implement refresh
        console.log('refresh')

        // const serverList = generateServerListResponse();
        // const response = MASTER_RESPONSE.UPDATE + serverList;

        // console.log({ response })
        // socket.write(masterEncryptString(response) + "\r\n");
        break
      case 80: {
        const mode = strToInt(message[1], 1)
        const name = message.slice(2)
        console.log(chalk.whiteBright(`MASTER LOG: list with mode ${mode}; name ${name}`))

        const serverList = generateServerListResponse()
        const response = MASTER_RESPONSE.SUCCESS + serverList + VERSION.padStart(4, '0')

        console.log(chalk.blueBright(`MASTER REPLY: ${JSON.stringify(response)}`))
        socket.write(`${masterEncryptString(response)}\r\n`)
        break
      }
      default:
        console.log(chalk.red(`MASTER LOG: Unsupported operation, operation: ${JSON.stringify(message[0])} (${operation})`))
    }
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
