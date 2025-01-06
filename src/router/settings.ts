import express from 'express'

import settingController from '../controllers/settings'

const router = express.Router({ mergeParams: true })

export default (): express.Router => {
  router.get('/', settingController.getSettings)
  router.post('/', settingController.createSettings)
  router.put('/', settingController.updateSettings)

  return router
}
