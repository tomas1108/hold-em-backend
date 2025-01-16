import express from 'express'

import eventController from '../controllers/events'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  /**
  * @swagger
  * /events:
  *   get:
  *     summary: Get all events
  *     tags:
  *       - Events
  *     responses:
  *       200:
  *         description: A list of all events
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   id:
  *                     type: string
  *                     example: "event123"
  *                   name:
  *                     type: string
  *                     example: "Tech Conference 2024"
  *                   date:
  *                     type: string
  *                     example: "2024-09-15T09:00:00Z"
  *                   location:
  *                     type: string
  *                     example: "New York City, NY"
  *       500:
  *         description: Server error
  */
  router.get('/', eventController.getAllEvents)

  /**
  * @swagger
  * /events/{id}:
  *   get:
  *     summary: Get a specific event by ID
  *     tags:
  *       - Events
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Event information retrieved successfully
  *       404:
  *         description: Event not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', eventController.getEvent)

  /**
  * @swagger
  * /events/{id}:
  *   delete:
  *     summary: Delete an event by ID
  *     tags:
  *       - Events
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Event deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', eventController.deleteEventById)

  /**
  * @swagger
  * /events/{id}:
  *   put:
  *     summary: Update an event by ID
  *     tags:
  *       - Events
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "event123"
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *                 example: "Tech Conference 2024"
  *               date:
  *                 type: string
  *                 example: "2024-09-15T09:00:00Z"
  *               location:
  *                 type: string
  *                 example: "New York City, NY"
  *     responses:
  *       200:
  *         description: Event updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/:id', requestHandler.validate, eventController.updateEventById)

  /**
  * @swagger
  * /events:
  *   post:
  *     summary: Create a new event
  *     tags:
  *       - Events
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *                 example: "Tech Conference 2024"
  *               date:
  *                 type: string
  *                 example: "2024-09-15T09:00:00Z"
  *               location:
  *                 type: string
  *                 example: "New York City, NY"
  *     responses:
  *       201:
  *         description: Event created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', eventController.createEvent)

  return router
}
