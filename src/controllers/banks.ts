import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getBankById, getBanks } from '../db/banks'
import { authorized } from '../middlewares/authorization'

const getAllBanks = async (req: Request, res: Response) => {
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
    const banks = await getBanks()

    responseHandler.ok(res, banks)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteBankById = async (req: Request, res: Response) => {
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
    const { id } = req.params

    await db.bank.updateMany({
      where: {
        id,
      },
      data: {
        removedAt: new Date()
      }
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateBankById = async (req: Request, res: Response) => {
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
    const { id } = req.params
    const { cardNumber, securityCode, cardHolderName, expiryDate } = req.body

    await db.bank.update({
      where: {
        id,
      },
      data: {
        cardNumber,
        securityCode,
        cardHolderName,
        expiryDate,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const createBank = async (req: Request, res: Response) => {
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
    const { cardNumber, securityCode, cardHolderName, expiryDate, userId, username } = req.body
    
    let _userId = ''
    if (username) {
      const user = await db.user.findFirst({ where: { username }})
      if (user) _userId = user.id
    } else {
      _userId = userId
    }

    const bank = await db.bank.create({
      data: {
        cardNumber,
        securityCode,
        cardHolderName,
        expiryDate,
        userId: _userId,
        removedAt: null
      },
    })

    responseHandler.ok(res, bank)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getBank = async (req: Request, res: Response) => {
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
    const { id } = req.params

    const bank = await getBankById(id)

    responseHandler.ok(res, bank)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getBankByUserId = async (req: Request, res: Response) => {
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
    const { userId } = req.params

    const bank = await db.bank.findFirst({
      where: {
        userId,
      },
    })

    responseHandler.ok(res, bank)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getBank,
  createBank,
  getAllBanks,
  deleteBankById,
  updateBankById,
  getBankByUserId,
}
