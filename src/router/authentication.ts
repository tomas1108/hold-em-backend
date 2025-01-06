import express from 'express'

import authController from '../controllers/authentication'
import requestHandler from '../handlers/request-handler'
import { isAuthenticated } from '../middlewares'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.post('/register', requestHandler.validate, authController.register)
  router.post('/secret-hash', authController.generateAccountHash)
  router.get('/secret-check', authController.checkAccountHash)
  router.post('/login', requestHandler.validate, authController.login)
  router.post('/logout', requestHandler.validate, authController.logout)
  router.post('/update-token', requestHandler.validate, authController.updateToken)
  router.post(
    '/new-password/:id',
    requestHandler.validate,
    authController.newPassword
  )

  return router
}
