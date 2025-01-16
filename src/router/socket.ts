import express from 'express'

import messageController from '../controllers/messages'
import playerController from '../controllers/players'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  
  /**
  * @swagger
  * /socket/messages:
  *   post:
  *     summary: Create a new message
  *     tags:
  *       - Socket
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               content:
  *                 type: string
  *                 example: "Hello World!"
  *               user:
  *                 type: string
  *                 example: "user123"
  *               stickerImageSrc:
  *                 type: string
  *                 example: "https://example.com/sticker.png"
  *     responses:
  *       201:
  *         description: Message created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/messages', messageController.createMessage)

  // /**
  // * @swagger
  // * /socket/players:
  // *   post:
  // *     summary: Create a new player
  // *     tags:
  // *       - Socket
  // *     requestBody:
  // *       required: true
  // *       content:
  // *         application/json:
  // *           schema:
  // *             type: object
  // *             properties:
  // *               name:
  // *                 type: string
  // *                 example: "John Doe"
  // *               score:
  // *                 type: integer
  // *                 example: 75
  // *     responses:
  // *       201:
  // *         description: Player created successfully
  // *       400:
  // *         description: Invalid request
  // *       500:
  // *         description: Server error
  // */
  // router.post('/players', playerController.createPlayer)

  return router
}
