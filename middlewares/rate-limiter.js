const moment = require('moment');
const redis = require('redis');

const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis client error: ', err));

const WINDOW_SIZE_IN_MINUTE = 4;
const MAX_WINDOW_REQUEST_COUNT = 10;
const WINDOW_LOG_INTERVAL_IN_MINUTE = 5;

const rateLimiter = async (req, res, next) => {
  await redisClient.connect();

  try {
    if (!redisClient) {
      throw new Error('Redis client does not exist!');
    }
    const record = await redisClient.get(req.ip);
    const currentRequestTime = moment();

    console.log('🚀 ~ rateLimiter ~ record:', record);

    if (record == null) {
      let newRecord = [];
      let requestLog = {
        requestTimeStamp: currentRequestTime.unix(),
        requestCount: 1,
      };
      newRecord.push(requestLog);
      await redisClient.set(req.ip, JSON.stringify(newRecord));
      next();
    }

    let data = JSON.parse(record);
    let windowStartTimestamp = moment()
      .subtract(WINDOW_SIZE_IN_MINUTE, 'minute')
      .unix();
    let requestsWithinWindow = data.filter((entry) => {
      return entry.requestTimeStamp > windowStartTimestamp;
    });
    console.log(
      '🚀 ~ requestsWithinWindow ~ requestsWithinWindow:',
      requestsWithinWindow
    );
    let totalWindowRequestsCount = requestsWithinWindow.reduce(
      (accumulator, entry) => {
        return accumulator + entry.requestCount;
      },
      0
    );

    if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
      res
        .status(429)
        .jsend.error(
          `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_MINUTE} minute limit!`
        );
    } else {
      let lastRequestLog = data[data.length - 1];
      let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
        .subtract(WINDOW_LOG_INTERVAL_IN_MINUTE, 'minute')
        .unix();
      if (
        lastRequestLog.requestTimeStamp >
        potentialCurrentWindowIntervalStartTimeStamp
      ) {
        lastRequestLog.requestCount++;
        data[data.length - 1] = lastRequestLog;
      } else {
        data.push({
          requestTimeStamp: currentRequestTime.unix(),
          requestCount: 1,
        });
      }
      await redisClient.set(req.ip, JSON.stringify(data));
      next();
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  rateLimiter
}