import express from 'express'

import rechargeController from '../controllers/recharges'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  /**
  * @swagger
  * /recharges:
  *   get:
  *     summary: Get all recharges
  *     tags:
  *       - Recharges
  *     responses:
  *       200:
  *         description: A list of all recharges
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   id:
  *                     type: string
  *                     example: "recharge123"
  *                   amount:
  *                     type: number
  *                     example: 100.0
  *                   status:
  *                     type: string
  *                     example: "completed"
  *                   timestamp:
  *                     type: string
  *                     example: "2024-08-18T12:34:56Z"
  *       500:
  *         description: Server error
  */
  router.get('/', rechargeController.getAllRecharges)

  /**
  * @swagger
  * /recharges/{id}:
  *   get:
  *     summary: Get a specific recharge by ID
  *     tags:
  *       - Recharges
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Recharge retrieved successfully
  *       404:
  *         description: Recharge not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', rechargeController.getRecharge)

  /**
  * @swagger
  * /recharges/bank/{bankId}:
  *   get:
  *     summary: Get all recharges by bank ID
  *     tags:
  *       - Recharges
  *     parameters:
  *       - in: path
  *         name: bankId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Recharges retrieved successfully
  *       404:
  *         description: Bank not found
  *       500:
  *         description: Server error
  */
  router.get('/bank/:bankId', rechargeController.getAllByBankId)

  /**
  * @swagger
  * /recharges:
  *   post:
  *     summary: Create a new recharge
  *     tags:
  *       - Recharges
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               amount:
  *                 type: number
  *                 example: 100.0
  *               bankId:
  *                 type: string
  *                 example: "cm016ewe000073efa5abeu9ac"
  *               status:
  *                 type: string
  *                 example: PENDING or SUCCESS
  *               username:
  *                 type: string
  *                 example: user001
  *     responses:
  *       201:
  *         description: Recharge created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', rechargeController.createRecharge)

  /**
  * @swagger
  * /recharges/internal:
  *   post:
  *     summary: Create a new recharge internally
  *     tags:
  *       - Recharges
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               amount:
  *                 type: number
  *                 example: 100.0
  *               username:
  *                 type: string
  *                 example: user001
  *               creator:
  *                 type: string
  *                 example: admin01
  *     responses:
  *       201:
  *         description: Recharge created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/internal', rechargeController.createRechargeInternal)

  /**
  * @swagger
  * /recharges/{id}:
  *   delete:
  *     summary: Delete a recharge by ID
  *     tags:
  *       - Recharges
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Recharge deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', rechargeController.deleteRechargeById)

  /**
  * @swagger
  * /recharges/{id}:
  *   put:
  *     summary: Update a recharge by ID
  *     tags:
  *       - Recharges
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "recharge123"
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               amount:
  *                 type: number
  *                 example: 150.0
  *               status:
  *                 type: string
  *                 example: "pending"
  *     responses:
  *       200:
  *         description: Recharge updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put(
    '/:id',
    requestHandler.validate,
    rechargeController.updateRechargeById
  )

  return router
}
