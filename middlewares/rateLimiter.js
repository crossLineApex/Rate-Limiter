const {WINDOW_SIZE_IN_SECONDS, MAX_REQUEST} =  require("../config/rateLimiterConfig.js");
const { currentTimeInSeconds } = require("../utils/timeUtils.js");

const store = {};

function rateLimiter(req, res, next) {
    try{
        const userId = req.ip;
        const path = req.path;
        const key = `${userId}:${path}`;

        const currentTime = currentTimeInSeconds();
        const WINDOW = Math.floor(currentTime / WINDOW_SIZE_IN_SECONDS);

        if(!store[key]){
            store[key] = {
                count: 1,
                window: WINDOW
            }
            next();
        }

        if(store[key].window === WINDOW){
            store[key].count++;

            if(store[key].count > MAX_REQUEST){
                return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                });
            } else {
                return next();
            }
        }
        store[key] = {
            count: 1,
            window: WINDOW
        }
        next();
    }catch(error){
        console.error("Error in rate limiter middleware:", error);
        return res.status(500).json({
        success: false,
        message: 'Rate limiter error',
        });
    }

}

module.exports = rateLimiter;