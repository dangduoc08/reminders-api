function formatQuery(query) {
  return query.trim().replace(/\s+/g, ' ').replaceAll('\n', '')
}

export default formatQuery