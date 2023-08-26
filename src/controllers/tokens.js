import jwt from 'jsonwebtoken'
import HTTPError from '../error/http_error.js'
import {
  USER_STATUSES
} from '../constants/index.js'

export default class Tokens {
  static _instance

  constructor(usersModel) {
    this.usersModel = usersModel
  }

  static getInstance(usersModel) {
    if (!Tokens._instance) {
      Tokens._instance = new Tokens(
        usersModel
      )
    }
    return Tokens._instance
  }

  async refresh(dto) {
    const {
      user_id
    } = dto

    const user = await this.usersModel.getOneUserByID(user_id)
    if (!user) {
      throw new HTTPError(['User not exists.'], 404)
    }

    if (user.status !== USER_STATUSES.ACTIVATED) {
      throw new HTTPError([
        'Cannot refresh token.',
        'User is not activated'
      ], 403)
    }

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: 10 * 60 } // 10m 
    )

    return {
      access_token: accessToken
    }
  }
}
