import express from 'express'

import tableController from '../controllers/tables'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', tableController.getAllTables)
  router.get('/active', tableController.getTablesByRoom)
  router.get('/:id', tableController.getTable)
  router.post('/join-random', tableController.joinRandomTable)
  router.post('/validate', tableController.checkTableSecret)
  router.post('/switch/:id', tableController.switchTable)
  router.post('/', tableController.createTable)
  router.put('/:id', requestHandler.validate, tableController.updateTable)
  router.delete('/:id', tableController.deleteTableById)
  router.get('/room/:roomId', tableController.getTablesWithOneToNinePlayers);
  
  return router
}
