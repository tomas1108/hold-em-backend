import express from 'express'

import userController from '../controllers/users'
import requestHandler from '../handlers/request-handler'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {

  /**
  * @swagger
  * /users:
  *   get:
  *     summary: Get all users
  *     tags:
  *       - Users
  *     responses:
  *       200:
  *         description: A list of all users
  *       500:
  *         description: Server error
  */
  router.get('/', userController.getAllUsers)


  /**
  * @swagger
  * /users/{id}:
  *   get:
  *     summary: Get a specific user by ID
  *     tags:
  *       - Users
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: User retrieved successfully
  *       404:
  *         description: User not found
  *       500:
  *         description: Server error
  */
  router.get('/:id', userController.getUser)

  /**
  * @swagger
  * /users/profile/check:
  *   post:
  *     summary: Check if a user profile exists
  *     tags:
  *       - Users
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               email:
  *                 type: string
  *                 example: john.doe@gmail.com
  *     responses:
  *       200:
  *         description: User profile exists
  *       404:
  *         description: User not found
  *       500:
  *         description: Server error
  */
  router.post('/profile/check', userController.checkExistedUser)

  /**
  * @swagger
  * /users/detail/{email}:
  *   get:
  *     summary: Get user details by email
  *     tags:
  *       - Users
  *     parameters:
  *       - in: path
  *         name: email
  *         required: true
  *         schema:
  *           type: string
  *           example: "john.doe@gmail.com"
  *     responses:
  *       200:
  *         description: User details retrieved successfully
  *       404:
  *         description: User not found
  *       500:
  *         description: Server error
  */
  router.get('/detail/:email', userController.getUserByEmail)

  /**
  * @swagger
  * /users/{id}:
  *   delete:
  *     summary: Delete a user by ID
  *     tags:
  *       - Users
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *           example: "cm016ewe000073efa5abeu9ac"
  *     responses:
  *       200:
  *         description: User deleted successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.delete('/:id', userController.deleteUserById)

  /**
  * @swagger
  * /users/{id}:
  *   put:
  *     summary: Update a user by ID
  *     tags:
  *       - Users
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
  *               image:
  *                 type: string
  *                 example: "/images/avt/john_doe.jpg"
  *              name:
  *                 type: string
  *                 example: "John Doe"
  *     responses:
  *       200:
  *         description: User updated successfully
  *       400:
  *         description: Invalid request
  *       500:
  *         description: Server error
  */
  router.put('/:id', requestHandler.validate, userController.update)
  
  return router
}
