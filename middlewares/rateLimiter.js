const {WINDOW_SIZE_IN_SECONDS, MAX_REQUEST} =  require("../config/rateLimiterConfig.js");
const { currentTimeInSeconds } = require("../utils/timeUtils.js");

const store = {};

function rateLimiter(req, res, next) {
    try{
        const userId = req.ip;
        const path = req.path;
        const key = `${userId}:${path}`;

        const currentTime = currentTimeInSeconds();

        if(!store[key]){
            store[key] = {
                timestamp: [currentTime]
            }
            next();
        }

        store[key].timestamp = store[key].timestamp.filter(t => currentTime - t < WINDOW_SIZE_IN_SECONDS);

        if(store[key].timestamp.length >=MAX_REQUEST){
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
            });
        }else{
            store[key].timestamp.push(currentTime);
            next();
        }

    }catch(error){
        console.error("Error in rate limiter middleware:", error);
        return res.status(500).json({
        success: false,
        message: 'Rate limiter error',
        });
    }

}

module.exports = rateLimiter;