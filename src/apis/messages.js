import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'

export default class Messages {
  static _instance

  constructor(messagesController, messagesValidation, messagesTransformation) {
    this.messagesController = messagesController
    this.messagesValidation = messagesValidation
    this.messagesTransformation = messagesTransformation
    this.router = Router()
  }

  static getInstance(messagesController, messagesValidation, messagesTransformation) {
    if (!Messages._instance) {
      Messages._instance = new Messages(messagesController, messagesValidation, messagesTransformation)
    }

    return Messages._instance
  }

  serve() {
    this.router.post('/otps', authenticate('headers.token', process.env.OTP_TOKEN_SECRET), async (req, res) => {
      try {
        // transformations
        const dto = this.messagesTransformation.transformMessage(req.body.data)

        // validations
        this.messagesValidation.validateMessage(dto)

        // handler
        await this.messagesController.message({
          user_id: req.user.id,
          ...dto
        })

        return res
          .json({
            message: 'Success',
            errors: null,
            data: {
              is_send: true
            }
          })
      } catch ({ message, errors, code = 500 }) {
        res
          .status(code)
          .json({
            message,
            errors,
            data: {
              is_send: false
            }
          })
      }
    })

    return this.router
  }
}
