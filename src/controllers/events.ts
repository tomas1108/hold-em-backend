import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getEventById, getEvents } from '../db/events'
import { authorized } from '../middlewares/authorization'

const getAllEvents = async (req: Request, res: Response) => {
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
    const events = await getEvents()

    responseHandler.ok(res, events)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const deleteEventById = async (req: Request, res: Response) => {
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

    await db.event.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateEventById = async (req: Request, res: Response) => {
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

    const existingEvent = await getEventById(id)

    if (!existingEvent) {
      return responseHandler.badrequest(res, 'Event not found')
    }

    const updatedEvent = await db.event.update({
      where: {
        id,
      },
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, updatedEvent)
  } catch (error) {
    responseHandler.error(res)
  }
}

const createEvent = async (req: Request, res: Response) => {
  try {
    // if (!req.headers.authorization) {
    //   responseHandler.unauthorized(res)
    //   return null;
    // }
    //       return;
    const event = await db.event.create({
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, event)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getEvent = async (req: Request, res: Response) => {
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

    const event = await getEventById(id)

    responseHandler.ok(res, event)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getEvent,
  createEvent,
  getAllEvents,
  deleteEventById,
  updateEventById,
}
