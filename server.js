const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const logger = require('morgan');
const helmet = require('helmet');
const superagent = require('superagent');
const config = require('./config');

const app = express();

app.use(helmet());

if (config.isProd) {
  app.use(logger('combined'));
} else {
  app.use(logger('dev'));
}

app.use(bodyParser.json({ limit: '10mb'}));

app.get('/videoMeta', async (req, res) => {
  const token = req.get('X-VEZIO-RESOURCE-TOKEN');
  if (token === 'WqsNYY29Gb3zgeENTgycLceybZQFh0') {
    try {
      const vezioServerResponse = await superagent
        .get('https://vezio.work/videoMeta')
        .query({ url: req.query.url });
      res.set('Content-Type', 'application/json');
      res.status(200).send(vezioServerResponse.body);
    } catch (err) {
      console.error(err);
      const errResponse = err.response;
      res.status(errResponse.statusCode, errResponse.message);
    }
  } else {
    res.status(404).end();
  }
});

const server = http.createServer(app);

server.listen(config.port, () => {
  console.log('server listening on port', config.port);
});

