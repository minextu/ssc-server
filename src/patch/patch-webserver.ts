import fs, { read } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { PATCH_DATA_VERSIONS } from '../constants.js'

export const patchWebServer = http.createServer(async (req, res) => {
  if (req.headers['user-agent'] !== 'BlitzGet Deluxe') {
    res.writeHead(301, {
      location: `https://${req.headers.host ?? ''}${req.url}`,
    })
    res.end()
    return
  }

  const validFiles = ['SuperSoaker.exe', 'banner.jpg', ...PATCH_DATA_VERSIONS.map((_version, idx) => `data_${idx + 2}.dat`)]
  const fileName = validFiles.find(name => name === path.basename(req.url ?? ''))
  const filePath = path.join(fileURLToPath(import.meta.url), '../../../public', fileName ?? '')
  if (!fileName || await fs.promises.access(filePath, fs.promises.constants.F_OK).then(() => false).catch(() => true)) {
    console.log(filePath)
    console.log(chalk.yellow('PATCH WEB: file not found', path.basename(req.url ?? '')))
    res.writeHead(404)
    res.end()
    return
  }

  const stat = await fs.promises.stat(filePath)

  res.writeHead(200, {
    'Content-Length': stat.size,
  })

  console.log(`PATCH WEB: sending file ${filePath}`)

  const readStream = fs.createReadStream(filePath)
  readStream.pipe(res)

  res.on('finish', () => {
    console.log(`PATCH WEB: done sending file ${filePath}`)
  })
})

patchWebServer.on('listening', () => {
  const address = patchWebServer.address()
  if (typeof address === 'string' || address === null) {
    console.log(`Patch web server listening on socket`)
    return
  }

  const port = address.port
  const ipaddr = address.address
  console.log(`Patch Web Server is listening at ${ipaddr} port ${port}`)
})
