import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getPlayerById, getPlayers } from '../db/players'
import { PokerActions } from '../pokergame/actions'
import { authorized } from '../middlewares/authorization'
import axios from 'axios'

const getAllPlayers = async (req: Request, res: Response) => {
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
    const players = await getPlayers()

    responseHandler.ok(res, players)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getPlayersByTableId = async (req: Request, res: Response) => {
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
    const { tableId } = req.params

    const players = await db.player.findMany({
      where: {
        tableId,
      },
      include: {
        user: true,
      },
    })

    responseHandler.ok(res, players)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const removePlayer = async (req: Request, res: Response) => {
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
    const { tableId } = req.query

    const tableExisting = await db.table.findUnique({
      where: {
        id: tableId as string,
      },
      include: {
        players: true,
      },
    })

    console.log('[REMOVE_PLAYER] Table existing...', tableExisting)
    
    if (!tableExisting) {
      return responseHandler.badrequest(res, 'Table not found')
    }

    // Remove player with socketId is expired
    let playerRemovedBeforeCount = 0

    for (const item of tableExisting.players) {
      const playerId = item.id

      const isPlayerConnected = req.app
        .get('io')
        .sockets.sockets.has(item.socketId)

      if (!isPlayerConnected) {
        const updatedUser = await db.user.update({
          where: {
            id: item.userId,
          },
          data: {
            chipsAmount: {
              increment: item.stack,
            },
          },
        })
        
        console.log('[CONNECT_PLAYER] Updated user...', updatedUser)

        // Update in Seamless API
        if (updatedUser?.seamLessToken) {
          await axios.post(
            `${process.env.SEAMLESS_API_URL}/recharges/user-external`,
            {
              username: updatedUser.username,
              amount: item.stack,
            },
            {
              headers: {
                Authorization: `Bearer ${updatedUser.seamLessToken}`
              }
            }
          )
        }

        const player = await db.player.delete({
          where: {
            id: playerId,
            tableId: tableId as string,
          },
          include: {
            user: true,
          },
        })

        playerRemovedBeforeCount++

        res?.app
          .get('io')
          .emit(PokerActions.LEAVE_TABLE, { tableId, playerId: player.id })
      }
    }

    const playerExisting = tableExisting.players.find(
      player => player.id === id
    )

    if (!playerExisting) {
      return responseHandler.badrequest(res, 'Player not found')
    }

    const updatedUser = await db.user.update({
      where: {
        id: playerExisting.userId,
      },
      data: {
        chipsAmount: {
          increment: playerExisting.stack,
        },
      },
    })
    
    console.log('[UPDATE_USER] Updated user...', updatedUser)

    // Update in Seamless API
    if (updatedUser?.seamLessToken) {
      await axios.post(
        `${process.env.SEAMLESS_API_URL}/recharges/user-external`,
        {
          username: updatedUser.username,
          amount: playerExisting.stack,
        },
        {
          headers: {
            Authorization: `Bearer ${updatedUser.seamLessToken}`
          }
        }
      )
    }
    
    const deletedPlayer = await db.player.findUnique({
      where: {
        id,
        tableId: tableId as string,
      },
    })

    if (!deletedPlayer) {
      console.error(`[DELETE_PLAYER] Player with id ${id} and tableId ${tableId} not found.`)
      return
    }

    const player = await db.player.delete({
      where: {
        id,
        tableId: tableId as string,
      },
      include: {
        user: true,
      },
    })

    const updatedPlayers = tableExisting.players.filter(
      player => player.id !== id
    )
    
    console.log('[UPDATE_PLAYER] Updated player...', updatedPlayers)

    if (Math.max(updatedPlayers.length - playerRemovedBeforeCount, 1) === 1) {
      await db.table.update({
        where: {
          id: tableId as string,
        },
        data: {
          handOver: true,
        },
      })
    }

    res?.app
      .get('io')
      .emit(PokerActions.LEAVE_TABLE, { tableId, playerId: player.id, players: updatedPlayers })

    responseHandler.ok(res)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const updatePlayerById = async (req: Request, res: Response) => {
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

    const existingPlayer = await getPlayerById(id)

    if (!existingPlayer) {
      return responseHandler.badrequest(res, 'Player not found')
    }

    const updatedPlayer = await db.player.update({
      where: {
        id,
      },
      data: {
        ...req.body,
      },
    })

    responseHandler.ok(res, {
      player: updatedPlayer,
      message: 'Update player successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const createPlayer = async (req: Request, res: Response) => {
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
    const { tableId, userId, socketId, buyIn } = req.body

    const existingTable = await db.table.findUnique({
      where: {
        id: tableId,
      },
      include: {
        players: true,
      },
    })

    if (!existingTable || existingTable.players.length >= 10) {
      return responseHandler.badrequest(res, 'Table is full')
    }

    // remove player with socketId is expired
    for (const item of existingTable.players) {
      const playerId = item.id

      const isPlayerConnected = req.app
        .get('io')
        .sockets.sockets.has(item.socketId)

      if (!isPlayerConnected) {
        const updatedUser = await db.user.update({
          where: {
            id: item.userId,
          },
          data: {
            chipsAmount: {
              increment: item.stack,
            },
          },
        })

        // Update in Seamless API
        if (updatedUser.seamLessToken) {
          await axios.post(
            `${process.env.SEAMLESS_API_URL}/recharges/user-external`,
            {
              username: updatedUser.username,
              amount: item.stack,
            },
            {
              headers: {
                Authorization: `Bearer ${updatedUser.seamLessToken}`
              }
            }
          )
        }

        const player = await db.player.delete({
          where: {
            id: playerId,
            tableId: tableId as string,
          },
          include: {
            user: true,
          },
        })

        const updatedPlayers = existingTable.players.filter(
          player => player.id !== playerId
        )

        if (updatedPlayers.length === 1) {
          await db.table.update({
            where: {
              id: tableId as string,
            },
            data: {
              handOver: true,
            },
          })
        }

        res?.app
          .get('io')
          .emit(PokerActions.LEAVE_TABLE, { tableId, playerId: player.id })
      }
    }

    const isExistingPlayer = await db.player.findFirst({
      where: {
        userId,
      },
    })

    if (isExistingPlayer) {
      return responseHandler.badrequest(res, 'Player is already in a table')
    }

    const player = await db.player.create({
      data: {
        tableId,
        userId,
        socketId,
        buyIn,
        stack: buyIn,
        previousStack: buyIn,
      },
      include: {
        user: true,
      },
    })

    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        chipsAmount: {
          decrement: buyIn,
        },
      },
    })

    // Update in Seamless API
    if (updatedUser.seamLessToken) {
      await axios.post(
        `${process.env.SEAMLESS_API_URL}/withdraws/user-external`,
        {
          username: updatedUser.username,
          amount: buyIn,
        },
        {
          headers: {
            Authorization: `Bearer ${updatedUser.seamLessToken}`
          }
        }
      )
    }

    res?.app.get('io').emit(PokerActions.JOIN_TABLE, {
      tableId,
      player,
    })

    responseHandler.ok(res, player)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getPlayer = async (req: Request, res: Response) => {
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

    const player = await getPlayerById(id)

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getCurrentPlayerOfTable = async (req: Request, res: Response) => {
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
    const { tableId, userId } = req.params

    const player = await db.player.findFirst({
      where: {
        tableId,
        userId,
      },
    })

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}

const getCurrentPlayerWithoutTable = async (req: Request, res: Response) => {
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

    const player = await db.player.findFirst({
      where: {
        userId,
      },
    })

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}

const rebuy = async (req: Request, res: Response) => {
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
    const { tableId, userId, buyIn } = req.body
    const { id } = req.params

    const isExistingPlayer = await db.player.findUnique({
      where: {
        id,
      },
    })

    if (!isExistingPlayer) {
      return responseHandler.badrequest(res, 'Player does not exists!')
    }

    const player = await db.player.update({
      where: {
        id: isExistingPlayer.id,
      },
      data: {
        previousStack: {
          increment: buyIn,
        },
        stack: {
          increment: buyIn,
        },
      },
      include: {
        user: true,
      },
    })

    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        chipsAmount: {
          decrement: buyIn,
        },
      },
    })

    // Update in Seamless API
    if (updatedUser.seamLessToken) {
      await axios.post(
        `${process.env.SEAMLESS_API_URL}/withdraws/user-external`,
        {
          username: updatedUser.username,
          amount: buyIn,
        },
        {
          headers: {
            Authorization: `Bearer ${updatedUser.seamLessToken}`
          }
        }
      )
    }

    res?.app.get('io').emit(PokerActions.REBUY, { tableId, player })

    responseHandler.ok(res, player)
  } catch (error) {
    responseHandler.error(res)
  }
}


const getNumberPlayer = async (req: { params: { tableId: any } }, res: Response<any, Record<string, any>>) => {
  try {
    const { tableId } = req.params;

  
    const players = await db.player.findMany({
      where: {
        tableId,
      },
    });

 
    if (players.length >= 1 && players.length <= 9) {
   
      const tableInfo = await db.table.findUnique({
        where: {
          id: tableId,
        },
      });

    
      responseHandler.ok(res, {
        playersCount: players.length,
        tableInfo,
      });
    } else {
     
      responseHandler.ok(res, players.length);
    }
  } catch (error) {
    console.log(error);
    responseHandler.error(res);
  }
};



const getBotUsers = async (req: Request, res: Response) => {
  try {
    // Fetch users whose username starts with 'bot'
    let users = await db.user.findMany({
      where: {
        username: {
          startsWith: 'bot',
        },
      },
    });
    
    // Sort users by the numerical value in the username
    users = users.sort((a, b) => {
      const numA = parseInt(a.username.replace('bot', ''), 10);
      const numB = parseInt(b.username.replace('bot', ''), 10);
      return numA - numB;
    });

    responseHandler.ok(res, users);
  } catch (error) {
    console.error('Error fetching bot users:', error);
    res.status(500).json({ message: 'Unable to fetch bot users' });
  }
};

export default {
  getPlayer,
  createPlayer,
  getAllPlayers,
  removePlayer,
  updatePlayerById,
  getCurrentPlayerOfTable,
  getCurrentPlayerWithoutTable,
  getPlayersByTableId,
  rebuy,
  getNumberPlayer,
  getBotUsers
}
