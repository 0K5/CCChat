function ModuleFactory() {
    let modules = {};
	let path = require('path');
    let fs = require('fs');
    let addModule = (moduleName, modulePath) => {
		console.log(moduleName);
		console.log(modulePath);
    }
	function ModuleFinder(dir){
		let that = this;
		that.modDir = dir;
		console.log('ModDir: ' + that.modDir);
		fs.readdir(modDir , (err, files) => {
			if(err){
				throw err
			}
			files.forEach((file) => {
				console.log(file);
				if (file.endsWith('.js') && !file.endsWith('.spec.js')){
					modules[file] = that.modDir + file;
					console.log(that.modDir + file);
				}else if(fs.statSync('../' + file) && fs.statSync('../' + file).isDirectory()){
					new ModuleFinder('../' + file);
				}
			})
		});
	}
	ModuleFinder('../');
    let logger = require('./logger.js');
    let filehandler = require('./filehandler.js');
    let get = (moduleName) => {
        switch (moduleName) {
            case 'logger':
                return require('./logger.js');
            case 'filehandler':
                return require('./filehandler.js');
        }
    }
}

ModuleFactory();
