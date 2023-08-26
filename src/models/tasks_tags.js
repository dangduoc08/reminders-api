import QueryBuilder from '../helpers/query_builder.js'
import formatQuery from '../helpers/format_query.js'

export default class TasksTags {
  static instance
  tableName = 'tasks_tags'

  constructor(pgClient, logger) {
    this.pgClient = pgClient
    this.logger = logger
    this.tasks_tags = new QueryBuilder(this.tableName)
  }

  static getInstance(pgClient, logger) {
    if (!TasksTags.instance) {
      TasksTags.instance = new TasksTags(pgClient, logger)
    }

    return TasksTags.instance
  }

  async createTable() {
    try {
      await this.pgClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          task_id INTEGER REFERENCES tasks (id) NOT NULL,
          tag_id INTEGER REFERENCES tags (id) NOT NULL,
          PRIMARY KEY (task_id, tag_id)
        );
      `)
    } catch (err) {
      throw err
    }
  }

  async getManyTasksTags(filters = {}) {
    try {
      if (filters?.task_id !== null && filters?.task_id !== undefined) {
        const { eq } = filters.task_id
        if (eq !== null && eq !== undefined) {
          this.tasks_tags.eq('task_id', eq)
        }

        const { in: include } = filters.task_id
        if (include !== null && include !== undefined) {
          this.tasks_tags.in('task_id', include)
        }
      }

      if (filters?.tag_id !== null && filters?.tag_id !== undefined) {
        const { in: include } = filters.tag_id
        if (include !== null && include !== undefined) {
          this.tasks_tags.in('tag_id', include)
        }
      }

      const query = this.tasks_tags.build()

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      return resp.rows ?? []
    } catch (err) {
      this.logger.error(err)
      return []
    }
  }

  async createManyTasksTags(datas = []) {
    try {
      const insertTasksTagsData = datas
        .reduce((acc, { task_id, tag_id }) =>
          acc += `(${task_id}, ${tag_id}),`,
          '')
        .slice(0, -1)

      if (insertTasksTagsData.length > 0) {
        const query = formatQuery(`
          INSERT INTO
          ${this.tableName} (
            task_id,
            tag_id
          )
          VALUES
            ${insertTasksTagsData}
          RETURNING *;
        `)

        this.logger.info(query)
        const resp = await this.pgClient.query(query)
        return resp.rows ?? []
      }

      return []
    } catch (err) {
      this.logger.error(err)
      return []
    }
  }

  async deleteManyTasksTags(filters = {}) {
    try {
      if (filters?.task_id !== null && filters?.task_id !== undefined) {
        const { eq } = filters.task_id
        if (eq !== null && eq !== undefined) {
          this.tasks_tags.eq('task_id', eq)
        }

        const { in: include } = filters.task_id
        if (include !== null && include !== undefined) {
          this.tasks_tags.in('task_id', include)
        }
      }

      if (filters?.tag_id !== null && filters?.tag_id !== undefined) {
        const { in: include } = filters.tag_id
        if (include !== null && include !== undefined) {
          this.tasks_tags.in('tag_id', include)
        }
      }

      const conds = this.tasks_tags.conditions()

      // to reset
      this.tasks_tags.build()

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
