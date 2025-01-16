import express from 'express'

import tableController from '../controllers/tables'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {

  /**
  * @swagger
  * /tables:
  *   get:
  *     summary: Get all tables
  *     tags:
  *       - Tables
  *     responses:
  *       200:
  *         description: A list of all tables
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   id:
  *                     type: string
  *                     example: "cm016ewe000073efa5abeu9ac"
  *                   name:
  *                     type: string
  *                     example: "Main Table"
  *                   status:
  *                     type: string
  *                     example: "active"
  *       500:
  *         description: Server error
  */
  router.get('/', tableController.getAllTables)

  /**
  * @swagger
  * /tables/active:
  *   get:
  *     summary: Get all tables by room
  *     tags:
  *       - Tables
  *     parameters:
  *       - in: query
  *         name: roomId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: List all tables
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.get('/active', tableController.getTablesByRoom)


  /**
  * @swagger
  * /tables/{id}:
  *   get:
  *     summary: Get a specific table by ID
  *     tags:
  *       - Tables
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Table retrieved successfully
  *       404:
  *         description: Table not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', tableController.getTable)

  
  /**
  * @swagger
  * /tables/join-random:
  *   post:
  *     summary: Join a random table with roomId
  *     tags:
  *       - Tables
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               currentChipsOfUser:
  *                 type: number
  *                 example: 3333
  *               roomId:
  *                 type: string
  *                 example: "cm0448k6i0001140dndasmm9o"
  *     responses:
  *       201:
  *         description: Join table successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/join-random', tableController.joinRandomTable)


  /**
  * @swagger
  * /tables/validate:
  *   post:
  *     summary: Validate the table secret
  *     tags:
  *       - Tables
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               code:
  *                 type: string
  *                 example: 1234
  *               pass:
  *                 type: string
  *                 example: 123456
  *               roomId:
  *                 type: string
  *                 example: "cm0448k6i0001140dndasmm9o"
  *     responses:
  *       201:
  *         description: The table secret is valid
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/validate', tableController.checkTableSecret)

  
  /**
  * @swagger
  * /tables/switch/{id}:
  *   post:
  *     summary: Switch a table by ID
  *     tags:
  *       - Tables
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Table switched successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/switch/:id', tableController.switchTable)


  /**
  * @swagger
  * /tables:
  *   post:
  *     summary: Create a new table
  *     tags:
  *       - Tables
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *                 example: "Main Table"
  *               userId:
  *                 type: string
  *                 example: "cm0448k6i0001140dndasmm9o"
  *               minBuyIn:
  *                 type: number
  *                 example: 20000
  *               maxBuyIn:
  *                 type: number
  *                 example: 100000
  *               ante:
  *                 type: number
  *                 example: 1000
  *               code:
  *                 type: string
  *                 example: 1234
  *               password:
  *                 type: string
  *                 example: 123456
  *               roomId:
  *                 type: string
  *                 example: 123456
  *     responses:
  *       201:
  *         description: Table created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', tableController.createTable)


  /**
  * @swagger
  * /tables/{id}:
  *   put:
  *     summary: Update a table by ID
  *     tags:
  *       - Tables
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
  *               minBuyIn:
  *                 type: number
  *                 example: 20000
  *               maxBuyIn:
  *                 type: number
  *                 example: 100000
  *               name:
  *                 type: string
  *                 example: "Main Table"
  *               ante:
  *                 type: number
  *                 example: 1000
  *               chatBanned:
  *                 type: boolean
  *                 example: true
  *     responses:
  *       200:
  *         description: Table updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/:id', requestHandler.validate, tableController.updateTable)

  /**
  * @swagger
  * /tables/{id}:
  *   delete:
  *     summary: Delete a table by ID
  *     tags:
  *       - Tables
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Table deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', tableController.deleteTableById)
  
  /**
  * @swagger
  * /tables/room/{roomId}:
  *   get:
  *     summary: Get all tables with one to nine players
  *     tags:
  *       - Tables
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: List all tables
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.get('/room/:roomId', tableController.getTablesWithOneToNinePlayers);
  return router
}
