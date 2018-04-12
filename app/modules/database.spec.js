let chai = require('chai');
let db = require('./database.js');


describe('Database Test', () => {
	before(function(done) {
		let test = db.init(null, null, done);
	});
	let readin;
	let testdata = {test: 'test'};
	let testupdate = {test: 'updated'};
    it('Create item', (done) => {
		db.create('test','testId', testdata, (ret) =>{
			if(!ret){
				done(ret);
			}else{
				done();
			}
		});
    });
	it('Readin from storage after create', function(done){
		db.read('test','testId', (ret) => {
			readin = ret; 
			done();
		});
	});
	it('Compare readin after create', function() {
		chai.assert(readin.test === testdata.test, 'Read test is not test');
	});
	it('Update item', function(done){
		db.update('test','testId', testupdate,(ret) => {
			if(!ret){
				done(ret);
			}else{
				done();
			}
		});
	});
	it('Readin from storage after update', function(done){
		db.read('test','testId', (ret) => {
			readin = ret; 
			done();
		});
	});
	it('Compare readin after update', function() { 
		chai.assert(readin.test === testupdate.test, 'Read test is not updated');
	});
})
