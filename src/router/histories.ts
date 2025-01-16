import express from 'express'

import historyController from '../controllers/histories'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
    
  /**
  * @swagger
  * /histories:
  *   get:
  *     summary: Get all histories
  *     tags:
  *       - Histories
  *     responses:
  *       200:
  *         description: A list of all histories
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   id:
  *                     type: string
  *                     example: "history123"
  *                   userId:
  *                     type: string
  *                     example: "user123"
  *                   tableId:
  *                     type: string
  *                     example: "table123"
  *                   action:
  *                     type: string
  *                     example: "insert"
  *                   timestamp:
  *                     type: string
  *                     example: "2024-08-18T12:34:56Z"
  *       500:
  *         description: Server error
  */
  router.get('/', historyController.getHistories)

  /**
  * @swagger
  * /histories/user/{userId}:
  *   get:
  *     summary: Get histories by user ID
  *     tags:
  *       - Histories
  *     parameters:
  *       - in: path
  *         name: userId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Histories retrieved successfully
  *       404:
  *         description: User not found
  *       500:
  *         description: Server error
  */
  router.get('/user/:userId', historyController.getHistoriesByUserId)

  /**
  * @swagger
  * /histories/statistical/{userId}/{tableId}:
  *   get:
  *     summary: Get statistical data by user ID and table ID
  *     tags:
  *       - Histories
  *     parameters:
  *       - in: path
  *         name: userId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *       - in: path
  *         name: tableId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Statistical data retrieved successfully
  *       404:
  *         description: Data not found
  *       500:
  *         description: Server error
  */
  router.get(
    '/statistical/:userId/:tableId',
    historyController.getStatisticalByTableId
  )
  return router
}
