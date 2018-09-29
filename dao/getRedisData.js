var redis = require("redis");
var client = redis.createClient("6379", "10.0.12.64");

client.on("error", function (error) {
    console.log("Redis Error:"+error);
});

client.auth("123456", function () {
    console.log("auth success.");
});

client.lpop(req.params.id,function(req,object){
    return object;
})

export default getRedisData