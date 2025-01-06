import { Request, response, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { PokerActions } from '../pokergame/actions'
import { authorized } from '../middlewares/authorization'

const getAllRoomsWithoutPagination = async (req: Request, res: Response) => {
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
  
      const rooms = await db.room.findMany({
        where: {
          removedAt: null
        }
      })
  
      responseHandler.ok(res, { content: rooms })
    } catch (error) {
      console.log(error)
      responseHandler.error(res)
    }
}

const getAllRooms = async (req: Request, res: Response) => {
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
    const { page } = req.query

    const roomCount = await db.table.count()
    const pageCount = Math.ceil(roomCount / 8)

    const rooms = await db.room.findMany({
      skip: page ? (Number(page) - 1) * 8 : 0,
      take: 8,
      where: {
        removedAt: null
      }
    })

    responseHandler.ok(res, {
      rooms,
      pageCount,
    })
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteRoomById = async (req: Request, res: Response) => {
  // if (!req.headers.authorization) {
  //   responseHandler.unauthorized(res)
  //   return null;
  // }
  // const auth = await authorized(req.headers.authorization ?? '', res);
  // if (!auth) {
  //   responseHandler.unauthorized(res)
  //   return;
  // }
  try {
    const { id } = req.params

    const deletedRoom = await db.room.update({
      where: {
        id,
      },
      data: {
        removedAt: new Date()
      }
    })

    responseHandler.ok(res, deletedRoom)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateRoom = async (req: Request, res: Response) => {
  // if (!req.headers.authorization) {
  //   responseHandler.unauthorized(res)
  //   return null;
  // }
  // const auth = await authorized(req.headers.authorization ?? '', res);
  // if (!auth) {
  //   responseHandler.unauthorized(res)
  //   return;
  // }
  try {
    const { id } = req.params
    const { name } = req.body

    // Check request body in room
    if (!id) {
        return responseHandler.badrequest(res, "Please provide the room ID")
    }

    if (name && !name.trim()) {
        return responseHandler.badrequest(res, "Room name cannot be empty")
    }

    const room = await db.room.update({
      where: {
        id,
      },
      data: { 
        ...req.body, 
        removedAt: null 
      },
    })

    // res?.app.get('io').emit(PokerActions.TABLE_UPDATED, {
    //   table,
    // })

    responseHandler.ok(res, room)
  } catch (error) {
    console.log(error)

    responseHandler.error(res)
  }
}

const createRoom = async (req: Request, res: Response) => {
  // if (!req.headers.authorization) {
  //   responseHandler.unauthorized(res)
  //   return null;
  // }
  // const auth = await authorized(req.headers.authorization ?? '', res);
  // if (!auth) {
  //   responseHandler.unauthorized(res)
  //   return;
  // }
  try {
    const { name } = req.body

    // Check request body in room
    if (!name.trim()) {
        return responseHandler.badrequest(res, "Room name cannot be empty")
    }
    const room = await db.room.create({
      data: {
        name,
        removedAt: null
      },
    })
    responseHandler.ok(res, room)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getRoomById = async (req: Request, res: Response) => {
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

    const room = await db.room.findFirst({
        where: {
            id
        }
    })

    responseHandler.ok(res, room)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  createRoom,
  getAllRooms,
  getAllRoomsWithoutPagination,
  getRoomById,
  deleteRoomById,
  updateRoom
}
