

const questionsRoute = require('express').Router();
const _ = require('lodash');
const { LoggerService, LogStream } = require('../../../utils/logger-service/logger.service');
// set logger service object
const logger = new LoggerService(LogStream.CONSOLE);



questionsRoute.get('/', async (req, res) => {
    logger.info('POST: /questionsRoute', 'Enter', req.body);
    return res.send();

});


module.exports = {
    questionsRoute
}