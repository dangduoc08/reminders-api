import jwt from 'jsonwebtoken'

function authenticate(from, secret) {
  return (req, res, next) => {
    let token = req
    for (const key of from.split('.')) {
      if (!token[key]) {
        token = null
        break
      }
      token = token[key]
    }

    if (!token || typeof token !== 'string') {
      return res
        .status(401)
        .json({
          message: 'Unauthorized',
          errors: [
            'Authentication failed.'
          ],
          data: null,
        })
    }

    jwt.verify(token.trim(), secret, (err, user) => {
      if (err !== null) {
        return res
          .status(401)
          .json({
            message: 'Unauthorized',
            errors: [
              err?.message || 'Authentication failed.'
            ],
            data: null,
          })

      }

      req.user = user
      next()
    })
  }
}

export default authenticate