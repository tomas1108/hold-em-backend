import { db } from '../lib/db'
import { rechargeQueue } from '../seamless/in.memory.queue'
import axiosInstance from '../seamless/interceptors'
import { getTableById } from './tables'
import axios from 'axios'
import { formatCardForSolver } from '../utils/formatting'
import { PlayingCard } from '@xpressit/winning-poker-hand-rank/dist/types'

export const createLoseHistories = async (tableId: string, matchId: string) => {
  try {
    const table = await getTableById(tableId)

    if (!table) {
      return null
    }

    const players = table.players

    if (!players.length) {
      return null
    }

    for (const player of players) {
      const amount = player.previousStack - player.stack

      if (amount <= 0) continue

      const history = await db.loseHistory.create({
        data: {
          matchId,
          userId: player.userId,
          amount,
        },
      })

      // Get current participant information
      const participant = await db.participant.findFirst({
        where: {
          matchId,
          playerId: player.id
        },
        include: {
          player: {
            include: {
              user: true,
            },
          },
          cardOne: true,
          cardTwo: true,
          match: {
            include: {
              board: true
            }
          }
        },
      })
      
        console.log('player.user.seamLessToken: ', player.user.seamLessToken)
        console.log('participant?.cardOne: ', participant?.cardOne)
        console.log('participant?.cardTwo: ', participant?.cardTwo)
      
      
      // Update loser history in Seamless API
      if (player.user.seamLessToken && participant && participant?.cardOne && participant?.cardTwo) {
        const formattedBoard = participant.match.board.map(item =>
          formatCardForSolver(item)
        ) as [PlayingCard, PlayingCard, PlayingCard, PlayingCard, PlayingCard]

        const combinedCards = [
          ...formattedBoard,
          formatCardForSolver(participant.cardOne), 
          formatCardForSolver(participant.cardTwo)
        ]

        const baseURL =  process.env.SEAMLESS_API_URL;
        await axios.post(
          `${baseURL}/banks/histories/save`,
          {
            username: player.user.username,
            betAmount: amount,
            actionType: '',
            playerStatus: 'LOSER',
            detailCards: `[${combinedCards.join(', ')}]`
          },
          {
            headers: {
              Authorization: "Bearer " + player.user.seamLessToken
            }
          }
        )
      }
      
      
    }
  } catch {
    return null
  }
}
