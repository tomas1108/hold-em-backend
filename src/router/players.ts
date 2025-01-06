import express from 'express'

import playerController from '../controllers/players'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', playerController.getAllPlayers)
  router.get('/:id', playerController.getPlayer)
  router.get('/table/:tableId', playerController.getPlayersByTableId)
  router.get('/:tableId/:userId', playerController.getCurrentPlayerOfTable)
  router.get(
    '/table/user/:userId',
    playerController.getCurrentPlayerWithoutTable
  )
  router.post('/', playerController.createPlayer)
  router.delete('/:id', playerController.removePlayer)
  router.put('/:id', requestHandler.validate, playerController.updatePlayerById)
  router.post('/rebuy/:id', playerController.rebuy)
  router.post('/player-bot', playerController.getBotUsers)

  return router
}
