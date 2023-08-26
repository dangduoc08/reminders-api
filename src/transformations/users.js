const defaultState = {
  first_name: null,
  last_name: null,
  dob: null,
  username: null,
  password: null,
  email: null
}

export default class Users {
  static _instance

  static getInstance() {
    if (!Users._instance) {
      Users._instance = new Users()
    }
    return Users._instance
  }

  transformSignup(data) {
    const dto = Object.assign({}, defaultState)

    dto.first_name = data.first_name?.trim() || defaultState.first_name

    dto.last_name = data.last_name?.trim() || defaultState.last_name

    dto.dob = data.dob?.trim() || defaultState.dob

    dto.username = data.username?.trim() || defaultState.username

    dto.password = data.password || defaultState.password

    dto.email = data.email?.trim() || defaultState.email

    return dto
  }

  transformSignin(data) {
    const dto = Object.assign({}, defaultState)

    dto.username = data.username?.trim() || defaultState.username

    dto.password = data.password || defaultState.password

    return dto
  }
}