import express from 'express'

import playerController from '../controllers/players'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  
  /**
  * @swagger
  * /players:
  *   get:
  *     summary: Get all players
  *     tags:
  *       - Players
  *     responses:
  *       200:
  *         description: A list of all players
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   id:
  *                     type: string
  *                     example: "player123"
  *                   name:
  *                     type: string
  *                     example: "John Doe"
  *                   score:
  *                     type: integer
  *                     example: 75
  *       500:
  *         description: Server error
  */
  router.get('/', playerController.getAllPlayers)

  
  /**
  * @swagger
  * /players/{id}:
  *   get:
  *     summary: Get a specific player by ID
  *     tags:
  *       - Players
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Player retrieved successfully
  *       404:
  *         description: Player not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', playerController.getPlayer)

  
  /**
  * @swagger
  * /players/table/{tableId}:
  *   get:
  *     summary: Get players by table ID
  *     tags:
  *       - Players
  *     parameters:
  *       - in: path
  *         name: tableId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Players retrieved successfully
  *       404:
  *         description: Table not found
  *       500:
  *         description: Server error
  */
  router.get('/table/:tableId', playerController.getPlayersByTableId)

  
  /**
  * @swagger
  * /players/{tableId}/{userId}:
  *   get:
  *     summary: Get the current player of a specific table by user ID
  *     tags:
  *       - Players
  *     parameters:
  *       - in: path
  *         name: tableId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *       - in: path
  *         name: userId
  *         required: true
  *         schema:
  *           type: string
  *           example: "user123"
  *     responses:
  *       200:
  *         description: Player retrieved successfully
  *       404:
  *         description: Player not found
  *       500:
  *         description: Server error
  */
  router.get('/:tableId/:userId', playerController.getCurrentPlayerOfTable)

  
  /**
  * @swagger
  * /players/table/user/{userId}:
  *   get:
  *     summary: Get the current player without a table by user ID
  *     tags:
  *       - Players
  *     parameters:
  *       - in: path
  *         name: userId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Player retrieved successfully
  *       404:
  *         description: Player not found
  *       500:
  *         description: Server error
  */
  router.get('/table/user/:userId', playerController.getCurrentPlayerWithoutTable)

  
  /**
  * @swagger
  * /players:
  *   post:
  *     summary: Create a new player
  *     tags:
  *       - Players
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
  *               score:
  *                 type: integer
  *                 example: 45
  *     responses:
  *       201:
  *         description: Player created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', playerController.createPlayer)

  
  /**
  * @swagger
  * /players/{id}:
  *   delete:
  *     summary: Remove a player by ID
  *     tags:
  *       - Players
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Player removed successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', playerController.removePlayer)

  
  /**
  * @swagger
  * /players/{id}:
  *   put:
  *     summary: Update a player by ID
  *     tags:
  *       - Players
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
  *               score:
  *                 type: integer
  *                 example: 80
  *     responses:
  *       200:
  *         description: Player updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/:id', requestHandler.validate, playerController.updatePlayerById)

  
  /**
  * @swagger
  * /players/rebuy/{id}:
  *   post:
  *     summary: Rebuy for a player
  *     tags:
  *       - Players
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Rebuy successful
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/rebuy/:id', playerController.rebuy)
  
  // Add the new route to get the number of players in a table
  router.get('/table/:tableId/players/count', playerController.getNumberPlayer)
  router.post('/player-bot', playerController.getBotUsers)

  return router
}
