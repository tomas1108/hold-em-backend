import express from 'express'

import participantController from '../controllers/participants'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  /**
  * @swagger
  * /participants:
  *   get:
  *     summary: Get all participants
  *     tags:
  *       - Participants
  *     responses:
  *       200:
  *         description: A list of all participants
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
  *                     example: "John Doe"
  *                   score:
  *                     type: integer
  *                     example: 45
  *       500:
  *         description: Server error
  */
  router.get('/', participantController.getAllParticipants)

  /**
  * @swagger
  * /participants/{id}:
  *   get:
  *     summary: Get a specific participant by ID
  *     tags:
  *       - Participants
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Participant retrieved successfully
  *       404:
  *         description: Participant not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', participantController.getParticipant)

  /**
  * @swagger
  * /participants:
  *   post:
  *     summary: Create a new participant
  *     tags:
  *       - Participants
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
  *         description: Participant created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', participantController.createParticipant)

  /**
  * @swagger
  * /participants/{id}:
  *   delete:
  *     summary: Remove a participant by ID
  *     tags:
  *       - Participants
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Participant removed successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', participantController.removeParticipant)

  /**
  * @swagger
  * /participants/{id}:
  *   put:
  *     summary: Update a participant by ID
  *     tags:
  *       - Participants
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "participant123"
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
  *                 example: 50
  *     responses:
  *       200:
  *         description: Participant updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put(
    '/:id',
    requestHandler.validate,
    participantController.updateParticipantById
  )

  return router
}
