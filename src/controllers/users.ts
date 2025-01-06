import express from 'express'
import { getUsers, getUserById, updateUserById } from '../db/users'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import axiosInstance from '../seamless/interceptors'
import axios from 'axios'
import { rechargeQueue } from '../seamless/in.memory.queue'
import { authorized } from '../middlewares/authorization'

const getAllUsers = async (req: express.Request, res: express.Response) => {
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
    const users = await getUsers()

    return responseHandler.ok(res, users)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteUserById = async (req: express.Request, res: express.Response) => {
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

    const user = await db.user.update({
      where: {
        id,
      },
      data: {
        removedAt: new Date()
      }
    })

    // rechargeQueue.enqueue(async () => {
    //   await axiosInstance.delete(`/users/${id}`);
    // });

    return responseHandler.ok(res, { message: 'Delete user successfully!' })
  } catch (error) {
    responseHandler.error(res)
  }
}

const update = async (req: express.Request, res: express.Response) => {
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

    const { image, name } = req.body

    const existingUser = await getUserById(id)

    if (!existingUser) {
      return responseHandler.badrequest(res, 'User not found')
    }

    const updatedUser = await updateUserById(existingUser.id, {
      image,
      name,
    })

    // Update SeamLess
    // rechargeQueue.enqueue(async () => {
    //   await axiosInstance.put(`/users/${id}`,
    //     { 
    //       data: updatedUser, 
    //     }
    //   );
    // });

    responseHandler.ok(res, {
      ...updatedUser,
      message: 'Update user successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const getUser = async (req: express.Request, res: express.Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    // await authorized(req.headers.authorization ?? '', res);
    const { id } = req.params

    const user = await getUserById(id)

    if (!user) {
      return responseHandler.notfound(res)
    }

    responseHandler.ok(res, user)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getUserByEmail = async (req: express.Request, res: express.Response) => {
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
    const { email } = req.params;
    const user = await db.user.findFirst({
      where: {
        email
      }
    })
    return user;
  } catch (err) {
    console.error(err)
    return null;
  }
}

const updateAll = async (req: express.Request, res: express.Response) => {
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

    const existingUser = await getUserById(id)

    if (!existingUser) {
      return responseHandler.badrequest(res, 'User not found')
    }

    const updatedUser = await updateUserById(existingUser.id, { ...req.body })

    // Update SeamLess
    // rechargeQueue.enqueue(async () => {
    //   await axiosInstance.put(
    //     `/users/${id}`,
    //     { 
    //       data: updatedUser, 
    //     }
    //   );
    // });

    responseHandler.ok(res, {
      ...updatedUser,
      message: 'Update user successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const checkExistedUser = async (req: express.Request, res: express.Response) => {
  try {
    const { username } = req.body;
    const isExistedUsername = await db.user.findFirst({
      where: {
        username
      }
    })

    if (isExistedUsername) {
      return responseHandler.badrequest(res, "Username already exists")
    }

    // const isExistedEmail = await db.user.findFirst({
    //   where: {
    //     email,
    //   }
    // })

    // if (isExistedEmail) { 
    //   return responseHandler.badrequest(res, "Email already exists")
    // } 
    return responseHandler.ok(res, "Account is available for creating");
  } catch (err) {
    return responseHandler.error(res, "Failed to check username and email");
  }
}

export default {
  getAllUsers,
  getUser,
  getUserByEmail,
  checkExistedUser,
  deleteUserById,
  update,
  updateAll,
}
