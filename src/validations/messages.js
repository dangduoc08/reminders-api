import validator from 'validator'
import HTTPError from '../error/http_error.js'

export default class Messages {
  static _instance

  static getInstance() {
    if (!Messages._instance) {
      Messages._instance = new Messages()
    }
    return Messages._instance
  }

  validateMessage(dto) {
    const { method } = dto

    if (!method || !validator.isIn(method, ['email'])) {
      throw new HTTPError(['Invalid method.'], 422)
    }
  }
}