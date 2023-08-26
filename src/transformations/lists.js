const defaultCreateState = {
  title: null,
  title_color: null,
  user_id: null
}

const defaultListState = {
  limit: 50,
  offset: 0,
  sort: null,
  user_id: null,
  order: null
}


export default class Lists {
  static _instance

  static getInstance() {
    if (!Lists._instance) {
      Lists._instance = new Lists()
    }
    return Lists._instance
  }

  transformCreate(data) {
    const dto = Object.assign({}, defaultCreateState)

    dto.title = data.title?.trim() || defaultCreateState.title

    dto.title_color = data.title_color?.trim() || defaultCreateState.title_color

    dto.user_id = +data.user_id

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
      typeof data.order === 'string'
        ? data.order?.trim()?.toUpperCase()
        : defaultListState.order

    dto.user_id = +data.user_id

    return dto
  }
}