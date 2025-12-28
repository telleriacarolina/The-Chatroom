import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export const createCommand = new Command('create')
  .description('Create new resources')
  .command('user')
  .description('Create a new user')
  .option('--name <name>', 'User full name')
  .option('--phone <phone>', 'Phone number')
  .option('--type <type>', 'Account type (guest|registered|creator)')
  .action(async (options) => {
    const spinner = ora('Creating user...').start();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      spinner.succeed(chalk.green('User created successfully!'));
      console.log(chalk.gray(`Name: ${options.name || 'Test User'}`));
      console.log(chalk.gray(`Phone: ${options.phone || '+1234567890'}`));
      console.log(chalk.gray(`Type: ${options.type || 'registered'}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to create user'));
      console.error(error);
      process.exit(1);
    }
  });
