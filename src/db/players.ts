import axios from 'axios'
import { db } from '../lib/db'
import { PlayerWithUser } from '../types'
import { getTableById } from './tables'

export const getPlayers = async () => {
  try {
    const players = await db.player.findMany({
      include: {
        user: true,
        table: true,
      },
    })
    return players
  } catch (error) {
    return []
  }
}

export const getPlayerById = async (id: string) => {
  try {
    const player = await db.player.findFirst({
      where: {
        id,
      },
    })
    return player
  } catch (error) {
    return null
  }
}

export const getCurrentPlayerOfTable = async ({
  tableId,
  userId,
}: {
  tableId: string
  userId: string
}) => {
  try {
    const player = await db.player.findFirst({
      where: {
        tableId,
        userId,
      },
    })
    return player
  } catch (error) {
    return null
  }
}

export const getCurrentPlayerOfTableWithUser = async ({
  tableId,
  userId,
}: {
  tableId: string
  userId: string
}) => {
  try {
    const player = await db.player.findFirst({
      where: {
        tableId,
        userId,
      },
      include: {
        user: true,
      },
    })
    return player
  } catch (error) {
    return null
  }
}

export const removePlayerBySocketId = async (socketId: string) => {
  try {
    const existingPlayer = await db.player.findFirst({
      where: {
        socketId,
      },
      include: {
        user: true
      }
    })

    if (!existingPlayer) {
      return
    }

    await db.user.update({
      where: {
        id: existingPlayer.userId,
      },
      data: {
        chipsAmount: {
          increment: existingPlayer.stack,
        },
      },
    })

    // Update in Seamless API
    if (existingPlayer.user.seamLessToken) {
      await axios.post(
        `${process.env.SEAMLESS_API_URL}/recharges/user-external`,
        {
          username: existingPlayer.user.username,
          amount: existingPlayer.stack,
        },
        {
          headers: {
            Authorization: `Bearer ${existingPlayer.user.seamLessToken}`
          }
        }
      )
    }
    
    const deletedPlayer = await db.player.findUnique({
      where: {
        id: existingPlayer.id,
      },
    })

    if (!deletedPlayer) {
      console.error(`[DELETE_PLAYER_SOCKET] Player with id ${existingPlayer.id} not found.`)
      return
    }

    const player = await db.player.delete({
      where: {
        id: existingPlayer.id,
      },
      include: {
        user: true,
      },
    })

    const table = await getTableById(player.tableId)

    if (!table) {
      return null
    }

    if (table.players.length === 1) {
      await db.table.update({
        where: {
          id: table.id,
        },
        data: {
          handOver: true,
        },
      })
    }

    return { ...player, table }
  } catch (error) {
    console.log(error)

    return null
  }
}

export const updatePreviousStackPlayers = async (players: PlayerWithUser[]) => {
  try {
    for (const player of players) {
      await db.player.update({
        where: {
          id: player.id,
        },
        data: {
          previousStack: player.stack,
        },
      })
    }
  } catch (error) {
    console.log(error)
  }
}
