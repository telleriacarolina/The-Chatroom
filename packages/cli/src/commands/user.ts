import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export const userCommand = new Command('user')
  .description('Manage users')
  .addCommand(
    new Command('list')
      .description('List all users')
      .option('--limit <number>', 'Limit results', '10')
      .action(async (options) => {
        const spinner = ora('Fetching users...').start();
        await new Promise(resolve => setTimeout(resolve, 800));
        spinner.succeed(chalk.green('Users loaded!'));
        
        console.log(chalk.bold('\nUsers:'));
        for (let i = 0; i < parseInt(options.limit); i++) {
          console.log(chalk.gray(`  ${i + 1}. User ${i + 1} (user-${i + 1}@chatroom.com)`));
        }
      })
  )
  .addCommand(
    new Command('ban <userId>')
      .description('Ban a user')
      .action(async (userId) => {
        const spinner = ora(`Banning user ${userId}...`).start();
        await new Promise(resolve => setTimeout(resolve, 800));
        spinner.succeed(chalk.green(`User ${userId} has been banned!`));
      })
  )
  .addCommand(
    new Command('grant-admin <userId>')
      .description('Grant admin privileges')
      .action(async (userId) => {
        const spinner = ora(`Granting admin privileges...`).start();
        await new Promise(resolve => setTimeout(resolve, 800));
        spinner.succeed(chalk.green(`User ${userId} is now an admin!`));
      })
  );
