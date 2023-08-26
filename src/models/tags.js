import QueryBuilder from '../helpers/query_builder.js'
import formatQuery from '../helpers/format_query.js'

export default class Tags {
  static instance
  tableName = 'tags'

  constructor(pgClient, logger, tasksTagsModel) {
    this.pgClient = pgClient
    this.logger = logger
    this.tags = new QueryBuilder(this.tableName)
    this.tasksTagsModel = tasksTagsModel
  }

  static getInstance(pgClient, logger, tasksTagsModel) {
    if (!Tags.instance) {
      Tags.instance = new Tags(pgClient, logger, tasksTagsModel)
    }

    return Tags.instance
  }

  async createTable() {
    try {
      await this.pgClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          user_id INTEGER REFERENCES users (id) NOT NULL,
          created_at TIMESTAMP
        );
      `)
    } catch (err) {
      throw err
    }
  }

  async getOneTagByID(id) {
    try {
      const query = this.tags
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

  async getOneTag(filters = {}) {
    try {
      if (filters?.user_id !== null && filters?.user_id !== undefined) {
        const { eq } = filters.user_id
        if (eq !== null && eq !== undefined) {
          this.tags.eq('user_id', eq)
        }
      }

      if (filters?.name !== null && filters?.name !== undefined) {
        const { regex } = filters.name
        if (regex !== null && regex !== undefined) {
          this.tags.regex('name', regex)
        }
      }

      const query = this.tags
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

  async createManyTags(datas = []) {
    try {
      // FIXME: regex not working with vietnamese
      let existingTags = await Promise.all(datas.map(data =>
        this.getOneTag({
          name: { regex: data.name },
          user_id: { eq: data.user_id }
        })
      ))

      existingTags.forEach((existingTag, index) => {
        if (existingTag && existingTag.id) {
          datas[index] = {
            ...existingTag,
            task_id: datas[index].task_id
          }
        }
      })

      // mark existing tags into datas
      const insertTagsData = datas
        .reduce((acc, data) =>
          acc += data.id === undefined
            ? `('${data.name}', ${data.user_id}, NOW()),`
            : '',
          '')
        .slice(0, -1)

      // create tags
      if (insertTagsData.length > 0) {
        const query = formatQuery(`
          INSERT INTO
          ${this.tableName} (
            name,
            user_id,
            created_at
          )
          VALUES
            ${insertTagsData}
          RETURNING *;
        `)

        this.logger.info(query)
        const resp = await this.pgClient.query(query)
        const createdTags = resp.rows || []

        // mark created tags into datas
        let i = 0
        datas = datas.map((data, index) => {
          if (data.id === undefined) {
            data = {
              ...createdTags[i],
              task_id: data.task_id
            }
            existingTags[index] = createdTags[i]
            i++
          }
          return data
        })
      }

      const existingTasksTags = await this.tasksTagsModel.getManyTasksTags({
        tag_id: {
          in: datas.map(data => data.id)
        },
        task_id: {
          in: datas.map(data => data.task_id)
        }
      })

      const createManyTasksTagsDatas = datas.reduce((acc, data) => {
        if (
          !existingTasksTags.find(existingTaskTag =>
            existingTaskTag.tag_id === data.id
            && existingTaskTag.task_id === data.task_id)
        ) {
          acc.push({
            tag_id: data.id,
            task_id: data.task_id
          })
        }
        return acc
      }, [])

      await this.tasksTagsModel.createManyTasksTags(createManyTasksTagsDatas)
      return existingTags
    } catch (err) {
      this.logger.error(err)
      return []
    }
  }

  async deleteManyTags(filters = {}) {
    try {
      if (filters?.user_id !== null && filters?.user_id !== undefined) {
        const { eq } = filters.user_id
        if (eq !== null && eq !== undefined) {
          this.tags.eq('user_id', eq)
        }
      }

      if (filters?.id !== null && filters?.id !== undefined) {
        const { in: include } = filters.id
        if (include !== null && include !== undefined) {
          this.tags.in('id', include)
        }
      }

      const conds = this.tags.conditions()

      // to reset
      this.tags.build()

      const query = formatQuery(`DELETE FROM ${this.tableName} ${conds} RETURNING *;`)

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      return resp.rows ?? []
    } catch (err) {
      this.logger.error(err)
      return []
    }
  }
}
