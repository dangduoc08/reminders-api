import {
  PRIORITIES
} from '../constants/index.js'

const defaultCreateState = {
  title: null,
  pos: null,
  content: null,
  url: null,
  notify_at: null,
  tags: null,
  priority: PRIORITIES.NONE,
  list_id: null,
  user_id: null,
}

const defaultListState = {
  limit: 50,
  offset: 0,
  sort: null,
  order: null,
  user_id: null,
  user_id: null
}


export default class Tasks {
  static _instance

  static getInstance() {
    if (!Tasks._instance) {
      Tasks._instance = new Tasks()
    }
    return Tasks._instance
  }

  transformCreate(data) {
    const dto = Object.assign({}, defaultCreateState)

    dto.title = data.title?.trim() || defaultCreateState.title

    dto.pos = typeof data.pos === 'number'
      ? data.pos
      : defaultCreateState.pos

    dto.content = typeof data.content === 'string'
      ? data.content
      : defaultCreateState.content

    dto.url = typeof data.url === 'string'
      ? data.url?.trim()
      : defaultCreateState.url

    dto.notify_at = data.notify_at?.trim() || defaultCreateState.notify_at

    dto.tags = Array.isArray(data.tags) && data.tags?.length > 0
      ? data.tags
        .map(tag => typeof tag === 'string' ? tag.trim() : '')
        .filter(tag => tag)
      : defaultCreateState.tags

    dto.priority =
      typeof data.priority === 'string'
        ? data.priority?.trim()
        : defaultCreateState.priority

    dto.user_id = +data.user_id

    dto.list_id = +data.list_id

    return dto
  }

  transformList(data) {
    const dto = Object.assign({}, defaultListState)

    dto.limit = +data.limit || defaultListState.limit

    dto.offset = +data.offset || defaultListState.offset

    dto.sort =
      typeof data.sort === 'string'
        ? data.sort?.trim()
        : defaultListState.sort

    dto.order =
      typeof data.sort === 'string'
        ? data.order?.trim()?.toUpperCase()
        : defaultListState.order

    dto.user_id = +data.user_id

    dto.list_id = +data.list_id

    return dto
  }

  transformUpdate(data) {
    return this.transformCreate(data)
  }
}