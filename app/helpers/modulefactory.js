let ModuleFactory = (function ModuleFactory() {
    let modules = {};
	let path = require('path');
    let fs = require('fs');
	let findModules = (dir, filelist) => {
        let files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach((file) => {
            if(fs.statSync(path.join(dir, file)).isDirectory() && file !== 'node_modules'){
                filelist = findModules(path.join(dir, file), filelist);
            }else if(file && filelist && file.endsWith('.js') && !file.endsWith('.spec.js')){
                filelist.push(path.join(dir, file));
                modules[file] = dir.endsWith('/') ? dir + file : dir + '/' + file;
            }
            return filelist;
		});
    };
    console.log('Init');
    findModules('../');
    return get = (moduleName) => {
            return modules[moduleName];
    }
})();

module.exports = {
        get : ModuleFactory
}
