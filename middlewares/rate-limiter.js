const { redisClient } = require('../config');

const MAX_BUCKET_SIZE = 10; // Maximum number of tokens in the bucket
const TOKEN_RATE_PER_SECOND = 1; // Tokens added to the bucket per second

const rateLimiter = async (req, res, next) => {
  try {
    if (!redisClient) {
      throw new Error('Redis client does not exist!');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds

    // Retrieve or initialize the token bucket from Redis
    let bucket = await redisClient.get(req.ip);
    bucket = bucket
      ? JSON.parse(bucket)
      : { tokens: MAX_BUCKET_SIZE, lastRefillTimestamp: currentTimestamp };

    // Calculate the elapsed time since the last token refill
    const elapsedTime = currentTimestamp - bucket.lastRefillTimestamp;

    // Refill the bucket with tokens based on the elapsed time
    const tokensToAdd = elapsedTime * TOKEN_RATE_PER_SECOND;
    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, MAX_BUCKET_SIZE);

    // Check if there are enough tokens to allow the request
    if (bucket.tokens >= 1) {
      // Consume a token and update the bucket
      bucket.tokens--;
      await redisClient.set(req.ip, JSON.stringify(bucket));
      next();
    } else {
      // Not enough tokens available, return 429 Too Many Requests response
      res
        .status(429)
        .send({ message: 'Too many requests. Please try again later.' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  rateLimiter,
};
