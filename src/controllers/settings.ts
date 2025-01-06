import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { authorized } from '../middlewares/authorization'

const getSettings = async (req: Request, res: Response) => {
  try {
    const results = await db.settingParameters.findMany()

    return responseHandler.ok(res, results[0])
  } catch (err) {
    return responseHandler.error(res, "Тохиргоог авах үед алдаа гарлаа")
  }
}

const createSettings = async (req: Request, res: Response) => {
    try {
      // if (!req.headers.authorization) {
      //   responseHandler.unauthorized(res)
      //   return null;
      // }
      // const auth = await authorized(req.headers.authorization ?? '', res);
      // if (!auth) {
      //   responseHandler.unauthorized(res)
      //   return;
      // }
        const { fee } = req.body
  
        const savedSetting = await db.settingParameters.create({
            data: {
                serviceFeeRate: fee
            }
        })

        console.log('create successfully')

        return responseHandler.ok(res, savedSetting)
    } catch (error) {
        return responseHandler.error(res)
    }
  }


const updateSettings = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // const auth = await authorized(req.headers.authorization ?? '', res);
    // if (!auth) {
    //   responseHandler.unauthorized(res)
    //   return;
    // }
    const { fee, id } = req.body

    // if (!id) {
    //     const savedSetting = await db.settingParameters.create({
    //         data: {
    //             serviceFeeRate: fee
    //         }
    //     })

    //     if (savedSetting) {
    //         return responseHandler.ok(res, savedSetting)
    //     }
    // }

    const result = await db.settingParameters.update({
        where: {
            id
        },
        data: {
            serviceFeeRate: fee
        }
    })

    console.log('update successfully')

    return responseHandler.ok(res, result)
  } catch (error) {
    return responseHandler.error(res)
  }
}

export default {
    getSettings,
    createSettings,
    updateSettings,
}
