import validator from 'validator'
import HTTPError from '../error/http_error.js'

export default class Users {
  static _instance

  constructor(
    usersModel
  ) {
    this.usersModel = usersModel
  }

  static getInstance(usersModel) {
    if (!Users._instance) {
      Users._instance = new Users(usersModel)
    }
    return Users._instance
  }

  async canUserCreate(username, email) {
    try {
      const user = await this.usersModel.getOneUser({
        username: { eq: username },
        email: { eq: email }
      })
      if (!user) {
        return
      }

      throw new HTTPError(['User already created.'], 409)
    } catch (_) {
      throw new HTTPError(['User already created.'], 409)
    }
  }

  validateSignup(dto) {
    const {
      first_name,
      last_name,
      email,
      username,
      password,
      dob
    } = dto
    const errors = []

    if (
      !validator.isLength(first_name, { min: 1, max: 50 }) ||
      !validator.isAlpha(first_name)
    ) {
      errors.push('Invalid first_name.')
    }

    if (
      !validator.isLength(last_name, { min: 2, max: 50 }) ||
      !validator.isAlpha(last_name)
    ) {
      errors.push('Invalid last_name.')
    }

    if (!validator.isEmail(email)) {
      errors.push('Invalid email.')
    }

    if (
      !validator.isLength(username, { min: 5, max: 50 }) ||
      username.trim().match(/ /gi)?.length > 0
    ) {
      errors.push('Invalid username.')
    }

    if (!validator.isStrongPassword(password)) {
      errors.push('Invalid password.')
    }

    const dobDate = new Date(dob)
    if (
      !validator.isDate(dobDate)
      || dobDate.getTime() - new Date().getTime() >= 0
    ) {
      errors.push('Invalid dob.')
    }

    if (errors.length > 0) {
      throw new HTTPError(errors, 422)
    }
  }

  validateSignin(dto) {
    const {
      username,
      password
    } = dto
    const errors = []

    if (!validator.isLength(username, { min: 5, max: 50 }) ||
      username.trim().match(/ /gi)?.length > 0) {
      errors.push('Invalid username.')
    }

    if (!validator.isStrongPassword(password)) {
      errors.push('Invalid password.')
    }

    if (errors.length > 0) {
      throw new HTTPError(errors, 422)
    }
  }

  validateVerification(dto) {
    const { otp } = dto

    if (!validator.isInt(otp + '')) {
      throw new HTTPError(['Invalid OTP.'], 422)
    }
  }
}