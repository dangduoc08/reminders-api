import { Router } from 'express'

export default class Tasks {
  static _instance

  constructor(tasksController, tasksValidation, tasksTransformation) {
    this.tasksController = tasksController
    this.tasksValidation = tasksValidation
    this.tasksTransformation = tasksTransformation
    this.router = Router()
  }

  static getInstance(tasksController, tasksValidation, tasksTransformation) {
    if (!Tasks._instance) {
      Tasks._instance = new Tasks(
        tasksController,
        tasksValidation,
        tasksTransformation)
    }
    return Tasks._instance
  }

  serve() {
    this.router.post('/:list_id/tasks', async (req, res) => {
      try {
        const dto = await this.tasksTransformation.transformCreate({
          user_id: req.user.id,
          list_id: req.params.list_id,
          ...req.body.data
        })

        await this.tasksValidation.validateCreate(dto)
        const task = await this.tasksController.create(dto)

        return res
          .status(201)
          .json({
            message: 'Success',
            errors: null,
            data: task
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

    this.router.get('/:list_id/tasks', async (req, res) => {
      try {
        const dto = await this.tasksTransformation.transformList({
          user_id: req.user.id,
          list_id: req.params.list_id,
          ...req.query
        })

        await this.tasksValidation.validateList(dto)

        const tasks = await this.tasksController.list(dto)

        return res
          .json({
            message: 'Success',
            errors: null,
            data: tasks
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

    this.router.put('/:list_id/tasks/:id', async (req, res) => {
      try {
        const dto = await this.tasksTransformation.transformUpdate({
          list_id: req.params.list_id,
          user_id: req.user.id,
          id: req.params.id,
          ...req.body.data
        })

        await this.tasksValidation.validateUpdate(dto)

        const task = await this.tasksController.update(dto)

        return res
          .json({
            message: 'Success',
            errors: null,
            data: task
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
