const path = require('path');
const util = require('util');
const fs = require('fs');
const rf = require('rimraf');

const exec = util.promisify(require('child_process').exec);
const rename = util.promisify(fs.rename);
const unlink = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const env = process.env.NODE_ENV || 'development';

 

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

    async removeFile(_path) {
        console.log(res);
        /*
        if (fs.existsSync(_path)) {
            fs.unlinkSync(_path);
        }
        */
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

    async writeFileContant(file, contant) {
        //console.log(`writeFileContant(${file, contant})`);
        try {
            return await writeFile(file, contant);
        } catch (e) {
            throw e;
        }
    }

    removeFilesInDir(dir) {
        
        rf(dir, function () { 
            console.log('done'); 
            if (fs.existsSync(dir)) {
                console.log(`the file ${dir} exists.`);
            } else {
                console.log(`the file ${dir} not exists.`);
            }
        });
        // const res = await rf(dir, function () { console.log('done'); });
        
        // console.log(res);
    }

    async removeDirRecursive(dir) {
        if(env == 'development') {
            // await exec(`rd /s /q "${dir}"`)

        } else {
            await exec(`rm -rf ${dir}`)

        }
    }
}




module.exports = {
    FileService
}