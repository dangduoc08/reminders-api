import validator from 'validator'
import HTTPError from '../error/http_error.js'

export default class Lists {
  static _instance

  constructor(listsModel) {
    this.listsModel = listsModel
  }

  static getInstance(listsModel) {
    if (!Lists._instance) {
      Lists._instance = new Lists(listsModel)
    }
    return Lists._instance
  }

  async create(dto) {
    return this.listsModel.createOneList(dto)
  }

  async list({ limit, offset, user_id, sort, order }) {
    return this.listsModel.getManyLists({
      user_id: {
        eq: user_id
      },
      limit,
      offset,
      sort: sort && order && {
        [sort]: order
      }
    })
  }
}
