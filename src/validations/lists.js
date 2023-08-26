import validator from 'validator'
import HTTPError from '../error/http_error.js'

export default class Lists {
  static _instance

  constructor() { }

  static getInstance() {
    if (!Lists._instance) {
      Lists._instance = new Lists()
    }
    return Lists._instance
  }

  validateCreate({
    user_id,
    title_color,
    title
  }) {
    const errors = []

    if (user_id === null || user_id === undefined) {
      errors.push('Invalid user_id.')
    }

    if (!validator.isLength(title, { min: 3, max: 100 })) {
      errors.push('Invalid title.')
    }

    if (typeof title_color === 'string' && !validator.isHexColor(title_color)) {
      errors.push('Invalid title_color.')
    }

    if (errors.length > 0) {
      throw new HTTPError(errors, 422)
    }
  }

  validateList({
    user_id,
    limit,
    offset,
    sort,
    order
  }) {
    const errors = []

    if (user_id === null || user_id === undefined) {
      errors.push('Invalid user_id.')
    }

    if (!validator.isInt(limit + '')) {
      errors.push('Invalid limit')
    }

    if (!validator.isInt(offset + '')) {
      errors.push('Invalid offset')
    }

    if (!sort && order) {
      errors.push('Invalid sort')
    }

    if (sort && !order) {
      errors.push('Invalid order')
    }

    if (order && !validator.isIn(order, ['ASC', 'DESC'])) {
      errors.push('Invalid order')
    }

    if (errors.length > 0) {
      throw new HTTPError(errors, 422)
    }
  }
}