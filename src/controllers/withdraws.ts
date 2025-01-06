import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getWithdrawById, getWithdraws } from '../db/withdraws'
import axiosInstance from '../seamless/interceptors'
import axios from 'axios'
import { rechargeQueue } from '../seamless/in.memory.queue'
import { authorized } from '../middlewares/authorization'

const getAllWithdraws = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const withdraws = await getWithdraws()

    responseHandler.ok(res, withdraws)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteWithdrawById = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const { id } = req.params

    // rechargeQueue.enqueue(async () => {
    //   await db.withdraw.delete({
    //     where: {
    //       id,
    //     },
    //   })
    // });

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateWithdrawById = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const { amount, status } = req.body

    if (!amount || !status) {
      responseHandler.badrequest(res, 'Invalid data')
      return
    }

    const updatedWithdraw = await db.withdraw.update({
      where: {
        id: req.params.id,
      },
      data: {
        status,
        amount,
      },
      include: {
        bank: true,
      },
    })

    if (status === 'SUCCESS') {
      await db.user.update({
        where: {
          id: updatedWithdraw.bank.userId,
        },
        data: {
          chipsAmount: {
            decrement: amount,
          },
        },
      })
    }

    // Update SeamLess
    // rechargeQueue.enqueue(async () => {
    //   await axiosInstance.get(`/banks/histories/last/${updatedWithdraw.bank.userId}/withdraw`);
    // });

    responseHandler.ok(res, updatedWithdraw)
  } catch (error) {
    responseHandler.error(res)
  }
}

const createWithdraw = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const { amount, bankId, status, username } = req.body

    const requestingWithdraw = await db.withdraw.findFirst({
      where: {
        bankId,
        status: 'PENDING',
      },
    })

    if (requestingWithdraw) {
      responseHandler.badrequest(res, 'You have a pending withdraw request')
      return
    }

    let _bankId = ''
    if (username) {
      const bank = await db.bank.findFirst({ where: { user: { username } } })
      if (bank) _bankId = bank.id
    } else {
      _bankId = bankId
    }
    
    const createdWithdraw = await db.withdraw.create({
      data: {
        amount,
        bankId: _bankId,
      },
    })

    const withDraw = await db.bank.findFirst({
      where: {
        id: _bankId,
      },
      select: {
        userId: true,
      }
    })
    
    if (status === "SUCCESS" && withDraw) {
      await db.user.update({
        where: {
          id: withDraw.userId
        }, 
        data: {
          chipsAmount: {
            decrement: amount
          }
        }
      })
    }

    // Update SeamLess
    // rechargeQueue.enqueue(async () => {
    //   await axiosInstance.get(`/banks/histories/last/${withDraw?.userId}/withdraw`);
    // });

    responseHandler.ok(res, withDraw)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const createWithdrawInternal = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const { amount, username, creator } = req.body

    const bank = await db.bank.findFirst({ where: { user: { username } } })

    if (!bank) {
      return responseHandler.badrequest(res, "Энэ хэрэглэгчдэд зориулж банк үүсгэнэ үү")
    }

    await db.withdraw.create({
      data: {
        amount,
        bankId: bank.id,
        status: 'SUCCESS'
      },
    })

    const withDraw = await db.bank.findFirst({
      where: {
        id: bank.id,
      },
      select: {
        userId: true,
        user: true
      }
    })
    
    if (withDraw) {
      await db.user.update({
        where: {
          id: withDraw.userId
        }, 
        data: {
          chipsAmount: {
            decrement: amount
          }
        }
      })

      const _creator = await db.user.findFirst({ where: { username: creator }})

      // Update SeamLess API
      if (_creator?.seamLessToken) {
        await axios.post(
          `${process.env.SEAMLESS_API_URL}/withdraws/user-external`,
          {
            username: withDraw.user.username,
            amount: amount,
          },
          {
            headers: {
              Authorization: `Bearer ${_creator.seamLessToken}`
            }
          }
        )
      }
    }

    // Update SeamLess
    // rechargeQueue.enqueue(async () => {
    //   await axiosInstance.get(`/banks/histories/last/${withDraw?.userId}/withdraw`);
    // });

    responseHandler.ok(res, withDraw)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}


const getWithdraw = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const { id } = req.params

    const withdraw = await getWithdrawById(id)

    responseHandler.ok(res, withdraw)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getAllByBankId = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const { bankId } = req.params

    const withdraws = await db.withdraw.findMany({
      where: {
        bankId,
      },
    })

    responseHandler.ok(res, withdraws)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getWithdraw,
  createWithdraw,
  createWithdrawInternal,
  getAllWithdraws,
  deleteWithdrawById,
  updateWithdrawById,
  getAllByBankId,
}
