const express = require('express');

const { rateLimiter } = require('./middlewares/rate-limiter');
const { connectRedis } = require('./config');

const app = express();

app.set('trust proxy', true);
app.use(express.json());
app.use(rateLimiter);

app.get('/', (req, res) => {
  try {
    return res.json({ msg: 'ok' });
  } catch (error) {
    return res.send({ error });
  }
});

app.listen(4000, () => {
  connectRedis();
  console.log('Server running at PORT:4000');
});
