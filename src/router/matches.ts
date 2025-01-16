import express from 'express'

import matchController from '../controllers/matches'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  /**
  * @swagger
  * /matches:
  *   get:
  *     summary: Get all matches
  *     tags:
  *       - Matches
  *     responses:
  *       200:
  *         description: A list of all matches
  *         content:
  *           application/json:
  *             schema:
  *               type: array
  *               items:
  *                 type: object
  *                 properties:
  *                   id:
  *                     type: string
  *                     example: "match123"
  *                   participants:
  *                     type: array
  *                     items:
  *                       type: object
  *                       properties:
  *                         name:
  *                           type: string
  *                           example: "John Doe"
  *                         score:
  *                           type: integer
  *                           example: 45
  *       500:
  *         description: Server error
  */
  router.get('/', matchController.getAllMatches)

/**
  * @swagger
  * /matches/{id}:
  *   get:
  *     summary: Get a specific match by ID
  *     tags:
  *       - Matches
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Match retrieved successfully
  *       404:
  *         description: Match not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', matchController.getMatch)

/**
  * @swagger
  * /matches/table/{tableId}:
  *   get:
  *     summary: Get the current match by table ID
  *     tags:
  *       - Matches
  *     parameters:
  *       - in: path
  *         name: tableId
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Current match retrieved successfully
  *       404:
  *         description: Match not found
  *       500:
  *         description: Server error
  */
  router.get('/table/:tableId', matchController.getCurrentMatchByTableId)

/**
  * @swagger
  * /matches:
  *   post:
  *     summary: Create a new match
  *     tags:
  *       - Matches
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               participants:
  *                 type: array
  *                 items:
  *                   type: object
  *                   properties:
  *                     name:
  *                       type: string
  *                       example: "John Doe"
  *                     score:
  *                       type: integer
  *                       example: 45
  *     responses:
  *       201:
  *         description: Match created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', matchController.createMatch)

/**
  * @swagger
  * /matches/{id}:
  *   delete:
  *     summary: Remove a match by ID
  *     tags:
  *       - Matches
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: Match deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', matchController.removeMatch)

/**
  * @swagger
  * /matches/{id}:
  *   put:
  *     summary: Update a match by ID
  *     tags:
  *       - Matches
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
  *               participants:
  *                 type: array
  *                 items:
  *                   type: object
  *                   properties:
  *                     name:
  *                       type: string
  *                       example: "John Doe"
  *                     score:
  *                       type: integer
  *                       example: 50
  *     responses:
  *       200:
  *         description: Match updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/:id', requestHandler.validate, matchController.updateMatchById)

  return router
}
