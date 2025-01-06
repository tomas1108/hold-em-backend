import { Response } from 'express'

const responseWithData = (res: Response, statusCode: number, data: any) => {
  if (res.headersSent) return
  res.set('X-Total-Count', '30')
  res.set('Access-Control-Expose-Headers', 'Content-Range')
  res.set('Content-Range', 'bytes: 0-9/*')
  res.status(statusCode).json(data)
}

const error = (res: Response, message?: string) =>
  responseWithData(res, 500, {
    status: 500,
    message: message || 'Өө! Ямар нэг зүйл буруу байна!',
  })

const badrequest = (res: Response, message: string) =>
  responseWithData(res, 400, {
    status: 400,
    message,
  })

const ok = (res: Response, data?: any) => responseWithData(res, 200, data)

const created = (res: Response, data: any) => responseWithData(res, 201, data)

const unauthorized = (res: Response) =>
  responseWithData(res, 401, {
    status: 401,
    message: 'Unauthorized',
  })

const notfound = (res: Response) =>
  responseWithData(res, 401, {
    status: 401,
    message: 'Resource not found!',
  })

export default {
  error,
  badrequest,
  ok,
  created,
  unauthorized,
  notfound,
}
