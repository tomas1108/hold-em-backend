import express from 'express'

import settingController from '../controllers/settings'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  
  /**
  * @swagger
  * /settings:
  *   get:
  *     summary: Get settings
  *     tags:
  *       - Settings
  *     responses:
  *       200:
  *         description: Settings retrieved successfully
  *       500:
  *         description: Server error
  */
  router.get('/', settingController.getSettings)

  /**
  * @swagger
  * /settings:
  *   post:
  *     summary: Create new settings
  *     tags:
  *       - Settings
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               fee:
  *                 type: number
  *                 example: 10000
  *     responses:
  *       201:
  *         description: Settings created successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.post('/', settingController.createSettings)

  /**
  * @swagger
  * /settings:
  *   put:
  *     summary: Update settings
  *     tags:
  *       - Settings
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               fee:
  *                 type: number
  *                 example: 10000
  *     responses:
  *       201:
  *         description: Settings updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/', settingController.updateSettings)

  return router
}
