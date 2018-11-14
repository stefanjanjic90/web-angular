import { CloudFormation } from 'aws-sdk';
import { readFile } from 'fs';
import * as moment from 'moment';
import * as promptly from 'promptly';

export enum AwsInfrastructureUtilityCommand {
    Create = 'CREATE',
    Update = 'UPDATE',
    Delete = 'DELETE'
}
export namespace AwsInfrastructureUtilityCommand {
    export function fromString(command: string): AwsInfrastructureUtilityCommand {
        command = command.toUpperCase();
        switch (command) {
            case AwsInfrastructureUtilityCommand.Create:
                return AwsInfrastructureUtilityCommand.Create;
            case AwsInfrastructureUtilityCommand.Update:
                return AwsInfrastructureUtilityCommand.Update;
            case AwsInfrastructureUtilityCommand.Delete:
                return AwsInfrastructureUtilityCommand.Delete;
            default:
                throw new Error('Unknown Aws Infrastructure Utility Command enum code.');
        }
    }
}

export class AwsInfrastructureUtility {

    private cloudFormation: CloudFormation;

    constructor(cloudFormationOptions: CloudFormation.Types.ClientConfiguration) {
        this.cloudFormation = new CloudFormation(cloudFormationOptions);
    }

    public async execute(command: AwsInfrastructureUtilityCommand, stackName: string, templateFilePath?: string): Promise<void> {
        let template = '';
        if (templateFilePath) {
            template = await this.getTemplateFile(templateFilePath);
        }
        switch (command) {
            case AwsInfrastructureUtilityCommand.Create:
                this.create(stackName, template);
                break;
            case AwsInfrastructureUtilityCommand.Update:
                this.update(stackName, template);
                break;
            case AwsInfrastructureUtilityCommand.Delete:
                this.delete(stackName);
                break;
            default:
                throw new Error('Unknown AWS infrastructure command.');
        }
    }

    private async create(stackName: string, template: string): Promise<void> {
        try {
            console.log('Creating change set...');
            const templateChangeSet = await this.getTemplateChangeSet(stackName, AwsInfrastructureUtilityCommand.Create, template);
            await this.printChanges(templateChangeSet.Id);

            const userInput = await promptly.prompt('Would you like to apply the changes (Y/N)?');
            if (userInput.toUpperCase() === 'Y') {
                console.log('Creating stack...');
                await this.createStack(stackName, templateChangeSet.Id);
                console.log('Stack creation done.');
            } else {
                await this.cloudFormation.deleteChangeSet({ ChangeSetName: templateChangeSet.Id }).promise();

                console.log('Given stack was created with status: REVIEW_IN_PROGRES.');
                console.log('No resources where allocated. You can still review resource allocation from AWS Web Console or delete the stack entirely.');

                this.delete(stackName);
            }
        } catch (exception) {
            console.log('Error occured during stack creation.', exception);
            throw (exception);
        }
    }

    private async update(stackName: string, template: string): Promise<void> {
        try {
            console.log('Creating change set...');
            const templateChangeSet = await this.getTemplateChangeSet(stackName, AwsInfrastructureUtilityCommand.Update, template);
            await this.printChanges(templateChangeSet.Id);

            const userInput = await promptly.prompt('Would you like to apply the changes? (Y/N)?');
            if (userInput.toUpperCase() === 'Y') {
                console.log('Updating stack...');
                await this.updateStack(stackName, templateChangeSet.Id);
                console.log('Stack update done.');
            } else {
                await this.cloudFormation.deleteChangeSet({ ChangeSetName: templateChangeSet.Id }).promise();
            }
        } catch (exception) {
            console.log('Error occured during stack update.');
            throw exception;
        }
    }

    private async delete(stackName: string): Promise<void> {
        const userInput = await promptly.prompt(`Are you sure you want to delete ${stackName} stack? (Y/N)?`);
        if (userInput.toUpperCase() === 'Y') {
            try {
                console.log('Deleting stack...');
                await this.deleteStack(stackName);
                console.log('Stack deleted.');
            } catch (exception) {
                console.log('Error occured while deleting the stack.');
                throw exception;
            }
        }
    }

    private async getTemplateFile(textFilePath: string): Promise<string> {
        try {
            const template = await this.readTemplateFile(textFilePath);
            await this.cloudFormation.validateTemplate({ TemplateBody: template }).promise();
            return template;
        } catch (exception) {
            console.log('Error in retreiving template file.');
            throw exception;
        }
    }

    private async readTemplateFile(textFilePath: string): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            readFile(textFilePath, 'utf8', (error, data) => {
                if (error) {
                    return reject(error);
                } else {
                    return resolve(data);
                }
            });
        });
    }

    private getTemplateChangeSetParams(command: string, stackName: string, templateBody: string) {
        return {
            ChangeSetName: stackName + '-' + moment().format('DD-MM-YYYY-HH-mm-ss'),
            StackName: stackName,
            ChangeSetType: command,
            TemplateBody: templateBody
        };
    }

    private async getTemplateChangeSet(stackName: string, changeSetType: CloudFormation.ChangeSetType, template: string): Promise<CloudFormation.CreateChangeSetOutput> {
        try {
            const changeSetParams = this.getTemplateChangeSetParams(changeSetType, stackName, template);
            const templateChangeSet = await this.cloudFormation.createChangeSet(changeSetParams).promise();
            await this.cloudFormation.waitFor('changeSetCreateComplete', { ChangeSetName: templateChangeSet.Id }).promise();
            return templateChangeSet;
        } catch (exception) {
            console.log('Error occured during template change set creation.');
            throw exception;
        }
    }

    private async printChanges(templateChangeSetId: string): Promise<void> {

        try {
            const templateStatus = await this.cloudFormation.describeChangeSet({ ChangeSetName: templateChangeSetId }).promise();

            console.log('Changes: ');
            for (const index in templateStatus.Changes) {
                if (templateStatus.Changes.hasOwnProperty(index)) {
                    const changeString = JSON.stringify(templateStatus.Changes[index], null, 2);
                    console.log(changeString);
                }
            }
        } catch (exception) {
            console.log('Describe change set failed.');
            throw exception;
        }
    }

    private async createStack(stackName: string, templateChangeSetId: string): Promise<void> {
        try {
            await this.cloudFormation.executeChangeSet({ ChangeSetName: templateChangeSetId }).promise();
            await this.cloudFormation.waitFor('stackCreateComplete', { StackName: stackName }).promise();
        } catch (exception) {
            console.log('Create stack failed.');
            throw exception;
        }
    }

    private async updateStack(stackName: string, templateChangeSetId: string): Promise<void> {
        try {
            await this.cloudFormation.executeChangeSet({ ChangeSetName: templateChangeSetId }).promise();
            await this.cloudFormation.waitFor('stackUpdateComplete', { StackName: stackName }).promise();
        } catch (exception) {
            console.log('Update stack failed.');
            throw exception;
        }
    }

    private async deleteStack(stackName: string): Promise<void> {
        try {
            await this.cloudFormation.deleteStack({ StackName: stackName }).promise();
            await this.cloudFormation.waitFor('stackDeleteComplete', { StackName: stackName }).promise();
        } catch (exception) {
            console.log('Delete stack failed.');
            throw exception;
        }
    }
}
