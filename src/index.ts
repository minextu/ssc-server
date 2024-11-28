/* eslint-disable perfectionist/sort-imports */
import 'dotenv/config'
import { gameServer } from './game/game.js'
import { masterServer } from './master/master.js'
// import { server } from './debug-client/websocket-server.js'

masterServer.listen(80, '0.0.0.0')

gameServer.bind(8085, '0.0.0.0')

// server.listen(8080, () => {
//   console.log(`${new Date()} websocket Server is listening on port 8080`)
// })
