async function initType(pgClient, type, values) {
  const baseQuery = `
    DO $$ BEGIN
        IF
          NOT EXISTS (SELECT oid FROM pg_type WHERE typname = '${type}')
        THEN
          CREATE TYPE ${type} AS ENUM (${Object.values(values).map(value => `'${value}'`).join(', ')});
        END IF;
    END $$;
  `

  await pgClient.query(baseQuery)
}

export default initType