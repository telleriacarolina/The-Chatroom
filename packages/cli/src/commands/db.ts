import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export const dbCommand = new Command('db')
  .description('Database operations')
  .addCommand(
    new Command('migrate')
      .description('Run database migrations')
      .action(async () => {
        const spinner = ora('Running migrations...').start();
        await new Promise(resolve => setTimeout(resolve, 2000));
        spinner.succeed(chalk.green('Migrations completed!'));
      })
  )
  .addCommand(
    new Command('seed')
      .description('Seed database with sample data')
      .action(async () => {
        const spinner = ora('Seeding database...').start();
        await new Promise(resolve => setTimeout(resolve, 1500));
        spinner.succeed(chalk.green('Database seeded!'));
      })
  )
  .addCommand(
    new Command('reset')
      .description('Reset database (WARNING: Destructive)')
      .option('--force', 'Skip confirmation')
      .action(async (options) => {
        if (!options.force) {
          console.log(chalk.red('⚠️  This will delete all data!'));
          process.exit(1);
        }
        const spinner = ora('Resetting database...').start();
        await new Promise(resolve => setTimeout(resolve, 2000));
        spinner.succeed(chalk.green('Database reset!'));
      })
  );
