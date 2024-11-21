/* eslint-disable perfectionist/sort-imports */
import 'dotenv/config'
import { gameServer } from './game/game.js'
import { masterServer } from './master/master.js'

masterServer.listen(80, '0.0.0.0')

gameServer.bind(8085, '0.0.0.0')
