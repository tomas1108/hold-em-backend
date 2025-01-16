import express from 'express'

import bankController from '../controllers/banks'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  
  /**
  * @swagger
  * /banks:
  *   get:
  *     summary: Get all banks
  *     tags:
  *       - Banks
  *     responses:
  *       200:
  *         description: A list of all banks
  *       500:
  *         description: Server error
  */
  router.get('/', bankController.getAllBanks)

  /**
  * @swagger
  * /banks/{id}:
  *   get:
  *     summary: Get a bank by ID
  *     tags:
  *       - Banks
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Bank information retrieved successfully
  *       404:
  *         description: Bank not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', bankController.getBank)

  /**
 * @swagger
  * /banks/user/{userId}:
  *   get:
  *     summary: Get a bank by user ID
  *     tags:
  *       - Banks
  *     parameters:
  *       - in: path
  *         name: userId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Bank information retrieved successfully
  *       404:
  *         description: Bank not found
  *       500:
  *         description: Server error
  */
  router.get('/user/:userId', bankController.getBankByUserId)

  /**
 * @swagger
  * /banks:
  *   post:
  *     summary: Create a new bank entry
  *     tags:
  *       - Banks
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               cardNumber:
  *                 type: string
  *                 example: "1234-5678-9876-5432"
  *               securityCode:
  *                 type: string
  *                 example: "123"
  *               cardHolderName:
  *                 type: string
  *                 example: "John Doe"
  *               expiryDate:
  *                 type: string
  *                 example: "2024-12-01T00:00:00Z"
  *               userId:
  *                 type: string
  *                 example: "cm016ewe000073efa5abeu9ac"
  *               usename:
  *                 type: string
  *                 example: "user123"
  *     responses:
  *       201:
  *         description: Bank entry created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', bankController.createBank)


  /**
 * @swagger
  * /banks/{id}:
  *   delete:
  *     summary: Soft delete a bank by ID
  *     tags:
  *       - Banks
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Bank deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', bankController.deleteBankById)


  /**
 * @swagger
  * /banks/{id}:
  *   put:
  *     summary: Update a bank by ID
  *     tags:
  *       - Banks
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
  *               cardNumber:
  *                 type: string
  *                 example: "1234-5678-9876-5432"
  *               securityCode:
  *                 type: string
  *                 example: "123"
  *               cardHolderName:
  *                 type: string
  *                 example: "John Doe"
  *               expiryDate:
  *                 type: string
  *                 example: "2024-12-01T01:30:00.000-05:00"
  *     responses:
  *       200:
  *         description: Bank updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/:id', requestHandler.validate, bankController.updateBankById)

  return router
}
