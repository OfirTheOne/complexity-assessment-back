
const path = require('path');
const uuidv1 = require('uuid/v1');

const questionsParamsTable = require('./questionsParamsTable.json');

const { JavaService } = require('../java-service/java.service');

const { FileService } = require('../file-sevice/file.service');

const javaService = new JavaService();
const fileService = new FileService();




class AnalysisService {

    constructor() {
        console.log('AnalysisService.constructor()');
        this.analysisRequestId = uuidv1();
        this.analysisPaths = {};
        this.createAnalysisSubFolderSystemByReqId(this.analysisRequestId);
    }


    // ******* public ******* //

    async analysisProcces(id, code) {

        // STEP 0 - set the path object , make the code more readable 
        this.constructAnalysisPaths(this.analysisRequestId, id);

        // STEP 1 - create the file with the target code (warppig in a class)
        try {
            await this.codeToClass(id, code);
        } catch (error) {
            console.warn('**** analysisProcces fail in step 1. ****')
            console.error(error);
            throw new Error('analysisProcces fail in step 1.');
        }

        // STEP 2 - format the code !!!
        // https://github.com/google/google-java-format


        // STEP 3 - compile the file with the target code
        try {
            const stderr = await javaService.compileJava(this.analysisPaths.codeToAnalyzeFileNoExtention + '.java');
            if(stderr) {
                return {stderr};
            }
        } catch (error) {
            console.warn('**** analysisProcces fail in step 3. ****')
            console.error(error);
            fileService.removeDirRecursive(dir);
            throw error;// new Error('analysisProcces fail in step 3.');
        }

        // STEP 4 - run c-i-t 
        try {
            await this.runCIT(id);

        } catch (error) {
            console.warn('**** analysisProcces fail in step 4. ****')
            console.error(error);
            throw new Error('analysisProcces fail in step 4.');
        }

        // STEP 5 - compile the injected code (output  code of cit)
        try {
            await javaService.compileJava(this.analysisPaths.injectedCodeFileNoExtention + '.java', [
                this.analysisPaths.analysisResourcesFolder + '/jars/algorithmInterface.jar',
                this.analysisPaths.analysisResourcesFolder + '/jars/analyzerAbs.jar'
            ]);

        } catch (error) {
            console.warn('**** analysisProcces fail in step 5. ****')
            console.error(error);
            throw new Error('analysisProcces fail in step 5.');
        }

        // STEP 6 - run a-s 
        try {
            const asRes = await this.runAS(id);
            asRes? console.log(asRes.complexity) : null;
            fileService.removeDirRecursive(dir);
            return asRes;
        } catch (error) {
            console.warn('**** analysisProcces fail in step 6. ****')
            console.error(error);
            throw new Error('analysisProcces fail in step 6.');
        }


    }


    // ******* private ******* // 

    async codeToClass(id, code) {
        // construct the new file path (name included)
        const newFilePath = this.analysisPaths.analyzedAlgoFolder + questionsParamsTable[`${id}`].className + '.java';

        // creating the new file
        fileService.createFile(newFilePath);

        // construct the new file contant (wrapping the code inside a class)
        const topCode = `package analyzedAlgo;\n` + `public class ` + questionsParamsTable[`${id}`].className + ` {\n`;
        const bottomCode = `\n}`;
        const classContant = topCode + code + bottomCode;

        // writing the new contant to the new file
        await fileService.writeFileContant(newFilePath, classContant);
    }

    async formatCode(codeFilePath) {
        // TODO : need to use the google formatter and gal jar. 

    }

    async runCIT(id) {
        const citParam01 = this.analysisPaths.codeToAnalyzeFileNoExtention + '.java'; // org
        const citParam02 = this.analysisPaths.tmpReqIdFolder + '/temp/rfm.txt'; // rmp
        const citParam03 = this.analysisPaths.injectedCodeFileNoExtention + '.java'; // fnl
        const citParam04 = this.analysisPaths.tmpReqIdFolder + '/input/'; // orgFilePath
        const citParam05 = `analyzedAlgo.${questionsParamsTable[`${id}`].className}`; // orgClassName
        const citParam06 = this.analysisPaths.analysisResourcesFolder + `/config-json/q0${id}-config.json`;
        const citJarPath = this.analysisPaths.analysisResourcesFolder + '/algorithm/c-i-t.jar';

        await javaService.execJar(citJarPath, `${citParam01} ${citParam02} ${citParam03} ${citParam04} ${citParam05} ${citParam06}`);
    }

    async runAS(id) {
        const asParam01 = id;
        const asParam02 = this.analysisPaths.tmpReqIdFolder + '/output/'; // fnlClassPath
        const asParam03 = 'injectedCode.AlgoImpl'; // fnlClassName
        const asParam04 = this.analysisPaths.analysisResourcesFolder + `/samples-json/q0${id}-sample.json`;
        const asJarPath = this.analysisPaths.analysisResourcesFolder + '/algorithm/a-s.jar';

        const asRes = await javaService.execJar(asJarPath, `${asParam01} ${asParam02} ${asParam03} ${asParam04}`);
        return JSON.parse(asRes);
    }



    // on constructor creating the sub folders 
    createAnalysisSubFolderSystemByReqId(analysisRequestId) {
        console.log(`createAnalysisSubFolderSystemByReqId(${analysisRequestId})`);
        fileService.createDir(path.join(__dirname, '../../') + '/tmp');
        const tmpReqIdPath = path.join(__dirname, '../../') + '/tmp/' + analysisRequestId
        fileService.createDir(tmpReqIdPath);

        // fileService.createDir(tmpReqIdPath + '/uploads');

        fileService.createDir(tmpReqIdPath + '/input');
        fileService.createDir(tmpReqIdPath + '/input/analyzedAlgo');

        fileService.createDir(tmpReqIdPath + '/output');
        fileService.createDir(tmpReqIdPath + '/output/injectedCode');
        // fileService.createDir(tmpReqIdPath + '/output/jars');
        fileService.createFile(tmpReqIdPath + '/output/injectedCode/AlgoImpl.java');

        /*
        moveFileLocation(
          path.join(__dirname, '../') + 'res/jars/algorithmInterface.jar',
          path.join(__dirname, '../') + '/tmp/output/injectedCode/algorithmInterface.jar'
        );
        moveFileLocation(
          path.join(__dirname, '../') + 'res/jars/analyzerAbs.jar',
          path.join(__dirname, '../') + '/tmp/output/injectedCode/analyzerAbs.jar'
        );
        */
        fileService.createDir(tmpReqIdPath + '/temp');
        fileService.createFile(tmpReqIdPath + '/temp/rfm.txt')

        // fileService.createDir(tmpReqIdPath + '/uploads');
    }

    // on constructor creating path object 
    constructAnalysisPaths(analysisRequestId, id) {

        const tmpReqIdFolder = path.join(__dirname, '../../', `/tmp/${analysisRequestId}`);
        const analysisResourcesFolder = path.join(__dirname, './analysis-resources');

        this.analysisPaths = {
            tmpReqIdFolder,
            analysisResourcesFolder,
            analyzedAlgoFolder: tmpReqIdFolder + '/input/analyzedAlgo/',
            codeToAnalyzeFileNoExtention: tmpReqIdFolder + '/input/analyzedAlgo/' + questionsParamsTable[`${id}`].className,
            injectedCodeFileNoExtention: tmpReqIdFolder + '/output/injectedCode/AlgoImpl',
        }
        console.log(JSON.stringify(this.analysisPaths, undefined, 2));
    }


    async flushTmpFolder() {
     /*
        await fileService.removeFile(this.analysisPaths.injectedCodeFileNoExtention+'.java');
        await fileService.removeFile(this.analysisPaths.injectedCodeFileNoExtention+'.class');
        await fileService.removeFile(this.analysisPaths.codeToAnalyzeFileNoExtention+'.java');
        await fileService.removeFile(this.analysisPaths.codeToAnalyzeFileNoExtention+'.class');
        await fileService.removeFile(this.analysisPaths.tmpReqIdFolder+'/temp'+'/rfm.txt');
*/
        await fileService.removeDir(path.join(__dirname, '../../tmp/'));
        /*
        fileService.removeEmptyDir(this.analysisPaths.analyzedAlgoFolder+'/');
        fileService.removeEmptyDir(this.analysisPaths.tmpReqIdFolder + '/input/');
        fileService.removeEmptyDir(this.analysisPaths.tmpReqIdFolder + '/output/injectedCode/');
        fileService.removeEmptyDir(this.analysisPaths.tmpReqIdFolder + '/output/');
        fileService.removeEmptyDir(this.analysisPaths.tmpReqIdFolder+'/temp/');
*/


        // fileService.removeEmptyDir(path.join(__dirname, '../../tmp/', this.analysisRequestId));
    }

}

module.exports = {
    AnalysisService
}