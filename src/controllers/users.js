import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import HTTPError from '../error/http_error.js'
import {
  USER_STATUSES
} from '../constants/index.js'

export default class Users {
  static _instance

  constructor(
    usersModel,
    mailsController,
    nodeCache
  ) {
    this.usersModel = usersModel
    this.mailsController = mailsController
    this.nodeCache = nodeCache
  }

  static getInstance(
    usersModel,
    mailsController,
    nodeCache
  ) {
    if (!Users._instance) {
      Users._instance = new Users(
        usersModel,
        mailsController,
        nodeCache
      )
    }
    return Users._instance
  }

  generateOTP(username) {
    const min = 100000
    const max = 999999
    const otp = Math.floor(Math.random() * (max - min + 1)) + min

    this.nodeCache.set(username, otp, 120)
    return otp
  }

  removeSensitive(user) {
    delete user.hash
    delete user.email
    delete user.username
  }

  async signup(dto) {
    const {
      password
    } = dto

    const hash = bcrypt.hashSync(password, 10)

    const user = await this.usersModel.createOneUser({ ...dto, hash })

    if (user) {
      const otp = this.generateOTP(user.username)
      this.mailsController.sendOTP(
        'Reminders: Confirm your account.',
        user.email,
        `${user.first_name} ${user.last_name}`,
        otp
      )
    }

    this.removeSensitive(user)
    return user
  }

  async signin(dto) {
    const {
      username,
      password
    } = dto
    const user = await this.usersModel.getOneUser({
      username: { eq: username }
    })
    if (!user) {
      throw new HTTPError(['User not exists.'], 404)
    }

    if (user.status !== USER_STATUSES.ACTIVATED) {
      const otpToken = jwt.sign(
        { id: user.id },
        process.env.OTP_TOKEN_SECRET,
        { expiresIn: 30 * 60 } // 10m 
      )

      return {
        token: {
          otp_token: otpToken
        }
      }
    }

    const isMatchedPwd = bcrypt.compareSync(password, user.hash)
    if (!isMatchedPwd) {
      throw new HTTPError(['Authentication failed.'], 401)
    }

    this.removeSensitive(user)

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: 10 * 60 } // 10m 
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: 24 * 60 * 60 } // 1d
    )

    user.token = {
      access_token: accessToken,
      refresh_token: refreshToken
    }

    return user
  }

  async verify(dto) {
    const {
      otp,
      id
    } = dto

    let user = await this.usersModel.getOneUserByID(id)
    if (!user) {
      throw new HTTPError(['User not exists.'], 404)
    }

    const savedOTP = this.nodeCache.get(user.username)
    if (savedOTP != otp) {
      throw new HTTPError(['Unmatched OTP.'], 401)
    }

    if (user.status !== USER_STATUSES.UNVERIFIED) {
      throw new HTTPError(['User has already verified.'], 409)
    }

    user = await this.usersModel.updateOneUserByID(user.id, { status: USER_STATUSES.ACTIVATED })

    this.nodeCache.del(user.username)

    this.removeSensitive(user)

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: 10 * 60 } // 10m 
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: 24 * 60 * 60 } // 1d
    )

    user.token = {
      access_token: accessToken,
      refresh_token: refreshToken
    }

    return user
  }
}
