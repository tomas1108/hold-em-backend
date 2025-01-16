import express from 'express'

import withdrawController from '../controllers/withdraws'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  /**
  * @swagger
  * /withdraws:
  *   get:
  *     summary: Get all withdrawals
  *     tags:
  *       - Withdrawals
  *     responses:
  *       200:
  *         description: A list of all withdrawals
  *       500:
  *         description: Server error
  */
  router.get('/', withdrawController.getAllWithdraws)

  /**
  * @swagger
  * /withdraws/bank/{bankId}:
  *   get:
  *     summary: Get all withdrawals by bank ID
  *     tags:
  *       - Withdrawals
  *     parameters:
  *       - in: path
  *         name: bankId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Withdrawals retrieved successfully
  *       404:
  *         description: Bank not found
  *       500:
  *         description: Server error
  */
  router.get('/bank/:bankId', withdrawController.getAllByBankId)

  /**
  * @swagger
  * /withdraws/{id}:
  *   get:
  *     summary: Get a specific withdrawal by ID
  *     tags:
  *       - Withdrawals
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Withdrawal retrieved successfully
  *       404:
  *         description: Withdrawal not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', withdrawController.getWithdraw)

  /**
  * @swagger
  * /withdraws:
  *   post:
  *     summary: Create a new withdrawal
  *     tags:
  *       - Withdrawals
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
  *         description: Withdrawal created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', withdrawController.createWithdraw)

      /**
  * @swagger
  * /withdraws/internal:
  *   post:
  *     summary: Create a new withdraw internally
  *     tags:
  *       - Withdrawals
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
  *         description: Withdraw created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/internal', withdrawController.createWithdrawInternal)

  /**
  * @swagger
  * /withdraws/{id}:
  *   delete:
  *     summary: Delete a withdrawal by ID
  *     tags:
  *       - Withdrawals
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Withdrawal deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', withdrawController.deleteWithdrawById)

  /**
  * @swagger
  * /withdraws/{id}:
  *   put:
  *     summary: Update a withdrawal by ID
  *     tags:
  *       - Withdrawals
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
  *               amount:
  *                 type: number
  *                 example: 300.0
  *               status:
  *                 type: string
  *                 example: "pending"
  *     responses:
  *       200:
  *         description: Withdrawal updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put(
    '/:id',
    requestHandler.validate,
    withdrawController.updateWithdrawById
  )

  return router
}
