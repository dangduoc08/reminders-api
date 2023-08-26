import QueryBuilder from '../helpers/query_builder.js'
import formatQuery from '../helpers/format_query.js'
import {
  LIST_STATUSES
} from '../constants/index.js'

export default class Lists {
  static instance
  tableName = 'lists'

  constructor(pgClient, logger) {
    this.pgClient = pgClient
    this.logger = logger
    this.lists = new QueryBuilder(this.tableName)
  }

  static getInstance(pgClient, logger) {
    if (!Lists.instance) {
      Lists.instance = new Lists(pgClient, logger)
    }

    return Lists.instance
  }

  async createTable() {
    try {
      await this.pgClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          status list_status NOT NULL,
          title_color VARCHAR(7),
          user_id INTEGER REFERENCES users (id) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        );
      `)
    } catch (err) {
      throw err
    }
  }

  async getOneListByID(id) {
    try {
      const query = this.lists
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

  async getOneList(filters) {
    try {
      if (filters?.id !== null && filters?.id !== undefined) {
        const { eq } = filters.id
        if (eq !== null && eq !== undefined) {
          this.lists.eq('id', eq)
        }
      }

      if (filters?.user_id !== null && filters?.user_id !== undefined) {
        const { eq } = filters.user_id
        if (eq !== null && eq !== undefined) {
          this.lists.eq('user_id', eq)
        }
      }

      const query = this.lists
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

  async getManyLists(filters = {}) {
    try {
      if (filters?.user_id !== null && filters?.user_id !== undefined) {
        const { eq } = filters.user_id
        if (eq !== null && eq !== undefined) {
          this.lists.eq('user_id', eq)
        }
      }

      if (
        filters?.limit !== null &&
        filters?.limit !== undefined &&
        typeof filters.limit === 'number'
      ) {
        this.lists.limit(filters.limit)
      }


      if (
        filters?.offset !== null &&
        filters?.offset !== undefined &&
        typeof filters.offset === 'number'
      ) {
        this.lists.offset(filters.offset)
      }

      if (filters?.sort !== null && filters?.sort !== undefined) {
        for (const key in filters.sort) {
          this.lists.order(key, filters.sort[key])
        }
      }

      const query = this.lists.build()

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      return resp.rows ?? []
    } catch (err) {
      this.logger.error(err)
      return []
    }
  }

  async createOneList({
    user_id,
    title,
    title_color = null
  }) {
    try {
      if (title_color) {
        title_color = `'${title_color}'`
      }

      const query = formatQuery(`
        INSERT INTO
        lists (
          title,
          title_color,
          user_id,
          status,
          created_at,
          updated_at
        )
        VALUES (
          '${title}',
          ${title_color},
          ${user_id},
          '${LIST_STATUSES.UNFINISHED}',
          NOW(),
          NOW()
        )
        RETURNING *;
      `)

      this.logger.info(query)
      const resp = await this.pgClient.query(query)
      return resp.rows?.[0] ?? null
    } catch (err) {
      this.logger.error(err)
      return null
    }
  }
}
