import express from 'express'

import messageController from '../controllers/messages'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  /**
  * @swagger
  * /messages:
  *   get:
  *     summary: Get all messages
  *     tags:
  *       - Messages
  *     responses:
  *       200:
  *         description: A list of all messages
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   id:
  *                     type: string
  *                     example: "message123"
  *                   userId:
  *                     type: string
  *                     example: "user123"
  *                   content:
  *                     type: string
  *                     example: "Hello, how are you?"
  *                   timestamp:
  *                     type: string
  *                     example: "2024-08-18T12:34:56Z"
  *       500:
  *         description: Server error
  */
  router.get('/', messageController.getMessages)

  return router
}
