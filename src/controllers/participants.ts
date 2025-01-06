import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getParticipantById, getParticipants } from '../db/participants'
import { authorized } from '../middlewares/authorization'

const getAllParticipants = async (req: Request, res: Response) => {
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
    const participants = await getParticipants()

    responseHandler.ok(res, participants)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const removeParticipant = async (req: Request, res: Response) => {
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

    const participantExisting = await db.participant.findUnique({
      where: {
        id,
      },
    })

    if (!participantExisting) {
      return responseHandler.badrequest(res, 'Participant not found')
    }

    await db.participant.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const updateParticipantById = async (req: Request, res: Response) => {
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

    const existingParticipant = await getParticipantById(id)

    if (!existingParticipant) {
      return responseHandler.badrequest(res, 'Participant not found')
    }

    const updatedParticipant = await db.participant.update({
      where: {
        id,
      },
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, {
      participant: updatedParticipant,
      message: 'Update participant successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const createParticipant = async (req: Request, res: Response) => {
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
    responseHandler.ok(res)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getParticipant = async (req: Request, res: Response) => {
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

    const participant = await getParticipantById(id)

    responseHandler.ok(res, participant)
  } catch (error) {
    responseHandler.error(res)
  }
}

export default {
  getParticipant,
  createParticipant,
  getAllParticipants,
  removeParticipant,
  updateParticipantById,
}
