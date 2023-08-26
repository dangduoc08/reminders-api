export const HTTP_CODES = {
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error'
}

export default class HTTPError extends Error {
  static defaultCode = 500

  constructor(message, code) {
    super(typeof message === 'string' && message.length > 0
      ? message
      : HTTP_CODES[code] || HTTP_CODES[HTTPError.defaultCode])
    this.code = HTTP_CODES[code] ? code : HTTPError.defaultCode
    this.errors = Array.isArray(message) ? message : null
  }
}
