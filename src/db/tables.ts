import { db } from '../lib/db'
import { Match, Participant, Player, Prisma } from '@prisma/client'
import {
  ParticipantWithPlayerAndCards,
  PlayerWithParticipants,
  PlayerWithUser,
  TableWithPlayers,
} from '../types'
import { PokerActions } from '../pokergame/actions'
import {
  formattedCards,
  getBestHand,
  getWinner,
  getWinner2,
  unformatCards,
} from './poker'
import { createLoseHistories } from './lose-history'
import axiosInstance from '../seamless/interceptors'
import { rechargeQueue } from '../seamless/in.memory.queue'
import axios from 'axios'
import { formatCardForSolver } from '../utils/formatting'
import { PlayingCard } from '@xpressit/winning-poker-hand-rank/dist/types'

// Table Actions
export const getTables = async () => {
  try {
    const tables = await db.table.findMany({
      include: {
        players: true,
        user: true,
      },
    })

    return tables
  } catch {
    return null
  }
}

export const getTableById = async (id: string) => {
  try {
    const table = await db.table.findUnique({
      where: {
        id,
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    })

    return table
  } catch {
    return null
  }
}

export const updateTableById = async (
  id: string,
  data: Prisma.TableUpdateInput
) => {
  try {
    const table = await db.table.update({
      where: {
        id,
      },
      data,
    })

    return table
  } catch (error) {
    throw new Error('Internal Error')
  }
}

const getUnfoldedParticipants = async (matchId: string) => {
  const participants = await db.participant.findMany({
    where: {
      matchId,
      isFolded: false,
    },
    include: {
      player: {
        include: {
          user: true,
        },
      },
      cardOne: true,
      cardTwo: true,
    },
  })

  return participants
}

const endWithoutShowdown = async (winner: ParticipantWithPlayerAndCards) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: winner.matchId,
      },
      include: {
        participants: true,
        board: true,
      },
    })

    if (!currentMatch) {
      return null
    }

     // Fee for winner has to paid after winning
     const serviceFeeRate = await db.settingParameters.findMany({
      select: {
        serviceFeeRate: true
      }
    })
    const serviceFee = currentMatch.pot * Number.parseFloat(String(serviceFeeRate[0].serviceFeeRate))
    // ---------------------------

    await db.participant.update({
      where: {
        id: winner.id,
      },
      data: {
        lastAction: PokerActions.WINNER,
      },
    })

    const winnerPlayer = await db.player.update({
      where: {
        id: winner.player.id,
      },
      data: {
        stack: {
          increment: currentMatch.pot - serviceFee,
        },
      },
      include: {
        user: true,
      },
    })

    await db.match.update({
      where: {
        id: winner.matchId,
      },
      data: {
        winners: {
          connect: {
            id: winnerPlayer.id,
          },
        },
      },
    })

    await db.winMessages.create({
      data: {
        userId: winnerPlayer.userId,
        matchId: winner.matchId,
        content: `${winnerPlayer.user.name} win ${currentMatch.pot - serviceFee}$ without showdown!`,
        amount: currentMatch.pot - serviceFee,
      },
    })
    
    // Get winner participant information
    const winnerParticipant = await db.participant.findFirst({
      where: {
        matchId: winner.matchId,
        playerId: winnerPlayer.id
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
    
    // Update winner history in Seamless API
    if (winnerPlayer.user.seamLessToken && winnerParticipant?.cardOne && winnerParticipant?.cardTwo) {
      const formattedBoard = currentMatch.board.map(item =>
        formatCardForSolver(item)
      ) as [PlayingCard, PlayingCard, PlayingCard, PlayingCard, PlayingCard]

      const combinedCards = [
        ...formattedBoard,
        formatCardForSolver(winnerParticipant.cardOne), 
        formatCardForSolver(winnerParticipant.cardTwo)
      ]

      const baseURL =  process.env.SEAMLESS_API_URL;
      await axios.post(
        `${baseURL}/banks/histories/save`,
        {
          username: winnerPlayer.user.username,
          betAmount: currentMatch.pot - serviceFee,
          actionType: '',
          playerStatus: 'WINNER',
          detailCards: `[${combinedCards.join(', ')}]`
        },
        {
          headers: {
            Authorization: "Bearer " + winnerPlayer.user.seamLessToken
          }
        }
      )
    }


    await updateWinnerCollectionFee(currentMatch.tableId, serviceFee)
    await stopUpdateFeeCollection(currentMatch.tableId)

    await createLoseHistories(currentMatch.tableId, currentMatch.id)
    await endHand(currentMatch.tableId)
  } catch (error) {
    console.log(error)
    // throw new Error('Table Error')
    return null
  }
}

const clearPlayerTurn = async (tableId: string) => {
  try {
    await db.player.updateMany({
      where: {
        tableId,
      },
      data: {
        isTurn: false,
      },
    })
  } catch (error) {
    return null
  }
}

const endHand = async (tableId: string) => {
  try {
    await clearPlayerTurn(tableId)

    await db.table.update({
      where: {
        id: tableId,
      },
      data: {
        handOver: true,
      },
    })
  } catch (error) {
    return null
  }
}

const isActionComplete = async (match: Match) => {
  try {
    const currentPariticipants = await db.participant.findMany({
      where: {
        matchId: match.id,
        isFolded: false,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    const filteredParticipants = currentPariticipants.filter(
      participant => participant.player.stack > 0
    )

    if (filteredParticipants.length === 0) {
      return true
    }


    // handle allin like call action
    const filterdParticipantsNotEnoughStack = currentPariticipants.filter(
      participant => participant.player.stack === 0
    )

    const isAllBetUnderCallAmount = filterdParticipantsNotEnoughStack.every(
      p => p.bet < match.callAmount
    )

    // Check if with 2 players and one of them is all in
    if (filteredParticipants.length === 1 && isAllBetUnderCallAmount) {
      return true
    }

    const participant = filteredParticipants[0]

    const result =
      filteredParticipants.length === 1 && participant.lastAction === 'CALL'

    return result
  } catch {
    // throw new Error('Internal Error')
    return null
  }
}

const isAllCheckedOrCalled = async (currentMatch: Match) => {
  try {
    const currentPariticipants = await db.participant.findMany({
      where: {
        matchId: currentMatch.id,
        isFolded: false,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    // handle bigblind missing turn
    const bigBlindParticipant = currentPariticipants.find(
      participant => participant.playerId === currentMatch.bigBlindId
    )

    const isPreFlop = currentMatch.isPreFlop && !currentMatch.isFlop

    const isBigBlindTurn =
      bigBlindParticipant?.bet === currentMatch.minBet * 2 &&
      !bigBlindParticipant.isChecked &&
      isPreFlop

    if (bigBlindParticipant && isBigBlindTurn) {
      return false
    }

    // default case
    const newCurrentParticipants = currentPariticipants.filter(
      participant => participant.player.stack > 0
    )

    return newCurrentParticipants.every(participant => {
      const betMatchesCallAmount =
        currentMatch.callAmount &&
        participant.bet.toFixed(2) === currentMatch.callAmount.toFixed(2)
      const noCallAmountButChecked =
        !currentMatch.callAmount && participant.isChecked

      return betMatchesCallAmount || noCallAmountButChecked
    })
  } catch {
    return null
  }
}

const resetBetsAndActions = async (matchId: string, limit: number) => {
  try {
    await db.match.update({
      where: {
        id: matchId,
      },
      data: {
        callAmount: 0,
        minRaise: limit / 200,
      },
    })

    await db.participant.updateMany({
      where: {
        matchId,
        NOT: {
          lastAction: 'ALLIN',
        },
      },
      data: {
        isChecked: false,
        bet: 0,
        lastAction: '',
      },
    })
  } catch (error) {
    throw new Error('Internal Error')
  }
}

const determineMainPotWinner = async (matchId: string) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
      },
    })

    if (!currentMatch) {
      return null
    }

    const unfoldedParticipants = (await getUnfoldedParticipants(
      matchId
    )) as ParticipantWithPlayerAndCards[]

    const winnerParticipants = await determineWinner(
      unfoldedParticipants,
      currentMatch.mainPot || currentMatch.pot,
      'mainPot'
    )

    if (!winnerParticipants?.length) {
      return null
    }

    const updatedMatch = await db.match.update({
      where: {
        id: matchId,
      },
      data: {
        isShowdown: true,
        winners: {
          connect: winnerParticipants.map(participant => ({
            id: participant.playerId,
          })),
        },
      },
      include: {
        table: true,
      },
    })

    await createLoseHistories(currentMatch.tableId, currentMatch.id)
    await endHand(currentMatch.tableId)

    return updatedMatch
  } catch (error) {
    console.log(error)
    return null
  }
}

const determineSidePotWinners = async (matchId: string) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        sidePots: {
          include: {
            participants: {
              include: {
                player: true,
                cardOne: true,
                cardTwo: true,
              },
            },
          },
        },
      },
    })

    if (!currentMatch) return null

    if (currentMatch.sidePots.length < 0) return null

    await Promise.all(
      currentMatch.sidePots.map(async sidePot => {
        await determineWinner(
          sidePot.participants as ParticipantWithPlayerAndCards[],
          sidePot.amount,
          'sidePot'
        )
      })
    )
  } catch {
    return null
  }
}

const determineWinner = async (
  participants: ParticipantWithPlayerAndCards[],
  amount: number,
  type: 'mainPot' | 'sidePot'
) => {
  try {
    if (participants.length === 0) {
      return null
    }

    const winners = await getWinner2(participants)

    if (!winners) return null

    for (const winner of winners) {
      const winAmount = amount / winners.length

      const winnerParticipant = await db.participant.update({
        where: {
          id: winner.id,
        },
        data: {
          bet: 0,
          lastAction: 'WINNER',
        },
        include: {
          cardOne: true,
          cardTwo: true,
          match: {
            include: {
              board: true,
            }
          }
        }
      })

      const player = await db.player.update({
        where: {
          id: winnerParticipant.playerId,
        },
        data: {
          isTurn: false,
          stack: {
            increment: winAmount,
          },
        },
        include: {
          user: true,
        },
      })

      if (type === 'mainPot') {
        // Fee for earch raise turn
        const serviceFeeRate = await db.settingParameters.findMany({
          select: {
            serviceFeeRate: true
          }
        })
        const serviceFee = amount * Number.parseFloat(String(serviceFeeRate[0].serviceFeeRate))
        // -------------------------

        await db.player.update({
          where: {
            id: winnerParticipant.playerId,
          },
          data: {
            stack: {
              decrement: serviceFee
            },
          }
        })

        await db.winMessages.create({
          data: {
            userId: player.userId,
            matchId: winnerParticipant.matchId,
            content: `${player.user.name} wins $${amount - serviceFee} with ${winner.handName}`,
            amount: amount - serviceFee,
            handName: winner.handName,
            bestHand: winner.bestHand,
            winnerHand: winner.winnerHand,
          },
        })
        
        console.log('player.user.seamLessToken: ', player.user.seamLessToken)
        console.log('winnerParticipant?.cardOne: ', winnerParticipant?.cardOne)
        console.log('winnerParticipant?.cardTwon: ', winnerParticipant?.cardTwo)
        
        // Update winner history in Seamless API
        if (player.user.seamLessToken && winnerParticipant?.cardOne && winnerParticipant?.cardTwo) {
          const formattedBoard = winnerParticipant.match.board.map(item =>
            formatCardForSolver(item)
          ) as [PlayingCard, PlayingCard, PlayingCard, PlayingCard, PlayingCard]

          const combinedCards = [
            ...formattedBoard,
            formatCardForSolver(winnerParticipant.cardOne), 
            formatCardForSolver(winnerParticipant.cardTwo)
          ]

          const baseURL =  process.env.SEAMLESS_API_URL;
          await axios.post(
            `${baseURL}/banks/histories/save`,
            {
              username: player.user.username,
              betAmount: amount - serviceFee,
              actionType: '',
              playerStatus: 'WINNER',
              detailCards: `[${combinedCards.join(', ')}]`
            },
            {
              headers: {
                Authorization: "Bearer " + player.user.seamLessToken
              }
            }
          )
        }

        await updateWinnerCollectionFee(player.tableId, serviceFee)
        await stopUpdateFeeCollection(player.tableId)
      }
    }

    // TODO: Hoa Bai

    return winners
  } catch (error) {
    console.log(error)
    return null
  }
}

const dealNextStreet = async (matchId: string) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        table: true,
        board: true,
      },
    })

    if (!currentMatch) {
      return null
    }

    await resetBetsAndActions(matchId, currentMatch.table.maxBuyIn)

    if (currentMatch.isPreFlop && !currentMatch.isFlop) {
      const updatedMatch = await db.match.update({
        where: {
          id: matchId,
        },
        data: {
          isFlop: true,
        },
        include: {
          table: true,
        },
      })
      return updatedMatch
    }

    if (currentMatch.isFlop && currentMatch.isPreFlop && !currentMatch.isTurn) {
      const updatedMatch = await db.match.update({
        where: {
          id: matchId,
        },
        data: {
          isTurn: true,
        },
        include: {
          table: true,
        },
      })

      return updatedMatch
    }

    if (
      currentMatch.isTurn &&
      currentMatch.isFlop &&
      currentMatch.isPreFlop &&
      !currentMatch.isRiver
    ) {
      const updatedMatch = await db.match.update({
        where: {
          id: matchId,
        },
        data: {
          isRiver: true,
        },
        include: {
          table: true,
        },
      })

      return updatedMatch
    }

    if (
      currentMatch.isRiver &&
      currentMatch.isTurn &&
      currentMatch.isFlop &&
      currentMatch.isPreFlop &&
      !currentMatch.isShowdown
    ) {
      await calculateSidePots(matchId)
      await determineSidePotWinners(matchId)
      const updatedMatch = await determineMainPotWinner(matchId)

      return updatedMatch
    }
  } catch (error) {
    console.log(error)
    return null
  }
}

const updateWinnerCollectionFee = async (tableId: string, amountOfWinner: number) => {
  try {
    const histories = await db.moneyCollectionHistory.updateMany({
      where: {
        tableId,
        tableStatus: 'active'
      },
      data: {
        amount: {
          increment: amountOfWinner
        }
      }
    })
  } catch (err) {
    console.error(err)
    return null
  }
}

const stopUpdateFeeCollection = async (tableId: string) => {
  try {
    await db.moneyCollectionHistory.updateMany({
      where: {
        tableId,
        tableStatus: 'active',
      }, 
      data: {
        tableStatus: 'unactive'
      }
    })
  } catch (error) {
    console.error(error)
    return null
  }
}

const updatePlayerTurn = async (table: TableWithPlayers, playerId: string) => {
  try {
    await clearPlayerTurn(table.id)

    const updatedNextPlayer = await db.player.update({
      where: {
        id: playerId,
      },
      data: {
        isTurn: true,
      },
      include: {
        user: true,
      },
    })

    return updatedNextPlayer
  } catch (error) {
    return null
  }
}

const findNextUnfoldedPlayer = (
  players: PlayerWithParticipants[],
  playerId: string,
  places: number
) => {
  let i = 0
  let current = players.findIndex(player => player.id === playerId)

  while (i < places) {
    if (current === players.length - 1) {
      current = 0
    } else {
      current++
    }

    let hand = players[current].participants[0]
    const stack = players[current].stack

    if (hand && !hand.isFolded && stack > 0) i++
  }

  return players[current].id
}

export const findNextActivePlayer = (
  players: Player[],
  playerId: string,
  places: number
) => {
  let player = players.findIndex(player => player.id === playerId)

  if (player === -1) player = 0

  const nextPlayer =
    player + places >= players.length
      ? player + places - players.length
      : player + places

  return players[nextPlayer].id
}

export const placeBlinds = async (
  tableId: string,
  matchId: string,
  playerId: string,
  amount: number
) => {
  try {
    const player = await db.player.findUnique({
      where: {
        id: playerId,
        tableId,
      },
      include: {
        user: true,
      },
    })

    if (!player) {
      return null
    }

    const currentParticipant = await db.participant.findFirst({
      where: {
        playerId,
        matchId,
      },
    })

    if (!currentParticipant) return null

    await db.participant.update({
      where: {
        id: currentParticipant.id,
        playerId,
        matchId,
      },
      data: {
        bet: amount,
        totalBet: {
          increment: amount,
        },
      },
    })

    await db.player.update({
      where: {
        id: player.id,
      },
      data: {
        stack: {
          decrement: amount,
        },
      },
    })
  } catch {
    return null
  }
}

const resetActionIfAllin = async (
  unfoldedParticipants: ParticipantWithPlayerAndCards[],
  playerId: string
) => {
  const currentParticipant = unfoldedParticipants.find(
    p => p.player.id === playerId
  )
  if (!currentParticipant) return null

  const isRaiseAction =
    currentParticipant.lastAction === 'RAISE' ||
    currentParticipant.lastAction === 'HALF' ||
    currentParticipant.lastAction === 'QUARTER' ||
    currentParticipant.lastAction === 'FULL'

  if (
    currentParticipant.lastAction === 'ALLIN' ||
    (isRaiseAction && currentParticipant.player.stack === 0)
  ) {
    await Promise.all(
      unfoldedParticipants.map(
        async (participant: ParticipantWithPlayerAndCards) => {
          if (
            participant.lastAction !== 'FOLD' &&
            participant.lastAction !== 'ALLIN'
          ) {
            await db.participant.update({
              where: {
                id: participant.id,
              },
              data: {
                lastAction: '',
              },
            })
          }
        }
      )
    )
  }
}

export const changeTurn = async (
  table: TableWithPlayers,
  participant: Participant
) => {
  try {
    if (!table) {
      return ''
    }

    const currentMatch = await db.match.findUnique({
      where: {
        id: participant.matchId,
      },
    })

    if (!currentMatch) {
      return ''
    }

    const currentPlayer = table.players.find(player => player.isTurn)

    if (!currentPlayer) {
      return ''
    }

    const players = await db.player.findMany({
      where: {
        tableId: table.id,
        participants: {
          some: {
            matchId: currentMatch.id,
          },
        },
      },
      include: {
        participants: true,
      },
    })

    const filteredPlayers = players.map(player => ({
      ...player,
      participants: player.participants.filter(
        participant => participant.matchId === currentMatch.id
      ),
    }))

    const unfoldedParticipants = (await getUnfoldedParticipants(
      participant.matchId
    )) as ParticipantWithPlayerAndCards[]

    if (unfoldedParticipants.length === 1) {
      await endWithoutShowdown(unfoldedParticipants[0])
      return ''
    }

    await resetActionIfAllin(unfoldedParticipants, currentPlayer.id)

    const isActionIsComplete = await isActionComplete(currentMatch)

    // Showdown happens
    if (isActionIsComplete) {
      // await calculateSidePots(participant.matchId)

      let match = await dealNextStreet(participant.matchId)

      if (!match) return ''

      // this.calculateSidePots()
      while (match && !match.isShowdown && !match.table.handOver) {
        match = await dealNextStreet(participant.matchId)
      }

      await db.match.update({
        where: {
          id: match?.id,
        },
        data: {
          isAllAllIn: true,
        },
      })

      return ''
    }

    const isFinishedMatch = await isAllCheckedOrCalled(currentMatch)

    if (isFinishedMatch) {
      // await calculateSidePots(participant.matchId)

      await dealNextStreet(participant.matchId)

      const updatedTable = await db.table.findUnique({
        where: {
          id: table.id,
        },
      })

      if (!updatedTable?.handOver) {
        const nextPlayerId = findNextUnfoldedPlayer(
          filteredPlayers,
          currentMatch.buttonId as string,
          1
        )

        await updatePlayerTurn(table, nextPlayerId)

        return nextPlayerId
      }
      return ''
    }

    const nextPlayerId = findNextUnfoldedPlayer(
      filteredPlayers,
      currentPlayer.id,
      1
    )

    await updatePlayerTurn(table, nextPlayerId)

    return nextPlayerId
  } catch (error) {
    console.log(error)
    return ''
  }
}

const getAllInThisTurn = async (matchId: string) => {
  try {
    const getParticipants = await db.participant.findMany({
      where: {
        matchId,
        isFolded: false,
      },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    })

    const participants = getParticipants.filter(
      participant => participant.player.stack === 0 && participant.bet > 0
    )

    return participants
  } catch (error) {
    return []
  }
}

const calculateSidePots = async (matchId: string) => {
  try {
    const currentMatch = await db.match.findUnique({
      where: {
        id: matchId,
      },
      select: {
        table: {
          select: {
            name: true
          }
        }
      }
    })

    if (!currentMatch) return null

    // let allInParticipants = await getAllInThisTurn(matchId)
    let unFoldpartipants = await getUnfoldedParticipants(matchId)
    if (unFoldpartipants.length < 1) return null

    
    // Store logger history
    let loggerData: any =  unFoldpartipants.map((p) => (
      { username: p.player.user.username, totalBet: p.totalBet }
    ))
    await storeHistoryLogger(
      '[BET] before calculating',
      loggerData
    )

    // Call mainpot
    const minTotalBet = unFoldpartipants
                        .sort((a, b) => a.totalBet - b.totalBet)[0].totalBet
    const mainPot = minTotalBet * unFoldpartipants.length

    unFoldpartipants = unFoldpartipants
                        .filter((participant) => participant.totalBet - minTotalBet > 0)
                        .map((participant) => ({ ...participant, totalBet: participant.totalBet - minTotalBet }))

   
    // Store logger history
    loggerData =  unFoldpartipants.map((p) => (
      { username: p.player.user.username, totalBet: p.totalBet }
    ))
    await storeHistoryLogger(
      '[BET] after calculating main pot',
      {
        loggerData,
        mainPot
      }
    )


    // Sort participant's totlBet ascending
    let sortedUnfoldPaticipants = unFoldpartipants
                                  .sort((a, b) => a.totalBet - b.totalBet)

    let sidePotAmount: {
      amount: number;
      participants: { id: string }[]
    }[] = []

    if (sortedUnfoldPaticipants.length > 1) {
      while (sortedUnfoldPaticipants.length > 1) {
        // Call unfold's min bet
        const minBet = sortedUnfoldPaticipants[0].totalBet

        // Call pot amount in each round
        const potAmount = minBet * sortedUnfoldPaticipants.length;

        // Get eligible participants
        const eligiblePariticipants = sortedUnfoldPaticipants
          .map((participant) => ({ id: participant.id }))
        // Add pot data into sidepot
        sidePotAmount.push({
          amount: potAmount,
          participants: eligiblePariticipants
        })

        // Remove participants have totalBet < 0
        sortedUnfoldPaticipants = sortedUnfoldPaticipants
          .map((p) => ({ ...p, totalBet: p.totalBet - minBet }))
          .filter((p) => p.totalBet > 0);
      }
    }

    // If only one participant left, add his bet into sidepot
    if (sortedUnfoldPaticipants.length === 1) {
      sidePotAmount.push({
        amount: sortedUnfoldPaticipants[0].totalBet,
        participants: [
          { id: sortedUnfoldPaticipants[0].id }
        ]
      })
    }


    // Store logger history
    loggerData =  sidePotAmount.map((s) => (
      { amount: s.amount, players: s.participants.map((p) => p.id)}
    ))
    await storeHistoryLogger(
      '[SIDEPOT] sidepot amount and final mainpot - END GAME',
      loggerData,
      mainPot
    )


    // Update mainpot
    await db.match.update({
      where: {
        id: matchId,
      },
      data: {
        mainPot,
      },
    })

    // Save sidepot to database
    if (sidePotAmount.length >= 1) {
      await Promise.all(
        sidePotAmount.map(
          async (sidepot) => {
            await db.sidePot.create({
              data: {
                matchId,
                participants: {
                  connect: sidepot.participants
                },
                amount: sidepot.amount,
              },
            })
          }
        )
      )
    }


    // Store extra data (empty) for seperate between matches
    await db.participantRaiseHistory.create({
      data: {
        title: "[GAME] Finished game and SHOWDOWN",
        username: '[EMPTY USER FOR END GAME]',
        totalBet: 0,
        raiseType: "[EMPTY TYPE FOR END GAME]",
        tableName: currentMatch.table.name
      }
    })
  } catch (error) {
    return null
  }
}

const storeHistoryLogger = async (title: string, data: any, amount?: number) => {
  try {
    await db.sidePotHistory.create({
      data: {
        title,
        sidePotDetail: data,
        mainPot: amount ?? 0
      }
    })
  } catch (error) {
    return null
  }
}
