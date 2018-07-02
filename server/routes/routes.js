const routes = require('express').Router();
const {analysisRoute} = require('./analysis/analysis.route');
const {questionsRoute} = require('./questions/questions.route');

// connecting all sub routes
routes.use('/analysis', analysisRoute);
routes.use('/questions', questionsRoute);

module.exports = {
    routes
}