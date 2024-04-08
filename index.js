const express = require('express');

const { rateLimiter } = require('./middlewares/rate-limiter');

const app = express();

app.use(express.json());
app.use(rateLimiter);

app.get('/', (req, res)=> {
  try {
    return res.send('ok');
  } catch (error) {
    throw Error(error);
  }
});

app.listen(4000, () => console.log('Server running at PORT:4000'));

// https://blog.logrocket.com/rate-limiting-node-js/