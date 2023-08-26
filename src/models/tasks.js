import QueryBuilder from '../helpers/query_builder.js'
import formatQuery from '../helpers/format_query.js'
import {
  TASK_STATUSES,
  PRIORITIES
} from '../constants/index.js'

export default class Tasks {
  static _instance
  tableName = 'tasks'

  constructor(pgClient, tagsModel, logger, tasksTagsModel) {
    this.pgClient = pgClient
    this.tagsModel = tagsModel
    this.logger = logger
    this.tasks = new QueryBuilder(this.tableName)
    this.tasksTagsModel = tasksTagsModel
  }

  static getInstance(pgClient, tagsModel, logger, tasksTagsModel) {
    if (!Tasks._instance) {
      Tasks._instance = new Tasks(pgClient, tagsModel, logger, tasksTagsModel)
    }

    return Tasks._instance
  }

  async createTable() {
    try {
      await this.pgClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          content TEXT,
          status task_status NOT NULL,
          priority priority NOT NULL,
          pos INTEGER NOT NULL,
          url TEXT,
          url_icon TEXT,
          list_id INTEGER REFERENCES lists (id) NOT NULL,
          user_id INTEGER REFERENCES users (id) NOT NULL,
          notify_at TIMESTAMP,
          created_at TIMESTAMP  NOT NULL,
          updated_at TIMESTAMP  NOT NULL
        );
      `)
    } catch (err) {
      throw err
    }
  }

  async getOneTaskByID(id) {
    try {
      const query = this.tasks
        .eq('id', id)
        .limit(1)
        .build()

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      return resp.rows?.[0] ?? null
    } catch (err) {
      this.logger.error(err)
      return null
    }
  }

  async getOneTask(filters = {}) {
    try {
      if (filters?.id !== null && filters?.id !== undefined) {
        const { eq } = filters.id
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('id', eq)
        }
      }

      if (filters?.user_id !== null && filters?.user_id !== undefined) {
        const { eq } = filters.user_id
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('user_id', eq)
        }
      }

      if (filters?.list_id !== null && filters?.list_id !== undefined) {
        const { eq } = filters.list_id
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('list_id', eq)
        }
      }

      const query = this.tasks
        .limit(1)
        .build()

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      return resp.rows?.[0] ?? null
    } catch (err) {
      this.logger.error(err)
      return null
    }
  }

  async createOneTask({
    user_id,
    title,
    list_id,
    content,
    priority = PRIORITIES.NONE,
    url,
    notify_at,
    pos,
    tags
  }) {
    try {
      if (content) {
        content = `'${content}'`
      } else {
        content = null
      }

      if (notify_at) {
        notify_at = `'${notify_at}'`
      } else {
        notify_at = null
      }

      let url_icon = null
      if (url) {
        // TODO: get favicon
        // const resp = await fetch(url)
        // const data = await resp.text()
        // if (data) {
        //   const $ = cheerio.load(data)
        //   $
        // }

        url = `'${url}'`
        url_icon = `''`
      } else {
        url = null
        url_icon = null
      }

      // FIXME: need to add transactions
      const query = formatQuery(`
        INSERT INTO tasks (
          title,
          content,
          priority,
          status,
          url,
          url_icon,
          notify_at,
          pos,
          user_id,
          list_id,
          created_at,
          updated_at
        )
        VALUES (
          '${title}',
          ${content},
          '${priority}',
          '${TASK_STATUSES.UNFINISHED}',
          ${url},
          ${url_icon},
          ${notify_at},
          ${pos},
          ${user_id},
          ${list_id},
          NOW(),
          NOW()
        )
        RETURNING *;
      `)

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      const task = resp.rows?.[0] ?? null

      if (task && task.id !== undefined && tags && tags.length > 0) {
        task.tags = []
        if (tags.length > 0) {
          const createManyTagsData = tags.map(tag => ({
            name: tag,
            user_id: user_id,
            task_id: task.id
          }))

          task.tags = await this.tagsModel.createManyTags(createManyTagsData)
        }
      } else {
        task.tags = null
      }

      return task
    } catch (err) {
      this.logger.error(err)
      return null
    }
  }

  async getManyTasks(filters = {}) {
    try {
      if (filters?.user_id !== null && filters?.user_id !== undefined) {
        const { eq } = filters.user_id
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('user_id', eq)
        }
      }

      if (filters?.list_id !== null && filters?.list_id !== undefined) {
        const { eq } = filters.list_id
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('list_id', eq)
        }
      }

      if (filters?.status !== null && filters?.status !== undefined) {
        const { eq, ne } = filters.status
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('status', eq)
        }

        if (ne !== null && ne !== undefined) {
          this.tasks.ne('status', ne)
        }
      }

      if (
        filters?.limit !== null &&
        filters?.limit !== undefined &&
        typeof filters.limit === 'number'
      ) {
        this.tasks.limit(filters.limit)
      }


      if (
        filters?.offset !== null &&
        filters?.offset !== undefined &&
        typeof filters.offset === 'number'
      ) {
        this.tasks.offset(filters.offset)
      }

      if (filters?.sort !== null && filters?.sort !== undefined) {
        for (const key in filters.sort) {
          this.tasks.order(key, filters.sort[key])
        }
      }

      const query = this.tasks.build()

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      return resp.rows ?? []
    } catch (err) {
      this.logger.error(err)
      return []
    }
  }

  async getManyTasksJoinTags(filters) {
    try {
      if (filters?.user_id !== null && filters?.user_id !== undefined) {
        const { eq } = filters.user_id
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('user_id', eq)
        }
      }

      if (filters?.list_id !== null && filters?.list_id !== undefined) {
        const { eq } = filters.list_id
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('list_id', eq)
        }
      }

      if (filters?.status !== null && filters?.status !== undefined) {
        const { eq, ne } = filters.status
        if (eq !== null && eq !== undefined) {
          this.tasks.eq('status', eq)
        }

        if (ne !== null && ne !== undefined) {
          this.tasks.ne('status', ne)
        }
      }

      if (
        filters?.limit !== null &&
        filters?.limit !== undefined &&
        typeof filters.limit === 'number'
      ) {
        this.tasks.limit(filters.limit)
      }


      if (
        filters?.offset !== null &&
        filters?.offset !== undefined &&
        typeof filters.offset === 'number'
      ) {
        this.tasks.offset(filters.offset)
      }

      if (filters?.sort !== null && filters?.sort !== undefined) {
        for (const key in filters.sort) {
          this.tasks.order(key, filters.sort[key])
        }
      }

      const query = this.tasks
        .select('tasks.*')
        .select(`
          array_agg(
            json_build_object(
              'id', tags.id,
              'name', tags.name,
              'user_id', tags.user_id,
              'created_at', tags.created_at
            )
          )
          FILTER(WHERE tags.id IS NOT NULL) 
          AS tags
        `)
        .leftJoin({
          from: 'tasks_tags',
          localField: 'id',
          foreignField: 'task_id',
        })
        .leftJoin({
          from: 'tags',
          localField: 'tasks_tags.tag_id',
          foreignField: 'id',
        })
        .group('tasks.id')
        .build()

      this.logger.info(query)
      const tasks = await this.pgClient.query(query)
      return tasks.rows ?? []
    } catch (err) {
      this.logger.error(err)
      return []
    }
  }

  async updateOneTaskByID(id, {
    user_id,
    title,
    content = null,
    priority,
    url = null,
    notify_at = null,
    status,
    tags = []
  }) {
    try {
      if (content) {
        content = `'${content}'`
      } else {
        content = null
      }

      if (notify_at) {
        notify_at = `'${notify_at}'`
      } else {
        notify_at = null
      }

      let url_icon = null
      if (url) {
        // TODO: get favicon
        // const resp = await fetch(url)
        // const data = await resp.text()
        // if (data) {
        //   const $ = cheerio.load(data)
        //   $
        // }

        url = `'${url}'`
        url_icon = `''`
      }

      const query = formatQuery(`
      UPDATE tasks
      SET
        title = '${title}',
        content = ${content},
        notify_at = ${notify_at},
        url = ${url},
        url_icon = ${url_icon},
        priority = '${priority}',
        status = '${status}',
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `)

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      const task = resp.rows?.[0] ?? null

      if (tags && tags.length > 0) {
        task.tags = []
        if (tags.length > 0) {
          const createManyTagsData = tags.map(tag => ({
            name: tag,
            user_id: user_id,
            task_id: id
          }))

          task.tags = await this.tagsModel.createManyTags(createManyTagsData)
        }
      } else {
        task.tags = null
      }

      const existingTasksTags = await this.tasksTagsModel.getManyTasksTags({
        task_id: {
          eq: id
        }
      })

      const needDeleteTasksTagsRelationship = existingTasksTags.filter(taskTag =>
        !task.tags?.find(tag => tag.id === taskTag.tag_id))

      if (needDeleteTasksTagsRelationship.length > 0) {
        const deletedTasksTags = await this.tasksTagsModel.deleteManyTasksTags({
          task_id: {
            in: needDeleteTasksTagsRelationship.map(taskTag => taskTag.task_id)
          },
          tag_id: {
            in: needDeleteTasksTagsRelationship.map(taskTag => taskTag.tag_id)
          }
        })

        if (deletedTasksTags.length > 0) {
          const anotherTagsRelateToTasksTags = await this.tasksTagsModel.getManyTasksTags({
            tag_id: {
              in: deletedTasksTags.map(deletedTaskTag => deletedTaskTag.tag_id)
            }
          })
          const setTagIDsNotDelete = [...new Set(
            anotherTagsRelateToTasksTags.map(v => v.tag_id)
          )]

          const needDeleteTags = deletedTasksTags
            .filter((deletedTaskTag) =>
              !setTagIDsNotDelete.includes(deletedTaskTag.tag_id)
            )
            .map(deletedTaskTag => deletedTaskTag.tag_id)

          if (needDeleteTags.length > 0) {
            await this.tagsModel.deleteManyTags({
              user_id: {
                eq: user_id
              },
              id: {
                in: needDeleteTags
              }
            })
          }
        }
      }

      return task
    } catch (err) {
      this.logger.error(err)
      return null
    }
  }
}
