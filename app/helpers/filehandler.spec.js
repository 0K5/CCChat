let fileHandler = require('./filehandler.js');
let assert = require('assert');

describe('Test FileHandler', () => {
    let file = './test.txt';
    let content = 'This is a test';
	let fs = require('fs');
	let unlinkCallback = (e) => {
		if(e){
			assert.fail("Couldn't unlink file", "Unlink file", e.message);
		}
	}
	after(function() {
            fs.unlink(file, unlinkCallback);
	});
    let readCallback = (data) => {
        it('Read callback successful', function(done){
            assert.equal(content, data);
            require('fs').unlink(filei, unlinkCallback);
            done();
        });
    };
    it('Read from file', function(done){
        fileHandler.read(readCallback);
        done();
    });
    it('Write to file', function(done) {
        try {
            fileHandler.write(file, content, writeCallback);
            done();
        } catch (e) {
            assert.fail("Couldn't open ./test.txt", 'Opened ./test.txt', e.message);
        }
    });
});
