import net from 'node:net'
import chalk from 'chalk'
import { PATCH_DATA_VERSIONS, PATCH_SUPERSOAKER_VERSION } from '../constants.js'
import { intToStr, strToInt } from '../utils/convert.js'
import { patchDecryptString, patchEncryptString } from '../utils/encryption.js'

// SuperSoaker.exe, data_2.dat, data_3.dat, banner.jpg
// oldest: 1.04, 1.04, 1.04, 1.04
// latest: 1.40, 1.35, 1.40, 1.35
const files = {
  'SuperSoaker.exe': PATCH_SUPERSOAKER_VERSION,
  ...PATCH_DATA_VERSIONS.reduce((val, current, idx) => (
    { ...val, [`data_${idx + 2}.dat`]: current }
  ), {}),
  'banner.jpg': '1.35',
}

export const patchServer = net.createServer((socket) => {
  socket.on('data', (data) => {
    const str = data.toString().replaceAll('\n', '').replaceAll('\r', '')
    if (!str) {
      return
    }

    const message = patchDecryptString(str)
    if (!message) {
      return
    }

    console.log(chalk.gray(`PATCH IN: ${JSON.stringify(message)}`))

    const operation = strToInt(message, 1)

    switch (operation) {
      case 68: {
        const response = intToStr(69, 1)
          + intToStr(Object.values(files).length, 4)
          + Object.values(files).map(file => file.padStart(4, '0')).join('')
        console.log(chalk.blueBright('PATCH REPLY: ', JSON.stringify(response)))
        socket.write(`${patchEncryptString(response)}\r\n`)
        break
      }
      default:
        console.log(chalk.red(`PATCH LOG: Unsupported operation, operation: ${JSON.stringify(message[0])} (${operation})`))
    }
  })
})

patchServer.on('listening', () => {
  const address = patchServer.address()
  if (typeof address === 'string' || address === null) {
    console.log(`Patch server listening on socket`)
    return
  }

  const port = address.port
  const ipaddr = address.address
  console.log(`Patch Server is listening at ${ipaddr} port ${port}`)
})

patchServer.on('error', (error) => {
  console.log(chalk.red(`PATCH ERROR: ${error}`))
})
