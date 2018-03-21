let assert = require('assert');
let chai = require('chai');
describe('ModuleFactory Test', () => {
        let ModuleFactory = require('./modulefactory.js');
        it('Create Testmodule', function(){
                try{
                let modFac = ModuleFactory.get('modulefactory.js');
                }catch(e){
                        assert.fail("Couldn't create module","Create Module", e.message);
                }
        });
		it('Create Testmodule without .js Ending', () => {
                try{
                let modFac = ModuleFactory.get('modulefactory');
                }catch(e){
                        assert.fail("Couldn't create module","Create Module", e.message);
                }
        });
        it('Create non existent Module', function(){
                chai.expect(ModuleFactory.get.bind(ModuleFactory, 'notexistent.js')).to.throw("Module doesn't exist");
        });
});
        
