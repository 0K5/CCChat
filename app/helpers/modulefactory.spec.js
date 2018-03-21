let assert = require('assert');

describe('ModuleFactory Test', () => {
        let ModuleFactory = require('./modulefactory.js');
        it('Create Testmodule', function(){
                try{
                let modFac = ModuleFactory.get('modulefactory.js');
                }catch(e){
                        assert.fail("Couldn't factorize module","Factorized Model", e.message);
                }
        });
        it('Create non existent', function(){
                assert.throw(ModuleFactory.get('notexistent.js' ,Error, 'Threw error on creating notexistend.js module'));
        });
});
        
