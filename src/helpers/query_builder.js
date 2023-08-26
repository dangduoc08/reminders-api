import formatQuery from './format_query.js'

class QueryBuilder {
  constructor(table) {
    this._table = table
    this._logical = 'AND'
    this._selections = []
    this._filters = []
    this._groups = []
    this._orders = []
    this._joins = []
    this._limit = 'ALL'
    this._offset = null
  }

  select(key) {
    this._selections.push(key)
    return this
  }

  and() {
    this._logical = 'AND'
    return this
  }

  or() {
    this._logical = 'OR'
    return this
  }

  eq(key, value) {
    const filter = {
      [`${key} = `]: value
    }

    this._filters.push(filter)
    return this
  }

  gt(key, value) {
    const filter = {
      [`${key} > `]: value
    }

    this._filters.push(filter)
    return this
  }

  lt(key, value) {
    const filter = {
      [`${key} < `]: value
    }

    this._filters.push(filter)
    return this
  }

  gte(key, value) {
    const filter = {
      [`${key} >= `]: value
    }

    this._filters.push(filter)
    return this
  }

  lte(key, value) {
    const filter = {
      [`${key} <= `]: value
    }

    this._filters.push(filter)
    return this
  }

  ne(key, value) {
    const filter = {
      [`${key} != `]: value
    }

    this._filters.push(filter)
    return this
  }

  in(key, values) {
    const filter = {
      [`${key} IN `]: `( ${values
        .map(value => typeof value === 'string' ? `'${value}'` : value)
        .join(', ')} )`
    }

    this._filters.push(filter)
    return this
  }

  regex(key, value) {
    const filter = {
      [`${key} ~* `]: value
    }

    this._filters.push(filter)
    return this
  }

  leftJoin(conds) {
    this._joins.push({
      type: 'LEFT JOIN',
      ...conds
    })

    return this
  }

  order(key, value) {
    const order = {
      [key]: value
    }

    this._orders.push(order)
    return this
  }

  group(key) {
    this._groups.push(key)
    return this
  }


  limit(limit) {
    this._limit = limit
    return this
  }

  offset(offset) {
    this._offset = offset
    return this
  }

  conditions() {
    return this._filters.length <= 0
      ? ''
      : this._filters.reduce((prevQuery, currentQuery, index) => {
        let cond = ''
        for (const key in currentQuery) {
          let value = currentQuery[key]

          if (!value) {
            cond = key + 'NULL'
          } else {
            if (typeof value === 'string' && !key.includes(' IN ')) {
              value = `'${value}'`
            }
            cond = key + value
          }
        }

        if (index < this._filters.length - 1) {
          cond += ' ' + this._logical + ' '
        }

        prevQuery += cond
        return prevQuery
      }, ' WHERE ')
  }

  build() {
    let selectedFields = '*'
    if (this._selections.length > 0) {
      selectedFields = this._selections.join(', ')
    }

    let queries = `SELECT ${selectedFields} FROM ${this._table}`

    if (this._joins.length > 0) {
      queries += this._joins.reduce((acc, { type, from, as, localField, foreignField }) =>
        acc += ` ${type} ${from} AS ${as || from} ON ${localField} = ${as || from}.${foreignField}`
        , '')
    }

    queries += this.conditions()

    if (this._groups.length > 0) {
      queries += ` GROUP BY ${this._groups.join(', ')}`
    }

    if (this._orders.length > 0) {
      queries += ' ORDER BY '
      this._orders.forEach((orderObj, index) => {
        for (const key in orderObj) {
          const value = orderObj[key]
          if (index < this._orders.length - 1) {
            queries += `${key} ${value}, `
          } else {
            queries += `${key} ${value}`
          }
        }
      })
    }

    queries += ` LIMIT ${this._limit}`

    if (typeof this._offset === 'number') {
      queries += ` OFFSET ${this._offset}`
    }

    // reset filters
    this._logical = 'AND'
    this._filters.length = 0
    this._groups.length = 0
    this._selections.length = 0
    this._orders.length = 0
    this._joins.length = 0
    this._limit = 'ALL'
    this._offset = null

    queries += ';'
    return formatQuery(queries)
  }
}

export default QueryBuilder