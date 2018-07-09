
const uuidv1 = require('uuid/v1');
const util = require('util');
const path = require('path');

const exec = util.promisify(require('child_process').exec);
const { FileService } = require('../file-sevice/file.service');
const fileService = new FileService();

const env = process.env.NODE_ENV || 'development';



class JavaService {


    /** option : 
     * { packageName: string, className: string, interfaces: string[], reqId: string, classFilePath: string } 
     * @param {string} rawCode 
     * @param {} option 
     */
    async compileRawCode(rawCode, option) {

        const packageName = 'packageTest';
        const className = 'ClassTest';
        const reqId = uuidv1();
        const classFilePath = this.buildFilePathAndFolders(reqId, packageName, className);

        /* from row code to class code in file */
        const classCode = this.wrapCodeInClass(rawCode, className, packageName);
        await fileService.writeFileContant(classFilePath + '.java', classCode);

        let stderr = '';
        try {
            stderr = await this.compileJava(classFilePath + '.java');
        }
        catch (error) {
            throw error;
        }
        const dir = path.join(__dirname, '../../tmp', reqId);
        fileService.removeDirRecursive(dir);
        return stderr ? { stderr } : undefined;
    }

    /**
    * @description compile java file / generate a class file for a .java file.
    * @param {string} javaFilePath absolute path to the target java file to compile. 
    * @param {string} jarsArray array of jars (absolute path to jar file) dependencies. 
    * @returns {string} if any compiler error accrued returned them, otherways returned undefined.
    */
    async compileJava(codeFilePath, jarsDependencies) {

        console.log(`compileJava(${codeFilePath}, ${jarsDependencies})`);
        let jarArgs;
        const separationToken = (env == 'development') ? ';' : ':';

        if (jarsDependencies) {
            jarArgs = ``;
            for (let i = 0; i < jarsDependencies.length; i++) {
                jarArgs += (i < jarsDependencies.length - 1) ?
                    `${jarsDependencies[i]}${separationToken}` : `${jarsDependencies[i]}`;
            }
        } else {
            jarArgs = `.${separationToken}`;
        }

        let silencedMsg ;
        try {
            const { stdout, stderr } = await exec(`javac -cp "${jarArgs}" ${codeFilePath} -parameters`);
            //console.log('Output -> ' + stdout);
            silencedMsg = silencedMsg = this.JAVA_TOOLS_OPTIONS_errorSilence(stderr);
            this.filterErrorMessage(silencedMsg, codeFilePath);

        } catch (e) {
            silencedMsg = this.JAVA_TOOLS_OPTIONS_errorSilence(e.stderr ? e.stderr : e);
            silencedMsg = this.filterErrorMessage(silencedMsg, codeFilePath);
            console.log(' ********* from compileJava after ********* \n' + silencedMsg);

        }
        return silencedMsg;

    }

    async execJar(jarPath, appArgs) {
        console.log(`execJar(${jarPath}, ${appArgs})`);
        try {
            const { stdout, stderr } = await exec(`java -jar ${jarPath} ${appArgs}`);
            // console.log('Output -> ' + stdout);
            // console.log('Error -> ' + stderr);
            if (this.JAVA_TOOLS_OPTIONS_errorSilence(stderr)) {
                throw this.JAVA_TOOLS_OPTIONS_errorSilence(stderr);
            }
            return stdout;
        } catch (e) {
            throw e
        }
    }

    async execCmd(command) {
        const { stdout, stderr } = await exec(command);
        console.log(`stdout : \n ${stdout} \n`);
        console.log(`stderr : \n ${stderr} \n`);
    }


    /* private */

    /**
     * @param {string} reqId 
     * @param {string} packageName 
     * @param {string} className 
     * 
     * @return {string}  a path the new file. 
     * @description create a dir root_app / tmp / reqId / packageName , and create the java file with the new 'className'.
     */
    buildFilePathAndFolders(reqId, packageName, className) {

        fileService.createDir(path.join(__dirname, '../../') + '/tmp');
        fileService.createDir(path.join(__dirname, '../../tmp') + `/${reqId}`);
        const filePath = path.join(__dirname, '../../tmp', `/${reqId}`) + `/${packageName}`;
        fileService.createDir(filePath);
        fileService.createFile(filePath + '/' + className + '.java');
        return filePath + '/' + className;
    }

    wrapCodeInClass(classContant, className, packageName) {
        return `package ${packageName}; public class ${className} { ` + classContant + ' }';
    }

    JAVA_TOOLS_OPTIONS_errorSilence(errorMessage) {
        let silencedMessage;
        const expectedMessage = "Picked up JAVA_TOOL_OPTIONS: -Xmx300m -Xss512k -Dfile.encoding=UTF-8";

        if (errorMessage && typeof errorMessage == 'string') {
            const trimErrorMsg = errorMessage.trim();
            if (expectedMessage != trimErrorMsg) {
                silencedMessage = trimErrorMsg.replace('Picked up JAVA_TOOL_OPTIONS: -Xmx300m -Xss512k -Dfile.encoding=UTF-8', "")
                console.log(`silencedMessage :  ${silencedMessage} `);
                if (silencedMessage == "") {
                    silencedMessage = undefined;
                }
            }
        }
        return silencedMessage;
    }

    filterErrorMessage(javaCompilerError, dirToRemove) {
        console.log('filterErrorMessage ' + typeof javaCompilerError)
        if(typeof javaCompilerError == 'string') {
            const dir = path.normalize(dirToRemove);
            console.log('filterErrorMessage ' + dir)

            return javaCompilerError.replace(dir, 'line ');
        } 
        return javaCompilerError;

    }
}

module.exports = {
    JavaService
}
