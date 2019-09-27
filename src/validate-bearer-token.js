const logger = require('./logger');

function validateBearerToken(req,res,next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if(!authToken || apiToken !== authToken.split(' ')[1]) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(404).json( {error: 'Unauthorized request' });
  }
  next();
}

module.exports = validateBearerToken;