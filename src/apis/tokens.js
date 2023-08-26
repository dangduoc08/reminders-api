import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'

export default class Tokens {
  static _instance

  constructor(tokensController) {
    this.tokensController = tokensController
    this.router = Router()
  }

  static getInstance(tokensController) {
    if (!Tokens._instance) {
      Tokens._instance = new Tokens(tokensController)
    }
    return Tokens._instance
  }

  serve() {
    this.router.post(
      '/refresh',
      authenticate('headers.token', process.env.REFRESH_TOKEN_SECRET),
      async (req, res) => {
        try {
          const dto = {
            user_id: req.user.id
          }

          const token = await this.tokensController.refresh(dto)

          return res
            .json({
              message: 'Success',
              errors: null,
              data: token
            })
        } catch ({ message, errors, code = 500 }) {
          res
            .status(code)
            .json({
              message,
              errors,
              data: null
            })
        }
      })

    return this.router
  }
}
