

const analysisRoute = require('express').Router();
const _ = require('lodash');
const {AnalysisService} = require('../../../utils/analysis-service/analysis.service');
const { LoggerService, LogStream } = require('../../../utils/logger-service/logger.service');
// set logger service object
const logger = new LoggerService(LogStream.CONSOLE);



analysisRoute.post('/', async (req, res) => {
    logger.info('POST: /analysis', 'Enter');

    const analysisBody = _.pick(req.body, ['id', 'code']); 
    console.log(JSON.stringify(analysisBody, undefined, 2));
    logger.info('POST: /analysis', 'log req body', { param : analysisBody});
    const analysisService = new AnalysisService();
    try {
        console.log('before analysisProcces');
        const analysisRes = await analysisService.analysisProcces(analysisBody.id, analysisBody.code);
        logger.info('POST: /analysis', 'Exit', { param : analysisRes});
        return res.send({data: analysisRes});
    } catch(error) {
        return res.status(400).send(error);
    }

});

module.exports = {
    analysisRoute
}