let findModules = (moduleid) => {
    let modules = {};
    let findModules = (dir, filelist) => {
        let path = require('path');
        let fs = require('fs');
        let files = fs.readdirSync(dir);
        filelist = filelist || [];
        moduleid = moduleid.endsWith('.js') ? moduleid : moduleid + '.js';
        moduleid = moduleid.startsWith('.') ? moduleid : '.' + moduleid;
        files.forEach((file) => {
            if (fs.statSync(path.join(dir, file)).isDirectory() && file !== 'node_modules') {
                filelist = findModules(path.join(dir, file), filelist);
            } else if (file && filelist && file.endsWith(moduleid) && !file.endsWith('.spec.js')) {
                filelist.push(path.join(dir, file));
                let locRefDir = dir.startsWith('./') ? '../' + dir.substring(2) : '../' + dir;
                modules[file] = locRefDir.endsWith('/') ? locRefDir + file : locRefDir + '/' + file;
            }
            return filelist;
        });
    };
    findModules('./');
    return modules;
};

let ModuleNotExistentException = function(message) {
    this.message = message;
    this.name = "ModuleNotExistentException";
};

let SingleModuleFactory = (function ModuleFactory() {
    let modules = findModules('.js');
    return get = (moduleName) => {
        let mod = moduleName.endsWith('.js') ? moduleName : moduleName + '.js';
        if (modules[mod] === null || modules[mod] === undefined) {
            throw new ModuleNotExistentException("Module doesn't exist");
        }
        let createdModule = require(modules[mod]);
        return createdModule;
    }
})();

let MultipleModulesFactory = (function ModuleFactory() {
    let modules = findModules('.js');
    return get = (moduleEnding) => {
        let mod = moduleEnding.endsWith('.js') ? moduleEnding : moduleEnding + '.js';
        mod = moduleEnding.startsWith('.') ? moduleEnding : '.' + moduleEnding;
		let createdModules = {};
        for (modName in modules) {
            if (modName.includes(mod)) {
                createdModules[modName] = require(modules[modName]);
            }
        }
        return createdModules;
    }
})();

module.exports = {
    get: SingleModuleFactory,
	getAll: MultipleModulesFactory
}
