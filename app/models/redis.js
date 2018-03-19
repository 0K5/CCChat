let connect = (() => {
	let redis = require('redis');
	let client = redis.createClient(11379, 
	'redis-11379.c11.us-east-1-2.ec2.cloud.redislabs.com', {no_ready_check: true});
	client.auth('UUJKCfW3vEClG6Zh6dvE9FfggYtBcYvi', function (err) {
		    if (err) throw err;
	});
	
	client.on('connect', function() {
		    console.log('Connected to Redis');
	});
	return () => {
		
})();


