import express from 'express'

import roomController from '../controllers/rooms'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', roomController.getAllRooms)
  router.get('/select', roomController.getAllRoomsWithoutPagination)
  router.get('/:id', roomController.getRoomById)
  router.post('/', roomController.createRoom)
  router.put('/:id', requestHandler.validate, roomController.updateRoom)
  router.delete('/:id', roomController.deleteRoomById)

  return router
}
