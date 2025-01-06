import { Request, Response } from 'express'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import { getTableById } from '../db/tables'
import { PokerActions } from '../pokergame/actions'
import { Table } from '@prisma/client'
import { authorized } from '../middlewares/authorization'
import axios from 'axios'

const getAllTables = async (req: Request, res: Response) => {
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

    const tableCount = await db.table.count()
    const pageCount = Math.ceil(tableCount / 8)

    const tables = await db.table.findMany({
      include: {
        players: true,
        user: true,
      },
      skip: page ? (Number(page) - 1) * 8 : 0,
      take: 8,
    })


    responseHandler.ok(res, {
      tables,
      pageCount,
    })
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getTablesByRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      return responseHandler.badrequest(res, 'Not found room')
    }

    const tables = await db.table.findMany({
      where: {
        roomId: roomId as string
      }
    })

    return responseHandler.ok(res, { tables })
  } catch (error) {
    console.log(error)
  }
}

const deleteTableById = async (req: Request, res: Response) => {
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

    const deletedTable = await db.table.delete({
      where: {
        id,
      },
    })

    responseHandler.ok(res, deletedTable)
  } catch (error) {
    responseHandler.error(res)
  }
}

const updateTable = async (req: Request, res: Response) => {
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
    const { minBuyIn, maxBuyIn, name, ante, chatBanned } = req.body

    const table = await db.table.update({
      where: {
        id,
      },
      data: {
        minBuyIn,
        maxBuyIn,
        name,
        ante,
        chatBanned,
      },
    })

    res?.app.get('io').emit(PokerActions.TABLE_UPDATED, {
      table,
    })

    responseHandler.ok(res, table)
  } catch (error) {
    console.log(error)

    responseHandler.error(res)
  }
}

const createTable = async (req: Request, res: Response) => {
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
    const { name, userId, minBuyIn, maxBuyIn, ante, code, password, roomId } = req.body

    if (code.trim()) {
      const existingTableWithCode = await db.table.findFirst({
        where: {
          codeID: code
        }
      })

      if (existingTableWithCode) {
        return responseHandler.badrequest(res, "Өрөөний код аль хэдийн байна")
      }

      if (!password.trim()) {
        return responseHandler.badrequest(res, "Өрөөний нууц үгийг оруулна уу")
      }
    }

    const table = await db.table.create({
      data: {
        name,
        userId,
        minBuyIn,
        maxBuyIn: maxBuyIn ?? minBuyIn * 100,
        ante: ante ?? minBuyIn * 0.05,
        codeID: code ?? "",
        codePassword: password ?? "",
        roomId,
        removedAt: null
      },
    })
    responseHandler.ok(res, table)
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

// Join random table
const joinRandomTable = async (req: Request, res: Response) => {
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
    const { currentChipsOfUser, roomId } = req.body

    const availableTables = await db.table.findMany({
      where: {
        minBuyIn: {
          lte: currentChipsOfUser
        },
        roomId,
      }, 
    //   select: {
    //     players: {
    //       select: {
    //         id: true
    //       }
    //     },
    //     maxPlayers: true
    //   }
    })

    if (!availableTables || availableTables?.length === 0) {
      return responseHandler.badrequest(res, "Таны чипийн хэмжээ ямар ч хүснэгтэд нэгдэхэд хангалтгүй")
    }

    // const joinableTables = availableTables.filter((table) => !table.players || (table.players && table.players.length < table.maxPlayers))

    // if (!joinableTables || joinableTables?.length === 0) {
    //   return responseHandler.badrequest(res, "Тоглоомын бүх өрөө дүүрэн байна")
    // }

    const minTableIndex = 0
    const maxTableIndex = availableTables.length - 1
    const randomTableIndex = Math.floor(Math.random() * (maxTableIndex - minTableIndex + 1)) + minTableIndex

    return responseHandler.ok(res, availableTables[randomTableIndex])
  } catch (err: any) {
    console.info("[TABLE] Join table: ", err)
    return responseHandler.error(res, err?.message ?? 'Ямар нэг алдаа гарлаа')
  }
}

// Check table secret before entering the specific game room
const checkTableSecret = async (req: Request, res: Response) => {
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
    const { code, pass, roomId } = req.body;

    const table = await db.table.findFirst({
      where: {
        codeID: code as string,
        codePassword: pass as string,
        roomId
      },
    //   select: {
    //     players: {
    //       select: {
    //         id: true
    //       }
    //     },
    //     maxPlayers: true
    //   }
    })

    if (!table) {
      return responseHandler.badrequest(res, "Хүснэгт олдсонгүй")
    }

    // if (table.players && table.players.length >= table.maxPlayers) {
    //   return responseHandler.badrequest(res, "Тоглоомын өрөө дүүрэн байна")
    // }

    return responseHandler.ok(res, table)
  } catch (err: any) {
    console.info("[TABLE] Check table secret error: ", err)
    return responseHandler.error(res, err?.message ?? 'Ямар нэг алдаа гарлаа')
  }
}

const getTable = async (req: Request, res: Response) => {
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

    const table = await getTableById(id)

    responseHandler.ok(res, table)
  } catch (error) {
    responseHandler.error(res)
  }
}

const switchTable = async (req: Request, res: Response) => {
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
    const { playerId } = req.body
  

    const currentPlayer = await db.player.findUnique({
      where: {
        id: playerId
      }
    })

    let stackOfCurrentUser = currentPlayer?.stack ?? 0;

    const tables = await db.table.findMany({
      where: {
        removedAt: null,
      },
      include: {
        players: true
      },
      orderBy: { 
        minBuyIn: 'asc'
      }
    })

    const notFullTables = tables.filter((table) => table.players.length < table.maxPlayers)

    if (notFullTables.length === 0) {
      responseHandler.badrequest(res, 'No available tables')
    }

    // Get tables with max_buy_in is less than the stack of current player
    const tablesWithMaxBuyInLessThanCurrentStack = notFullTables.filter(
      (table) => table.maxBuyIn <= stackOfCurrentUser)

    if (tablesWithMaxBuyInLessThanCurrentStack.length > 0) {
      const randomTable = tablesWithMaxBuyInLessThanCurrentStack.length === 0 ? tablesWithMaxBuyInLessThanCurrentStack[0] : getRandomTable(tablesWithMaxBuyInLessThanCurrentStack)
      const maxBuyIn = randomTable.maxBuyIn

      const interestAmount = stackOfCurrentUser - maxBuyIn
      stackOfCurrentUser = maxBuyIn

      await updateStackForPlayer({
        amount: stackOfCurrentUser, 
        playerId
      })

      await updateChipsForPlayer({
        amount: interestAmount, 
        playerId,
        type: 'increase'
      })

      await updateTableIdForPlayer({playerId, tableId: randomTable.id})

      responseHandler.ok(res, {
        movedTableId: randomTable.id
      })
      return;
    }

    // Get the table with minimum min_buy_in
    const tableWithTheGreatestMinBuyIn = getRandomTable(notFullTables)

    const minBuyIn = tableWithTheGreatestMinBuyIn.minBuyIn
    if (minBuyIn <= stackOfCurrentUser) {
      const interestAmount = stackOfCurrentUser - minBuyIn
      stackOfCurrentUser = minBuyIn

      await updateStackForPlayer({
        amount: stackOfCurrentUser, 
        playerId
      })

      await updateChipsForPlayer({
        amount: interestAmount, 
        playerId,
        type: 'increase'
      })
    
      await updateTableIdForPlayer({playerId, tableId: tableWithTheGreatestMinBuyIn.id})

      responseHandler.ok(res, {
        movedTableId: tableWithTheGreatestMinBuyIn.id
      })
      return;
    }

    // Recharge for moving table
    const rechargeAmount = minBuyIn - stackOfCurrentUser
    stackOfCurrentUser = minBuyIn

    await updateStackForPlayer({
      amount: stackOfCurrentUser, 
      playerId
    })

    await updateChipsForPlayer({
      amount: rechargeAmount, 
      playerId,
      type: 'decrease'
    })

    await updateTableIdForPlayer({playerId, tableId: tableWithTheGreatestMinBuyIn.id})

    responseHandler.ok(res, {
      movedTableId: tableWithTheGreatestMinBuyIn.id
    })

    return;
  } catch (error) {
    console.log(error)
    responseHandler.error(res)
  }
}

const getRandomTable = (tables: Table[]) => {
  const randomIndex = Math.floor(Math.random() * (tables.length - 1))
  return tables[randomIndex]
}

const updateStackForPlayer = async (
{ amount, playerId }: { amount: number; playerId: string }) => {
  try {
    const result = await db.player.update({
      where: {
        id: playerId
      }, 
      data: {
        stack: amount
      }
    })

    return result
  } catch (err) {
    console.error(err)
  }
}

const updateChipsForPlayer = async (
{ 
  amount, 
  playerId, 
  type 
}: { 
  amount: number; 
  playerId: string; 
  type: 'increase' | 'decrease' 
}) => {
  try {
    const currentUser = await db.player.findUnique({
      where: {
        id: playerId
      }, 
      select: {
        userId: true
      }
    })

    if (type === 'increase') {
      const result = await db.user.update({
        where: {
          id: currentUser?.userId
        }, 
        data: {
          chipsAmount: {
            increment: amount
          }
        }
      })

      // Update in Seamless API
      if (result.seamLessToken) {
        await axios.post(
          `${process.env.SEAMLESS_API_URL}/recharges/user-external`,
          {
            username: result.username,
            amount
          },
          {
            headers: {
              Authorization: `Bearer ${result.seamLessToken}`
            }
          }
        )
      }

      return result
    }

    const result = await db.user.update({
      where: {
        id: currentUser?.userId
      }, 
      data: {
        chipsAmount: {
          decrement: amount
        }
      }
    })

    // Update in Seamless API
    if (result.seamLessToken) {
      await axios.post(
        `${process.env.SEAMLESS_API_URL}/withdraws/user-external`,
        {
          username: result.username,
          amount
        },
        {
          headers: {
            Authorization: `Bearer ${result.seamLessToken}`
          }
        }
      )
    }

    return result
  } catch (err) {
    console.error(err)
  }
}

const updateTableIdForPlayer = async (
{
  playerId,
  tableId
} : { playerId: string; tableId: string }
) => {
  try {
    const result = await db.player.update({
      where: {
        id: playerId
      }, 
      data: {
        tableId
      }
    })

    return result
  } catch (err) {
    console.error(err)
  }
}

const getTablesWithOneToNinePlayers = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    const tables = await db.table.findMany({
      where: {
        roomId,
      },
    });

  
    const tablesWithOneToNinePlayers = [];

  
    for (const table of tables) {
      const players = await db.player.findMany({
        where: {
          tableId: table.id,
        },
      });

    
      if (players.length >= 1 && players.length <= 9) {
        tablesWithOneToNinePlayers.push({
          table,
          playersCount: players.length,
        });
      }
    }

    // Return mảng table có từ 1 đến 9 người chơi
    responseHandler.ok(res, tablesWithOneToNinePlayers);
  } catch (error) {
    console.log(error);
    responseHandler.error(res);
  }
};


export default {
  getTable,
  createTable,
  getAllTables,
  getTablesByRoom,
  joinRandomTable,
  checkTableSecret,
  deleteTableById,
  updateTable,
  switchTable,
  getTablesWithOneToNinePlayers
}
