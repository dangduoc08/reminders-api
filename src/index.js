import express from 'express'
import pino from 'pino'
import pretty from 'pino-pretty'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import pg from 'pg'
import NodeCache from 'node-cache'
import authenticate from './middlewares/authenticate.js'
import initType from './helpers/init_type.js'
import UsersModel from './models/users.js'
import ListsModel from './models/lists.js'
import TasksModel from './models/tasks.js'
import TagsModel from './models/tags.js'
import TasksTagsModel from './models/tasks_tags.js'
import MailsController from './controllers/mails.js'
import UsersController from './controllers/users.js'
import ListsController from './controllers/lists.js'
import TasksController from './controllers/tasks.js'
import MessagesController from './controllers/messages.js'
import TokensController from './controllers/tokens.js'
import UsersAPI from './apis/users.js'
import ListsAPI from './apis/lists.js'
import TasksAPI from './apis/tasks.js'
import MessagesAPI from './apis/messages.js'
import TokensAPI from './apis/tokens.js'
import UsersValidation from './validations/users.js'
import ListsValidation from './validations/lists.js'
import TasksValidation from './validations/tasks.js'
import MessagesValidation from './validations/messages.js'
import UsersTransformation from './transformations/users.js'
import ListsTransformation from './transformations/lists.js'
import TasksTransformation from './transformations/tasks.js'
import MessagesTransformation from './transformations/messages.js'
import {
  USER_STATUSES,
  LIST_STATUSES,
  TASK_STATUSES,
  PRIORITIES
} from './constants/index.js'

process.env.TZ = 'Etc/UCT'

async function main() {
  const logger = pino(pretty())
  try {
    process.on('uncaughtException', err => {
      logger.error(err)
    })

    const app = express()

    const nodeCache = new NodeCache()

    const pgClient = new pg.Client({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: process.env.POSTGRES_SSL === 'true'
    })
    await pgClient.connect()
    await Promise.all([
      initType(pgClient, 'priority', PRIORITIES),
      initType(pgClient, 'user_status', USER_STATUSES),
      initType(pgClient, 'list_status', LIST_STATUSES),
      initType(pgClient, 'task_status', TASK_STATUSES)
    ])

    const mailsController = MailsController.getInstance(logger)

    const usersModel = UsersModel.getInstance(pgClient, logger)
    const usersValidation = UsersValidation.getInstance(usersModel)
    const usersTransformation = UsersTransformation.getInstance()
    const usersController = UsersController.getInstance(
      usersModel,
      mailsController,
      nodeCache
    )
    const usersAPI = UsersAPI.getInstance(
      usersController,
      usersValidation,
      usersTransformation
    )

    const listsModel = ListsModel.getInstance(pgClient, logger)
    const listsValidation = ListsValidation.getInstance()
    const listsTransformation = ListsTransformation.getInstance()
    const listsController = ListsController.getInstance(
      listsModel
    )
    const listsAPI = ListsAPI.getInstance(
      listsController,
      listsValidation,
      listsTransformation
    )

    const tasksTagsModel = TasksTagsModel.getInstance(pgClient, logger)

    const tagsModel = TagsModel.getInstance(pgClient, logger, tasksTagsModel)

    const tasksModel = TasksModel.getInstance(pgClient, tagsModel, logger, tasksTagsModel)
    const tasksValidation = TasksValidation.getInstance(
      tasksModel,
      listsModel
    )
    const tasksTransformation = TasksTransformation.getInstance()
    const tasksController = TasksController.getInstance(
      tasksModel
    )
    const tasksAPI = TasksAPI.getInstance(
      tasksController,
      tasksValidation,
      tasksTransformation
    )

    const messagesValidation = MessagesValidation.getInstance()
    const messagesTransformation = MessagesTransformation.getInstance()
    const messagesController = MessagesController.getInstance(
      mailsController,
      nodeCache,
      usersModel
    )
    const messagesAPI = MessagesAPI.getInstance(
      messagesController,
      messagesValidation,
      messagesTransformation
    )

    const tokensController = TokensController.getInstance(
      usersModel
    )
    const tokensAPI = TokensAPI.getInstance(tokensController)

    await usersModel.createTable()
    await listsModel.createTable()
    await tagsModel.createTable()
    await tasksModel.createTable()
    await tasksTagsModel.createTable()

    app
      .use(cors(), helmet(), morgan('dev'), bodyParser.json(), cookieParser())
      .use('/v1/auths', usersAPI.serve())
      .use('/v1/tokens', tokensAPI.serve())
      .use('/v1/messages', messagesAPI.serve())
      .use('/v1/lists', authenticate('cookies.token', process.env.ACCESS_TOKEN_SECRET), listsAPI.serve(), tasksAPI.serve())

    app.listen(
      process.env.PORT,
      () => logger.info(`App running on port ${process.env.PORT}`)
    )
  } catch (err) {
    logger.error(err)
  }
}

main()