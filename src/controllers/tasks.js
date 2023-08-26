import {
  TASK_STATUSES
} from '../constants/index.js'

export default class Tasks {
  static _instance

  constructor(tasksModel) {
    this.tasksModel = tasksModel
  }

  static getInstance(tasksModel) {
    if (!Tasks._instance) {
      Tasks._instance = new Tasks(tasksModel)
    }

    return Tasks._instance
  }

  async create(dto) {
    return this.tasksModel.createOneTask(dto)
  }

  async list(dto) {
    const { limit, offset, sort, order, list_id, user_id } = dto

    // FIXME: - Add user_id filter later
    return this.tasksModel.getManyTasksJoinTags({
      // user_id: {
      //   eq: data.user_id
      // },
      list_id: {
        eq: list_id
      },
      status: {
        ne: TASK_STATUSES.DELETED,
      },
      limit: +limit,
      offset: +offset,
      sort: sort && order && {
        [sort]: order
      }
    })
  }

  async update(data) {
    return this.tasksModel.updateOneTaskByID(data.id, data)
  }
}
