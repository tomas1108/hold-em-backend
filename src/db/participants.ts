import axios from 'axios'
import { db } from '../lib/db'
import { PokerActions, RaiseType } from '../pokergame/actions'
import { ParticipantWithPlayer } from '../types'

export const getParticipants = async () => {
  try {
    const participant = await db.participant.findMany({})
    return participant
  } catch (error) {
    return []
  }
}

export const getParticipantById = async (id: string) => {
  try {
    const participant = await db.participant.findFirst({
      where: {
        id,
      },
    })
    return participant
  } catch (error) {
    return null
  }
}

export const handleParticipantFold = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isFolded: true,
        lastAction: PokerActions.FOLD,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
        match: true,
      },
    })
    return participant
  } catch (error) {
    console.log(error)
    return null
  }
}

const raise = async (
  currentParticipant: ParticipantWithPlayer,
  amount: number,
  type: RaiseType
) => {
  try {
    const stack = currentParticipant.player.stack
    const reRaiseAmount = amount - currentParticipant.bet

    if (reRaiseAmount > stack) return

    // Fee for earch raise turn
    // const serviceFeeRate = await db.settingParameters.findMany({
    //   select: {
    //     serviceFeeRate: true
    //   }
    // })
    // const raiseCollectionFee = reRaiseAmount * Number.parseFloat(String(serviceFeeRate[0].serviceFeeRate))

    const participant = await db.participant.update({
      where: {
        id: currentParticipant.id,
      },
      data: {
        bet: amount,
        totalBet: {
          // increment: reRaiseAmount - raiseCollectionFee,
          increment: reRaiseAmount,
        },
        lastAction: type,
        isAllIn: type === RaiseType.ALLIN,
      },
      include: {
        player: {
          include: {
            user: true,
            table: {
              select: {
                name: true
              }
            }
          },
        },
      },
    })

    // Store logger history
    await db.participantRaiseHistory.create({
      data: {
        title: "[RAISE] Log raise history",
        username: participant.player.user.username,
        totalBet: participant.totalBet,
        raiseType: type,
        tableName: participant.player.table.name
      }
    })

    if (participant.player.user.seamLessToken) {
      const baseURL =  process.env.SEAMLESS_API_URL;
      await axios.post(
        `${baseURL}/banks/histories/save`,
        {
          username: participant.player.user.username,
          betAmount: amount,
          actionType: type,
          playerStatus: 'BETTING'
        },
        {
          headers: {
            Authorization: "Bearer " + participant.player.user.seamLessToken
          }
        }
      )
    }

    const updatedPlayer = await db.player.update({
      where: {
        id: currentParticipant.playerId,
      },
      data: {
        isTurn: false,
        stack: {
          decrement: reRaiseAmount,
        },
      },
    })

    // // Update collection amount 
    // await db.moneyCollectionHistory.updateMany({
    //   where: {
    //     tableId: currentParticipant.player.tableId,
    //     tableStatus: 'active'
    //   },
    //   data: {
    //     amount: {
    //       increment: raiseCollectionFee
    //     }
    //   }
    // })

    return { participant, updatedPlayer }
  } catch {
    return null
  }
}

export const handleParticipantRaise = async (
  id: string,
  amount: number,
  type: RaiseType
) => {
  try {
    const currentParticipant = await db.participant.findUnique({
      where: {
        id,
      },
      include: {
        match: true,
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!currentParticipant) return null

    const currentMatch = currentParticipant.match

    let addedToPot = amount - currentParticipant.bet

    const data = await raise(currentParticipant, amount, type)

    if (!data) return null

    const { participant, updatedPlayer } = data

    const updatedMinRaise = currentMatch.callAmount
      ? currentMatch.callAmount +
        (currentParticipant.bet - currentMatch.callAmount) * 2
      : currentParticipant.bet * 2

    await db.match.update({
      where: {
        id: currentMatch.id,
      },
      data: {
        pot: {
          increment: addedToPot,
        },
        callAmount: Math.max(amount, currentMatch.callAmount),
        minRaise: updatedMinRaise,
      },
    })

    return { participant, updatedPlayer }
  } catch (error) {
    console.log(error)
    return null
  }
}

const callRaise = async (
  currentParticipant: ParticipantWithPlayer,
  amount: number
) => {
  try {
    const stack = currentParticipant.player?.stack
    let amountCalled = amount - currentParticipant.bet
    if (amountCalled >= stack) amountCalled = stack

    const participant = await db.participant.update({
      where: {
        id: currentParticipant.id,
      },
      data: {
        bet: {
          increment: amountCalled,
        },
        totalBet: {
          increment: amountCalled,
        },
        lastAction: PokerActions.CALL,
      },
      include: {
        player: {
          include: {
            user: true,
            table: {
              select: {
                name: true
              }
            }
          },
        },
      },
    })

    // Store logger history
    await db.participantRaiseHistory.create({
      data: {
        title: "[RAISE] Log raise history",
        username: participant.player.user.username,
        totalBet: participant.totalBet,
        raiseType: "CALL",
        tableName: participant.player.table.name
      }
    })

    if (participant.player.user.seamLessToken) {
      const baseURL =  process.env.SEAMLESS_API_URL;
      await axios.post(
        `${baseURL}/banks/histories/save`,
        {
          username: participant.player.user.username,
          betAmount: amount,
          actionType: "CALL",
          playerStatus: 'BETTING'
        },
        {
          headers: {
            Authorization: "Bearer " + participant.player.user.seamLessToken
          }
        }
      )
    }

    const updatedPlayer = await db.player.update({
      where: {
        id: currentParticipant.playerId,
      },
      data: {
        isTurn: false,
        stack: {
          decrement: amountCalled,
        },
      },
    })

    return { participant, updatedPlayer }
  } catch (error) {
    return null
  }
}

export const handleParticipantCall = async (id: string) => {
  try {
    const currentParticipant = await db.participant.findUnique({
      where: {
        id,
      },
      include: {
        match: {
          include: {
            sidePots: true,
          },
        },
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!currentParticipant) return null

    const currentMatch = currentParticipant.match

    const stack = currentParticipant.player?.stack

    let addedToPot =
      currentMatch.callAmount > stack + currentParticipant.bet
        ? stack
        : currentMatch.callAmount - currentParticipant.bet

    const data = await callRaise(currentParticipant, currentMatch.callAmount)

    if (!data) return null

    const { participant, updatedPlayer } = data

    if (!currentMatch.sidePots.length) {
      await db.match.update({
        where: {
          id: currentMatch.id,
        },
        data: {
          pot: {
            increment: addedToPot,
          },
        },
      })
    } 

    return { participant, updatedPlayer }
  } catch (error) {
    return null
  }
}

export const handleParticipantCheck = async (id: string) => {
  try {
    const participant = await db.participant.update({
      where: {
        id,
      },
      data: {
        isChecked: true,
        lastAction: PokerActions.CHECK,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
        match: true,
      },
    })
    return participant
  } catch (error) {
    return null
  }
}
