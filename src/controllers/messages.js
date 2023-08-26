import jwt from 'jsonwebtoken'
import HTTPError from '../error/http_error.js'
import {
  USER_STATUSES
} from '../constants/index.js'

export default class Messages {
  static _instance

  constructor(
    mailsController,
    nodeCache,
    usersModel
  ) {
    this.mailsController = mailsController
    this.nodeCache = nodeCache
    this.usersModel = usersModel
  }

  static getInstance(
    mailsController,
    nodeCache,
    usersModel
  ) {
    if (!Messages._instance) {
      Messages._instance = new Messages(
        mailsController,
        nodeCache,
        usersModel
      )
    }
    return Messages._instance
  }

  generateOTP(username) {
    const min = 100000
    const max = 999999
    const otp = Math.floor(Math.random() * (max - min + 1)) + min

    this.nodeCache.set(username, otp, 120) // 2 mins
    return otp
  }

  async message(dto) {
    const {
      user_id,
      method
    } = dto

    const user = await this.usersModel.getOneUserByID(user_id)
    if (!user) {
      throw new HTTPError(['User not exists.'], 404)
    }

    if (user.status !== USER_STATUSES.UNVERIFIED) {
      throw new HTTPError(['Cannot send OTP.'], 500)
    }

    const otp = this.generateOTP(user.username)

    if (method === 'email') {
      this.mailsController.sendOTP(
        'Reminders: Confirm your account.',
        user.email,
        `${user.first_name} ${user.last_name}`,
        otp
      )
    }

    return null
  }
}
