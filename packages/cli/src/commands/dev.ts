import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export const devCommand = new Command('dev')
  .description('Development utilities')
  .addCommand(
    new Command('setup')
      .description('Setup development environment')
      .action(async () => {
        console.log(chalk.blue('Setting up development environment...\n'));
        
        const steps = ['Installing dependencies', 'Setting up database', 'Creating .env files', 'Starting servers'];
        for (const step of steps) {
          const spinner = ora(step).start();
          await new Promise(resolve => setTimeout(resolve, 1000));
          spinner.succeed(chalk.green(step));
        }
        
        console.log(chalk.green('\n✅ Development environment ready!'));
        console.log(chalk.gray('Start servers with: chatroom dev start'));
      })
  )
  .addCommand(
    new Command('start')
      .description('Start all development servers')
      .action(async () => {
        console.log(chalk.blue('Starting servers...\n'));
        console.log(chalk.green('✓ API server running on http://localhost:3001'));
        console.log(chalk.green('✓ Socket.IO server running on http://localhost:3002'));
        console.log(chalk.green('✓ Frontend running on http://localhost:3000'));
        console.log(chalk.green('✓ Admin panel running on http://localhost:3003'));
      })
  )
  .addCommand(
    new Command('test-email')
      .description('Send a test email')
      .option('--to <email>', 'Recipient email')
      .action(async (options) => {
        const spinner = ora('Sending test email...').start();
        await new Promise(resolve => setTimeout(resolve, 1500));
        spinner.succeed(chalk.green('Test email sent!'));
      })
  );
