import express from 'express'
import crypto from 'crypto'
import { getUserByEmail, getUserByUsername, updateUserById } from '../db/users'
import { authentication, random } from '../helpers'
import responseHandler from '../handlers/response-handler'
import { db } from '../lib/db'
import axios from 'axios'
import { PokerActions } from '../pokergame/actions'

const login = async (req: express.Request, res: express.Response) => {
  try {
    const { username, password, deviceId } = req.body
    console.info('[AUTH] Login processing...')

    if (!username || !password) {
      return responseHandler.notfound(res)
    }

    const user = await getUserByUsername(username)
        
    console.info('[AUTH] Check user: ', user ? '{Found}' : '{NotFound}')
    
    if (!user) {
      return responseHandler.badrequest(res, 'User does not exist')
    }

    const isInGameRoom = await db.player.findFirst({
      where: {
        user: {
          username
        }
      }
    })

    if (isInGameRoom) {
        return responseHandler.badrequest(res, 'User is in game room')
    }

    const expectedHash = authentication(user.salt as string, password)

    if (user.password != expectedHash) {
        console.info('Password not match')
        return responseHandler.badrequest(res, 'Password not match')
    }

    const salt = random()
    const updateToken = authentication(salt, user.id.toString())

    const updatedUser = await updateUserById(user.id, {
        token: updateToken,
        deviceId,
        removedAt: null
    })
    
    // // Sign in in Seamless API
    const baseURL =  process.env.SEAMLESS_API_URL;
    const { data } = await axios.post(`${baseURL}/auth/login`, { username, password });

    if (data?.access_token) {
      await db.user.update({
        where: {
          username
        },
        data: {
          seamLessToken: data?.access_token,
        }
      })
    }
    
    res?.app?.get('io')?.emit(PokerActions.UPDATED_DEVICE_ID, { deviceId: user.deviceId })

    responseHandler.created(res, {
      user: updatedUser,
      id: user.id,
      msg: 'Login successfully!',
    })
    return;
  } catch (error) {
    console.log('error: ', error);
    responseHandler.error(res)
  }
}

const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username, external, name } = req.body

    if (!password || !username) {
      return responseHandler.notfound(res)
    }

    if (email) {
      const existingUser = await getUserByEmail(email)

      if (existingUser) {
        return responseHandler.badrequest(res, 'Email has already used')
      }
    }

    const salt = random()

    const user = await db.user.create({
      data: {
        email: email ?? `${username}@gmail.com`,
        username,
        name: name ?? '',
        salt,
        password: authentication(salt, password),
        removedAt: null,
        chipsAmount: 0
      },
    })

    if (!external) {
        const seamLessRequestBody = {
          username: username,
          password,
          name: username,
          external: true
        }
    
        // Sign up in Seamless API
        const baseURL =  process.env.SEAMLESS_API_URL;
        await axios.post(`${baseURL}/users`, seamLessRequestBody);
    }

    responseHandler.created(res, {
      user: {...user, temperatePassword: password},
      id: user?.id,
      message: 'Sign up successfully!',
    })
  } catch (error) {
    console.log('error: ', error);
    responseHandler.error(res)
  }
}

const newPassword = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { password, newPassword } = req.body

    if (!id || !password) {
      return responseHandler.notfound(res)
    }

    const user = await db.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      return responseHandler.badrequest(res, 'User not found')
    }

    const expectedHash = authentication(user.salt as string, password)

    if (user.password != expectedHash) {
      return responseHandler.badrequest(res, 'Password not match')
    }

    const updatedUser = await updateUserById(user.id, {
      password: authentication(user.salt, newPassword),
    })

    responseHandler.ok(res, {
      user: updatedUser,
      id: user.id,
      message: 'Update password successfully!',
    })
  } catch (error) {
    responseHandler.error(res)
  }
}

const logout = async (req: express.Request, res: express.Response) => {
  try {
    // const accessToken = req.headers.authorization;
    const { userId } = req.body;

    if(!userId) return;
    await db.user.update({
      where: {
        id: userId
      },
      data: {
        token: null,
        seamLessToken: null,
        deviceId: null
      }
    })

    return responseHandler.ok(res, { message: 'Logout successfully!' })

  }  catch (error) {
    responseHandler.error(res)
  }
}

const updateToken = async (req: express.Request, res: express.Response) => {
  try {
    const currentToken = req.headers.authorization;
    if (currentToken) {
      const { token } = req.body;

      const user = await db.user.findFirst({
        where: {
          token: currentToken
        }
      })

      if (user) {
        const updatedTokenForUser = await db.user.update({
          where: {
            id: user.id
          },
          data: {
            token
          }
        })

        return updatedTokenForUser;
      }
    }
    return responseHandler.badrequest(res, "Failed to update token")
  } catch (err) {
    console.error(err)
    return null
  }
}

const generateAccountHash = async (req: express.Request, res: express.Response) => {
  try {
    const { username, password, email, domain, name } = req.body

    const userData = JSON.stringify({ username, password, email, domain, name });
    const secretKey = crypto.randomBytes(32).toString('hex');

    const encrypted = encrypt(userData, secretKey);
    const generatedLink = `${domain}/access?encryptedData=${encrypted.encryptedData}&iv=${encrypted.iv}&secretKey=${secretKey}`
    
    return responseHandler.ok(res, { link: generatedLink })
  } catch (err) {
    console.log('err: ', err)
    return null
  }
}

const checkAccountHash = (req: express.Request, res: express.Response) => {
  try {
    const { encryptedData, iv, secretKey } = req.query

    const decryptedData = decrypt(String(encryptedData), String(secretKey), String(iv));
    const userData = JSON.parse(decryptedData)

    return responseHandler.ok(res, userData)
  } catch (err) {
    console.error('err: ', err)
    return null
  }
}

// Function to encrypt data
function encrypt(data: string, secretKey: string): { iv: string, encryptedData: string } {
  const iv = crypto.randomBytes(16); // Generate a random initialization vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
}

// Function to decrypt data
function decrypt(encryptedData: string, secretKey: string, iv: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export default {
  login,
  register,
  newPassword,
  logout,
  generateAccountHash,
  checkAccountHash,
  updateToken
}
