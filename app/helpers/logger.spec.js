describe('Logger Test', function() {
	let logger = require('./modulefactory.js').get('logger.js');
	let chai = require('chai');
	let fs = require('fs');
	it('Logging Info', () => {
		let log = 'TestLog';
		logger.logInfo(log);
		fs.readFile('./logs/test.log', 'utf8', (err, data) => {
			if(err){
				chai.assert.fail("Couldn't write log", "Wrote log", err.message);
			}
			chai.assert.isTrue(data.includes(log),"The Logfile includes the written log");
		});
	});
});
