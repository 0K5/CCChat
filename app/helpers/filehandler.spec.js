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
        it('Read callback successful', async function(){
            await assert.equal(content, data);
            require('fs').unlink(filei, unlinkCallback);
        });
    };
    let readTest = () => {
        it('Read from file', async function(){
            await fileHandler.read(readCallback);
        });
    };
    let writeCallback = () => {
        it('Write callback successful', async function() {
            await readTest();
        });
    };
    it('Write to file', async function() {
        try {
            await fileHandler.write(file, content, writeCallback);
        } catch (e) {
            assert.fail("Couldn't open ./test.txt", 'Opened ./test.txt', e.message);
        }
    });
});
