import validator from 'validator'
import HTTPError from '../error/http_error.js'
import {
  PRIORITIES,
  TASK_STATUSES
} from '../constants/index.js'

export default class Tasks {
  static _instance

  constructor(tasksModel, listsModel) {
    this.tasksModel = tasksModel
    this.listsModel = listsModel
  }

  static getInstance(tasksModel, listsModel) {
    if (!Tasks._instance) {
      Tasks._instance = new Tasks(tasksModel, listsModel)
    }
    return Tasks._instance
  }

  getLastTaskPosition(tasks) {
    return tasks.sort((a, b) => a.pos - b.pos)?.[tasks.length - 1]?.pos ?? -1
  }

  async validateCreate({
    title,
    content,
    priority,
    pos,
    url,
    notify_at,
    list_id,
    user_id,
    tags = []
  }) {
    const errors = []

    if (user_id === null || user_id === undefined) {
      errors.push('Invalid user_id.', 422)
    }

    if (list_id === undefined || list_id === null) {
      errors.push('Invalid list_id.', 422)
    }
    const list = await this.listsModel.getOneList(
      {
        user_id: { eq: user_id },
        id: { eq: list_id }
      }
    )
    if (!list) {
      errors.push('List not exists.', 404)
    }

    if (!title) {
      errors.push('Invalid title.')
    }

    const tasks = await this.tasksModel.getManyTasks({
      user_id: { eq: user_id },
      list_id: { eq: list_id },
      status: { ne: TASK_STATUSES.DELETED }
    })
    if (!validator.isInt(pos + '', { min: 0 })) {
      errors.push('Invalid pos.')
    }

    const lastPos = this.getLastTaskPosition(tasks)
    if (pos != lastPos + 1) {
      errors.push(`Pos should be ${lastPos + 1}`)
    }

    if (typeof content === 'string' && content.length === 0) {
      errors.push('Invalid content.')
    }

    if (priority && !validator.isIn(priority, Object.values(PRIORITIES))) {
      errors.push('Invalid priority.')
    }

    if (tags && tags.some(tag => tag.trim().match(/ /gim)?.length > 0)) {
      errors.push('Invalid tags.')
    }

    if (url && !validator.isURL(url)) {
      errors.push('Invalid url.')
    }

    if (notify_at && !validator.isDate(new Date(notify_at))) {
      errors.push('Invalid notify_at.')
    }

    if (errors.length > 0) {
      throw new HTTPError(errors, 422)
    }
  }

  async validateList({
    user_id,
    list_id,
    limit,
    offset,
    sort,
    order
  }) {
    const errors = []

    if (user_id === null || user_id === undefined) {
      errors.push('Invalid user_id.')
    }

    if (list_id === undefined || list_id === null) {
      errors.push('Invalid list_id.')
    }
    const list = await this.listsModel.getOneList(
      {
        id: { eq: list_id },
        user_id: { eq: user_id }
      }
    )
    if (!list) {
      errors.push('List not exists.')
    }

    if (!validator.isInt(limit + '')) {
      errors.push('Invalid limit',)
    }

    if (!validator.isInt(offset + '')) {
      errors.push('Invalid offset',)
    }

    if (!sort && order) {
      errors.push('Invalid sort',)
    }

    if (sort && !order) {
      errors.push('Invalid order',)
    }

    if (order && !validator.isIn(order, ['ASC', 'DESC'])) {
      errors.push('Invalid order',)
    }

    if (errors.length > 0) {
      throw new HTTPError(errors, 422)
    }
  }

  async validateUpdate(
    {
      title,
      content,
      priority,
      status,
      url,
      notify_at,
      list_id,
      user_id,
      id,
      tags
    }
  ) {
    const errors = []

    if (user_id === null || user_id === undefined) {
      errors.push('Invalid user_id.')
    }

    if (list_id === undefined || list_id === null) {
      errors.push('Invalid list_id.')
    }
    const list = await this.listsModel.getOneList(
      {
        user_id: { eq: user_id },
        id: { eq: list_id }
      }
    )
    if (!list) {
      errors.push('List not exists.')
    }

    if (id === undefined || id === null) {
      errors.push('Invalid id.')
    }

    const task = await this.tasksModel.getOneTask({
      user_id: { eq: user_id },
      list_id: { eq: list_id },
      id: { eq: id },
      status: { ne: TASK_STATUSES.DELETED }
    })
    if (!task) {
      errors.push('Task not exists.')
    }

    if (!title) {
      errors.push('Invalid title.')
    }

    if (typeof content === 'string' && content.length === 0) {
      errors.push('Invalid content.')
    }

    if (url && !validator.isURL(url)) {
      errors.push('Invalid url.')
    }

    if (priority && !validator.isIn(priority, Object.values(PRIORITIES))) {
      errors.push('Invalid priority.')
    }

    if (status && !validator.isIn(status, Object.values(TASK_STATUSES))) {
      errors.push('Invalid status.')
    }

    if (priority && !validator.isIn(priority, Object.values(PRIORITIES))) {
      errors.push('Invalid priority.')
    }

    if (tags && tags.some(tag => tag.trim().match(/ /gim)?.length > 0)) {
      errors.push('Invalid tags.')
    }

    if (errors.length > 0) {
      throw new HTTPError(errors, 422)
    }
  }
}