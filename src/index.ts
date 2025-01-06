import express from 'express'
import http from 'http'
import { corsOptions } from './configs/cors'
import { Server } from 'socket.io'
import gameSocket from './socket'
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types'

import router from './router'
import configureMiddleware from './middlewares/config'

const app = express()

configureMiddleware(app)

app.use('/', router())

const server = http.createServer(app)

// const io = new Server<
//   ClientToServerEvents,
//   ServerToClientEvents,
//   InterServerEvents,
//   SocketData
// >(server)

const io = new Server(server)

io.on('connection', socket => gameSocket.init({ socket, io }))

app.set('io', io)

server.listen(8082, () => {
  console.log('Server running on http://localhost:8082/')
})
