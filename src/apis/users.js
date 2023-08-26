import { Router } from 'express'

export default class Users {
  static _instance

  constructor(usersController, usersValidation, usersTransformation) {
    this.usersController = usersController
    this.usersValidation = usersValidation
    this.usersTransformation = usersTransformation
    this.router = Router()
  }

  static getInstance(usersController, usersValidation, usersTransformation) {
    if (!Users._instance) {
      Users._instance = new Users(usersController, usersValidation, usersTransformation)
    }

    return Users._instance
  }

  serve() {
    this.router.post('/signup', async (req, res) => {
      try {
        const data = {
          host: req.headers.origin,
          ...req.body.data
        }

        const dto = this.usersTransformation.transformSignup(data)

        this.usersValidation.validateSignup(dto)
        await this.usersValidation.canUserCreate(dto.username, dto.email)

        const user = await this.usersController.signup(dto)

        return res
          .status(201)
          .json({
            message: 'Success',
            errors: null,
            data: user
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

    this.router.post('/signin', async (req, res) => {
      try {
        const dto = this.usersTransformation.transformSignin(req.body.data)

        this.usersValidation.validateSignin(dto)

        const user = await this.usersController.signin(dto)

        return res
          .json({
            message: user?.token?.otp ? 'User is not activated' : 'Success',
            errors: null,
            data: user
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

    this.router.post('/:id/verifications', async (req, res) => {
      try {
        const dto = {
          id: +req.params.id,
          otp: req.body.data.otp
        }

        this.usersValidation.validateVerification(dto)

        const user = await this.usersController.verify(dto)

        return res
          .json({
            message: 'Success',
            errors: null,
            data: user
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
