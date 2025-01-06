import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getRechargeById, getRecharges } from '../db/recharges'
import axios from 'axios'
import axiosInstance from '../seamless/interceptors'
import { rechargeQueue } from '../seamless/in.memory.queue'
import { authorized } from '../middlewares/authorization'

const getAllRecharges = async (req: Request, res: Response) => {
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
    const recharges = await getRecharges()

    responseHandler.ok(res, recharges)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteRechargeById = async (req: Request, res: Response) => {
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

    await db.recharge.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateRechargeById = async (req: Request, res: Response) => {
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
    const { amount, status } = req.body

    if (!amount || !status) {
      responseHandler.badrequest(res, 'Invalid data')
      return
    }

    const updatedRecharge = await db.recharge.update({
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
          id: updatedRecharge.bank.userId,
        },
        data: {
          chipsAmount: {
            increment: amount,
          },
        },
      })
    }

  // Update SeamLess
  // rechargeQueue.enqueue(async () => {
  //   await axiosInstance.get(`/banks/histories/last/${updatedRecharge.bank.userId}/recharge`);
  // });

    responseHandler.ok(res, updatedRecharge)
  } catch (error) {
    responseHandler.error(res)
  }
}

const createRecharge = async (req: Request, res: Response) => {
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
    const { amount, bankId, status, username } = req.body

    const requestingRecharge = await db.recharge.findFirst({
      where: {
        bankId,
        status: 'PENDING',
      },
    })

    if (requestingRecharge) {
      responseHandler.badrequest(res, 'You have a pending recharge request')
      return
    }

    let _bankId = ''
    if (username) {
      const bank = await db.bank.findFirst({ where: { user: { username } } })
      if (bank) _bankId = bank.id
    } else {
      _bankId = bankId
    }

    const recharge = await db.recharge.create({
      data: {
        amount,
        bankId: _bankId,
      },
    })

    const user = await db.user.findFirst({
      where: {
        banks: {
          some: {
            id: recharge.bankId
          }
        }
      }
    })

    if (status === "SUCCESS" && user) {
      await db.user.update({
        where: {
          id: user.id
        }, 
        data: {
          chipsAmount: {
            increment: amount
          }
        }
      })
    }

    // Update SeamLess
    // rechargeQueue.enqueue(async () => {
    //   await axiosInstance.get(`/banks/histories/last/${user?.id}/recharge`);
    // });

    responseHandler.ok(res, recharge)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const createRechargeInternal = async (req: Request, res: Response) => {
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
    const { amount, username, creator } = req.body

    const bank = await db.bank.findFirst({ where: { user: { username } } })

    if (!bank) {
      return responseHandler.badrequest(res, "Энэ хэрэглэгчдэд зориулж банк үүсгэнэ үү")
    }

    const recharge = await db.recharge.create({
      data: {
        amount,
        bankId: bank.id,
        status: "SUCCESS"
      },
    })

    const user = await db.user.findFirst({
      where: {
        banks: {
          some: {
            id: recharge.bankId
          }
        }
      }
    })

    if (user) {
      await db.user.update({
        where: {
          id: user.id
        }, 
        data: {
          chipsAmount: {
            increment: amount
          }
        }
      })

      const _creator = await db.user.findFirst({ where: { username: creator }})

      // Update in Seamless API
      if (_creator?.seamLessToken) {
        await axios.post(
          `${process.env.SEAMLESS_API_URL}/recharges/user-external`,
          {
            username: user.username,
            amount
          },
          {
            headers: {
              Authorization: `Bearer ${_creator.seamLessToken}`
            }
          }
        )
      }
    }

    responseHandler.ok(res, recharge)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getRecharge = async (req: Request, res: Response) => {
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

    const recharge = await getRechargeById(id)

    responseHandler.ok(res, recharge)
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
    // const auth = await authorized(req.headers.authorization ?? '', res);
    // if (!auth) {
    //   responseHandler.unauthorized(res)
    //   return;
    // }
    const { bankId } = req.params

    const recharges = await db.recharge.findMany({
      where: {
        bankId,
      },
    })

    responseHandler.ok(res, recharges)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getRecharge,
  createRecharge,
  createRechargeInternal,
  getAllRecharges,
  deleteRechargeById,
  updateRechargeById,
  getAllByBankId,
}
