'use strict'

var jwt = require('jsonwebtoken')
var sharedSecret = 'jinong.co.kr&opensource'
var issuer = 'opensource'

exports.Bearer = function (req, authOrSecDef, token, callback) {
  
  // return callback(null)

  var currentScopes = req.swagger.operation['x-security-scopes']

  function sendError() {
    //return req.res.status(403).json({ message: 'Access Denied' })
    return new Error('access denied!')
  }

  if (token && token.indexOf('Bearer ') === 0) {
    var tokenString = token.split(' ')[1]

    jwt.verify(tokenString, sharedSecret, function (
      verificationError,
      decodedToken
    ) {
      if (
        verificationError == null &&
        decodedToken &&
        decodedToken.privilege
      ) {
        var privilegeMatch = true
        if (Array.isArray(currentScopes)) {
          privilegeMatch = currentScopes.indexOf(decodedToken.privilege) !== -1
        }

        var issuerMatch = decodedToken.iss === issuer

        if (privilegeMatch && issuerMatch) {
          req.auth = decodedToken
          return callback(null)
        } else {
          return callback(sendError())
        }
      } else {
        if (jwt.TokenExpiredError.name === verificationError.name) {
          // return callback( new Error('toekn expired'))
          // return callback({ code: 'Custom_application_error_code', statusCode: 401 })
          return req.res.status(401).json({ message: 'toekn expired' })
        } else {
          return callback(sendError())
        }
      }
    })
  } else {
    return callback(sendError())
  }
}

exports.createToken = function (obj) {
  obj.iss = issuer
  var token = jwt.sign(obj, sharedSecret, { expiresIn: '24h' })
  return token
}

exports.refreshToken = function (obj) {
  obj.iss = issuer
  var token = jwt.sign(obj, sharedSecret, { expiresIn: '31d' })
  return token
}
