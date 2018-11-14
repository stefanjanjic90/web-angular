import { Gulpclass, Task, SequenceTask } from 'gulpclass';
import { CloudFormation, S3, Lambda } from 'aws-sdk';
import * as template from 'gulp-template';
import * as del from 'del';
import * as yargs from 'yargs';
import * as gulp from 'gulp';
import * as childProcess from 'child_process';
import * as async from 'async';
import * as fs from 'fs';
import * as path from 'path';
import * as mimeTypes from 'mime-types';

interface Environments {
    local: Environment;
    dev: Environment;
    stage: Environment;
    prod: Environment;
}
interface Environment {
    name: string;
    filePath: string;
    bucketName: string;
    webStackName: string;
    serviceStackName: string;
    cloudFormationScriptPath: string;
}

const Environments: Environments = {
    local: <Environment>{
        name: 'local',
        filePath: 'src/environments/environment.local.ts',
        bucketName: null,
        webStackName: null,
        serviceStackName: null,
        cloudFormationScriptPath: null
    },
    dev: <Environment>{
        name: 'dev',
        filePath: 'src/environments/environment.dev.ts',
        bucketName: 'rexor-integration-web-dev',
        webStackName: 'rexor-integration-web-dev',
        serviceStackName: 'rexor-integration-service-dev',
        cloudFormationScriptPath: './script/cloud-formation/rexor-integration-web-dev-stack.json'
    },
    stage: <Environment>{
        name: 'stage',
        filePath: 'src/environments/environment.stage.ts',
        bucketName: 'rexor-integration-web-stage',
        webStackName: 'rexor-integration-web-stage',
        serviceStackName: 'rexor-integration-service-stage',
        cloudFormationScriptPath: './script/cloud-formation/rexor-integration-web-stage-stack.json'
    },
    prod: <Environment>{
        name: 'prod',
        filePath: 'src/environments/environment.prod.ts',
        bucketName: 'jira-rexor-integration.company-domain.com',
        webStackName: 'rexor-integration-web-prod',
        serviceStackName: 'rexor-integration-service-prod',
        cloudFormationScriptPath: './script/cloud-formation/rexor-integration-web-prod-stack.json'
    }
};

@Gulpclass()
export class Gulpfile {

    private argv: any;
    private cloudFormation: CloudFormation;
    private s3: S3;
    private lambda: Lambda;
    private environment: Environment;
    private readonly enviromentPrebuildPath: string = 'src/environments/prebuild';
    private readonly buildPath = './dist/';
    private readonly apiBaseUrlKey = 'ApiBaseUrl';

    constructor() {
        this.argv = yargs.command('$0 <environment>', 'Gulp task runner.', {
            environment: {
                describe: 'Set environment for task execution.',
                type: 'string',
            }
        }).default('environment', Environments.local.name)
            .alias('e', 'environment')
            .argv;

        this.environment = Environments[this.argv.environment];
        if (!this.environment) {
            throw new Error('Unknown environment.');
        }
        this.cloudFormation = new CloudFormation({ apiVersion: '2010-05-15', region: 'eu-west-1' });
        this.s3 = new S3({ apiVersion: '2006-03-01', region: 'eu-west-1' });
        this.lambda = new Lambda({ apiVersion: '2015-03-31', region: 'eu-west-1' });
    }

    @SequenceTask('build')
    public build() {
        return ['clean-prebuild', 'clean', 'prebuild-environment', 'build-angular-app'];
    }

    @SequenceTask('build-and-deploy')
    public deployAndDeploy() {
        return ['build', 'deploy'];
    }

    @Task('clean')
    public async clean(callback: Function) {
        return del([this.buildPath], callback);
    }

    @Task('clean-prebuild')
    public async cleanPrebuild(callback: Function) {
        return del([this.enviromentPrebuildPath], callback);
    }

    @Task('prebuild-environment')
    public async prebuildEnvironment() {
        switch (this.environment.name) {
            case Environments.dev.name:
            case Environments.stage.name:
            case Environments.prod.name:
                const apiBaseUrlOutput = await this.getStackOutput(this.environment.webStackName, this.apiBaseUrlKey);

                return gulp.src(this.environment.filePath)
                    .pipe(template({ apiBaseUrl: apiBaseUrlOutput.OutputValue }))
                    .pipe(gulp.dest(this.enviromentPrebuildPath));

            case Environments.local.name:
                return gulp.src(this.environment.filePath)
                    .pipe(template())
                    .pipe(gulp.dest(this.enviromentPrebuildPath));
        }
    }

    @Task('build-angular-app')
    public async buildAngularApp() {
        const execPromise = new Promise<any>((resolve, reject) => {
            childProcess.exec('ng build --env=' + this.environment.name, function (error, stdout, stderr) {
                if (error) {
                    console.log(stderr);
                    return reject(error);
                }
                return resolve();
            });
        });

        return execPromise;
    }

    @Task('deploy')
    public async deploy() {
        switch (this.environment.name) {
            case Environments.local.name:
                return await this.localDeploy();
            case Environments.dev.name:
            case Environments.stage.name:
            case Environments.prod.name:
                return await this.awsDeploy();
        }
    }

    @Task('empty-bucket')
    public async emptyBucket() {
        try {
            const objectListResponse = await this.s3.listObjectsV2({ Bucket: this.environment.bucketName }).promise();

            if (objectListResponse.Contents.length > 0) {
                const objectKeys = [];
                for (const object of objectListResponse.Contents) {
                    objectKeys.push({ Key: object.Key });
                }
                await this.s3.deleteObjects({
                    Bucket: this.environment.bucketName,
                    Delete: {
                        Objects: objectKeys,
                        Quiet: false
                    }
                }).promise();
            }
        } catch (exception) {
            console.log('Error while listing bucket objects.', exception);
            throw exception;
        }
    }

    @Task('awsi-create')
    public async awsiCreate() {
        return this.executeCommand(this.getAwsInfrastrucutreCommand('create'));
    }

    @Task('awsi-update')
    public async awsiUpdate() {
        return this.executeCommand(this.getAwsInfrastrucutreCommand('update'));
    }

    @Task('awsi-delete')
    public async awsiDelete() {
        await this.emptyBucket();
        return this.executeCommand(this.getAwsInfrastrucutreCommand('delete'));
    }

    private async localDeploy() {
        childProcess.exec('start cmd.exe /k ng serve --env=' + this.environment.name, function (error, stdout, stderr) {
            if (error) {
                console.log(stderr);
            }
            console.log(stdout);
        });

    }

    private async awsDeploy() {
        return new Promise<any>(async (resolve, reject) => {

            await this.emptyBucket();

            await this.updateServiceStack();

            const directoryPath = path.resolve(this.buildPath);
            const files = fs.readdirSync(directoryPath);

            async.map(files, async (file, callback) => {
                const filePath = path.join(directoryPath, file);
                const contentType = mimeTypes.lookup(filePath);

                if (!contentType) {
                    throw new Error(`Unrecognized content type for ${filePath}`);
                }

                const options = {
                    Bucket: this.environment.bucketName,
                    Key: file,
                    Body: fs.readFileSync(filePath),
                    ContentType: contentType,
                    ACL: 'public-read'
                };

                this.s3.putObject(options, callback);

            }, function (error, results) {
                if (error) {
                    return reject(error);
                } else {
                    return resolve(results);
                }
            });
        });
    }

    @Task('update-service-stack')
    public async updateServiceStack() {
        return new Promise<any>(async (resolve, reject) => {

            const webappUrl = await this.getStackOutput(this.environment.webStackName, 'WebappURL');
            const listStackResourcesResponse = await this.cloudFormation
                                                .listStackResources({ StackName: this.environment.serviceStackName })
                                                .promise();

            const resources = listStackResourcesResponse.StackResourceSummaries;

            const lambdaFunctionResources = resources.filter((resource) => {
                return resource.ResourceType === 'AWS::Lambda::Function';
            });

            async.map(lambdaFunctionResources, async (lambdaFunction: CloudFormation.StackResourceSummary, callback) => {

                const functionConfiguration = await this.lambda
                                                .getFunctionConfiguration({ FunctionName: lambdaFunction.PhysicalResourceId })
                                                .promise();

                const functionEnvironmnent = functionConfiguration.Environment;
                functionEnvironmnent.Variables['webappUrl'] = webappUrl.OutputValue;

                const options = {
                    FunctionName: lambdaFunction.PhysicalResourceId,
                    Environment: functionEnvironmnent
                };

                this.lambda.updateFunctionConfiguration(options, callback);

            }, function (error, results) {
                if (error) {
                    return reject(error);
                } else {
                    return resolve(results);
                }
            });
        });
    }

    private getAwsInfrastrucutreCommand(command: string) {
        return `start cmd.exe /k npm run aws-infrastructure ${command}`
                + ` --name ${this.environment.webStackName}`
                + ` --path ${this.environment.cloudFormationScriptPath}`;
    }

    private async getStackOutput(stackName: string, outputKey: string): Promise<CloudFormation.Output> {
        return new Promise<CloudFormation.Output>(async (resolve, reject) => {
            const describeStacksResponse = await this.cloudFormation.describeStacks({ StackName: stackName }).promise();

            const stack = describeStacksResponse.Stacks.filter((stack) => {
                return stack.StackName === stackName;
            })[0];

            if (!stack) {
                reject('Stack not found.');
                throw new Error('Stack not found.');
            }

            const output = stack.Outputs.filter((output) => {
                return output.OutputKey === outputKey;
            })[0];

            if (!output) {
                reject('Output not found.');
                throw new Error('Output not found.');
            }

            return resolve(output);
        });

    }

    private async executeCommand(command: string) {
        const execPromise = new Promise<any>((resolve, reject) => {
            childProcess.exec(command, function (error, stdout, stderr) {
                if (error) {
                    console.log(stderr);
                    return reject(error);
                }
                return resolve();
            });
        });

        return execPromise;
    }
}
