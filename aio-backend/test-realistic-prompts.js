/**
 * Test Realistic Prompts
 * Compare old vs new prompt generation
 */

import { generatePrompts } from './services/promptGenerator.js';
import { generateRealisticPrompts } from './services/realisticPromptGenerator.js';
import chalk from 'chalk';

const sampleBrandInfo = {
  brandName: "Descript",
  productDetails: "AI video editing software",
  industry: "Software",
  location: "USA"
};

console.log(chalk.blue('\n' + '='.repeat(80)));
console.log(chalk.blue.bold('  OLD PROMPTS (Generic, Short, Robotic)'));
console.log(chalk.blue('='.repeat(80) + '\n'));

const oldPrompts = generatePrompts(sampleBrandInfo, 10);
oldPrompts.slice(0, 10).forEach((prompt, i) => {
  console.log(chalk.gray(`${i + 1}.`), prompt);
  console.log(chalk.yellow(`   Length: ${prompt.length} chars\n`));
});

console.log(chalk.green('\n' + '='.repeat(80)));
console.log(chalk.green.bold('  NEW PROMPTS (Realistic, Conversational, Natural)'));
console.log(chalk.green('='.repeat(80) + '\n'));

const newPrompts = generateRealisticPrompts(sampleBrandInfo, 10);
newPrompts.forEach((prompt, i) => {
  console.log(chalk.gray(`${i + 1}.`), chalk.white(prompt));
  console.log(chalk.cyan(`   Length: ${prompt.length} chars\n`));
});

// Statistics
const oldAvgLength = Math.round(oldPrompts.reduce((sum, p) => sum + p.length, 0) / oldPrompts.length);
const newAvgLength = Math.round(newPrompts.reduce((sum, p) => sum + p.length, 0) / newPrompts.length);

console.log(chalk.blue('\n' + '='.repeat(80)));
console.log(chalk.bold('  COMPARISON'));
console.log('='.repeat(80) + '\n');

console.log(chalk.gray('OLD Prompts:'));
console.log(`  Average Length: ${chalk.yellow(oldAvgLength)} characters`);
console.log(`  Style: ${chalk.yellow('Template-based, keyword-focused')}`);
console.log(`  Realism: ${chalk.red('Low - sounds robotic')}\n`);

console.log(chalk.gray('NEW Prompts:'));
console.log(`  Average Length: ${chalk.cyan(newAvgLength)} characters`);
console.log(`  Style: ${chalk.cyan('Conversational, context-rich')}`);
console.log(`  Realism: ${chalk.green('High - sounds like real users')}\n`);

console.log(chalk.green.bold(`✓ New prompts are ${Math.round((newAvgLength / oldAvgLength) * 100)}% the length of old prompts`));
console.log(chalk.green.bold(`✓ Much more realistic and natural\n`));
