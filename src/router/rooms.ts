import express from 'express'

import roomController from '../controllers/rooms'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {

  /**
  * @swagger
  * /rooms:
  *   get:
  *     summary: Get all rooms
  *     tags:
  *       - Rooms
  *     responses:
  *       200:
  *         description: A list of all rooms
  *       500:
  *         description: Server error
  */
  router.get('/', roomController.getAllRooms)

    /**
  * @swagger
  * /rooms/select:
  *   get:
  *     summary: Get all rooms without pagination
  *     tags:
  *       - Rooms
  *     responses:
  *       200:
  *         description: A list of all rooms
  *       500:
  *         description: Server error
  */
  router.get('/select', roomController.getAllRoomsWithoutPagination)

  /**
  * @swagger
  * /rooms/{id}:
  *   get:
  *     summary: Get a specific user by ID
  *     tags:
  *       - Rooms
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Room retrieved successfully
  *       404:
  *         description: Room not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', roomController.getRoomById)

    /**
  * @swagger
  * /rooms:
  *   post:
  *     summary: Create a new room
  *     tags:
  *       - Rooms
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *                 example: "Room test"
  *     responses:
  *       201:
  *         description: Room created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', roomController.createRoom)

    /**
  * @swagger
  * /rooms/{id}:
  *   put:
  *     summary: Update room by ID
  *     tags:
  *       - Rooms
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *                 example: "John Doe"
  *     responses:
  *       200:
  *         description: Room updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/:id', requestHandler.validate, roomController.updateRoom)

  /**
  * @swagger
  * /rooms/{id}:
  *   delete:
  *     summary: Delete room by ID
  *     tags:
  *       - Rooms
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Room deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', roomController.deleteRoomById)

  return router
}
