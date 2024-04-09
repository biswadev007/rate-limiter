const redis = require('redis');

const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis client error: ', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected!');
  } catch (error) {
    console.log('Error connection redis: ', error);
  }
};

module.exports = {
  connectRedis,
  redisClient,
};
