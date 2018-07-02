const path = require('path');
const util = require('util');
const fs = require('fs');

const rename = util.promisify(fs.rename);
const unlink = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

class FileService {
    
    logIsFileExists(dir) {
        if (fs.existsSync(dir)) {
            console.log(`the file ${dir} exists.`);
        } else {
            console.log(`the file ${dir} not exists.`);
        }
    }


    async logFileContant(dir) {
        try {
            const contant = await readFile(dir, 'utf8');
            console.log(contant);
        } catch (e) {
            console.log('error reading the file.');
            //console.log(e);
        }
    }

    createFile(dir) {
        fs.openSync(dir, 'w');
        this.logIsFileExists(dir);
    }

    createDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }

    copyFile(src, dest) {
        fs.copyFileSync(src, dest);
        this.logIsFileExists(dir);
    }

    async moveFileLocation(fromFile, toFile) {
        await rename(fromFile, toFile);
        this.logIsFileExists(toFile);
        return; 
    }

    async writeFileContant (file, contant) {
        //console.log(`writeFileContant(${file, contant})`);
        try {
            return await writeFile(file, contant);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = {
    FileService
}