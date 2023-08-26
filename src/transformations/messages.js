const defaultState = {
  method: null
}

export default class Messages {
  static _instance

  static getInstance() {
    if (!Messages._instance) {
      Messages._instance = new Messages()
    }
    return Messages._instance
  }

  transformMessage(data) {
    const dto = Object.assign({}, defaultState)

    dto.method = data.method?.trim() || defaultState.method

    return dto
  }
}