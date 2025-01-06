import { Response } from "express"
import responseHandler from "../handlers/response-handler"
import { db } from "../lib/db"

export const authorized = async (token: string, res: Response) => {
    try {
        const user = await db.user.findFirst({
            where: {
                token
            }
        })

        if (!user) {
            return false
        }
        return true
    } catch (err) {

    }
}