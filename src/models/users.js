import QueryBuilder from '../helpers/query_builder.js'
import formatQuery from '../helpers/format_query.js'
import {
  USER_STATUSES
} from '../constants/index.js'

export default class Users {
  static _instance
  tableName = 'users'

  constructor(pgClient, logger) {
    this.pgClient = pgClient
    this.logger = logger
    this.users = new QueryBuilder(this.tableName)
  }

  static getInstance(pgClient, logger) {
    if (!Users._instance) {
      Users._instance = new Users(pgClient, logger)
    }
    return Users._instance
  }

  async createTable() {
    try {
      await this.pgClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          dob TIMESTAMP NOT NULL,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR NOT NULL UNIQUE,
          hash VARCHAR NOT NULL,
          status user_status NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        );
      `)
    } catch (err) {
      throw err
    }
  }

  async getOneUserByID(id) {
    try {
      const query = this.users
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

  async getOneUser(filters = {}) {
    try {
      if (filters?.username !== null && filters?.username !== undefined) {
        const { eq } = filters.username
        if (eq !== null && eq !== undefined) {
          this.users.eq('username', eq)
        }
      }

      if (filters?.email !== null && filters?.email !== undefined) {
        const { eq } = filters.email
        if (eq !== null && eq !== undefined) {
          this.users.eq('email', eq)
        }
      }

      const query = this.users
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

  async createOneUser(data = {}) {
    try {
      const {
        first_name,
        last_name,
        dob,
        email,
        username,
        hash,
      } = data

      const query = formatQuery(`
        INSERT INTO users(
          first_name,
          last_name,
          dob,
          email,
          username,
          hash,
          status,
          created_at,
          updated_at
        )  
        VALUES (
          '${first_name}',
          '${last_name}',
          '${dob}',
          '${email}',
          '${username}',
          '${hash}',
          '${USER_STATUSES.UNVERIFIED}',
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

  async updateOneUserByID(id, { status }) {
    try {
      const query = formatQuery(`
        UPDATE users
        SET
          status = '${status}',
          updated_at = NOW()
        WHERE id = ${id}
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
