import * as yargs from 'yargs';
import { AwsInfrastructureUtility, AwsInfrastructureUtilityCommand } from './aws-infrastructure-utility';

const argv = yargs
    .command(
    'create <name> <path>',
    'Creates a stack with given name based on the provided template body.',
    {
        'name': {
            describe: 'Name of the stack.'
        },
        'path': {
            describe: 'Path to the template body used for creation of the stack.'
        }
    })
    .command(
    'update <name> <path>',
    'Updates a stack with given name based on the provided template body.',
    {
        'name': {
            describe: 'Name of the stack.'
        },
        'path': {
            describe: 'Path to the template body used for creation of the stack.'
        }
    })
    .command(
    'delete <name>',
    'Deletes a stack based on a given name.',
    {
        'name': {
            describe: 'Name of the stack.'
        }
    })
    .demand(1, 'Specify at least one command.')
    .help().argv;

const command: string = argv._[0];
const stackName: string = argv.name;
const templateFilePath: string = argv.path;

(async () => {
    try {
        const awsInfrastructureUtility = new AwsInfrastructureUtility({ apiVersion: '2010-05-15', region: 'eu-west-1' });
        awsInfrastructureUtility.execute(AwsInfrastructureUtilityCommand.fromString(command), stackName, templateFilePath);
    } catch (exception) {
        console.log('Error occured during stack deployment.', exception);
    }
})();

