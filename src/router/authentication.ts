import express from 'express'

import authController from '../controllers/authentication'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })


export default (): express.Router => {

  /**
  * @swagger
  * /auth/register:
  *   post:
  *     summary: Register a new user
  *     tags:
  *       - Authentication
  *     requestBody:
  *       description: User registration data
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               email:
  *                 type: string
  *                 example: user001@gmail.com
  *               password:
  *                 type: string
  *                 example: 123456
  *               username:
  *                 type: string
  *                 example: user001
  *               external:
  *                 type: boolean
  *                 example: false    
  *               name:
  *                type: string
  *                example: user001    
  *     responses:
  *       200:
  *            description: User registered successfully
  *       400:
  *            description: Validation error
  */
    router.post('/register', authController.register)

  /**
  * @swagger
  * /auth/login:
  *   post:
  *     summary: User login
  *     tags:
  *       - Authentication
  *     requestBody:
  *       description: User login credentials
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               username:
  *                 type: string
  *                 example: johndoe
  *               password:
  *                 type: string
  *                 example: password123
  *     responses:
  *       200:
  *         description: Login successful
  *       400:
  *         description: Validation error
  */
  router.post('/login', requestHandler.validate, authController.login)

  /**
  * @swagger
  * /auth/logout:
  *   post:
  *     summary: User logout
  *     tags:
  *       - Authentication
  *     requestBody:
  *       description: User logout
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               userId:
  *                 type: string
  *                 example: 123e4567-e89b-12d3-a456-426614174000
  *     responses:
  *       200:
  *         description: Logout successful
  *       400:
  *         description: Validation error
  */
  router.post('/logout', requestHandler.validate, authController.logout)

  /**
  * @swagger
  * /auth/secret-hash:
  *   post:
  *     summary: Generate a secret account hash
  *     tags:
  *       - Authentication
  *     responses:
  *       200:
  *         description: Secret hash generated successfully
  */
  router.post('/secret-hash', authController.generateAccountHash)

  /**
   * @swagger
  * /auth/secret-check:
  *   post:
  *     summary: Check the account hash
  *     tags:
  *       - Authentication
  *     requestBody:
  *       description: Data to check the account hash
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               hash:
  *                 type: string
  *                 example: "abcd1234hash"
  *     responses:
  *       200:
  *         description: Hash check successful
  *       400:
  *         description: Validation error
  */
  router.post('/secret-check', authController.checkAccountHash)


  /**
  * @swagger
  * /auth/update-token:
  *   post:
  *     summary: Update the authentication token
  *     tags:
  *       - Authentication
  *     responses:
  *       200:
  *         description: Token updated successfully
  *       400:
  *         description: Validation error
  */
  router.post('/update-token', requestHandler.validate, authController.updateToken)

/**
  * @swagger
 * /auth/new-password/{id}:
 *   post:
 *     summary: Set a new password
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "user123"
 *     requestBody:
 *       description: New password data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation error
 */
  router.post(
    '/new-password/:id',
    requestHandler.validate,
    authController.newPassword
  )

  return router
}