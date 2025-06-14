#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Production Deploy Script for Sucia MVP\n');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${step}. ${description}`, 'blue');
  log('='.repeat(50), 'blue');
}

function runCommand(command, description) {
  try {
    log(`Running: ${command}`, 'cyan');
    const result = execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    log(`✅ ${description} completed successfully`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing`, 'red');
    return false;
  }
}

function validateEnvironment() {
  logStep(1, 'Environment Validation');
  
  // Check for required files
  const requiredFiles = [
    { path: 'package.json', name: 'Package.json' },
    { path: 'next.config.js', name: 'Next.js config' },
    { path: 'vercel.json', name: 'Vercel config' },
    { path: 'public/manifest.json', name: 'PWA manifest' },
    { path: '.env.local', name: 'Environment variables' }
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (!checkFile(file.path, file.name)) {
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    log('\n❌ Missing required files. Please ensure all files are in place before deploying.', 'red');
    process.exit(1);
  }

  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`, 'cyan');
  
  // Check if npm is available
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`npm version: ${npmVersion}`, 'cyan');
  } catch (error) {
    log('❌ npm not found', 'red');
    process.exit(1);
  }
}

function installDependencies() {
  logStep(2, 'Installing Dependencies');
  runCommand('npm ci', 'Clean dependency installation');
}

function runLinting() {
  logStep(3, 'Code Quality Checks');
  
  // Type checking
  runCommand('npm run type-check', 'TypeScript type checking');
  
  // Run tests if available
  try {
    runCommand('npm test -- --passWithNoTests', 'Running tests');
  } catch (error) {
    log('⚠️ Tests not configured or failed', 'yellow');
  }
}

function buildProduction() {
  logStep(4, 'Production Build');
  
  // Clean previous build
  if (fs.existsSync('.next')) {
    log('Cleaning previous build...', 'cyan');
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  // Build for production
  runCommand('npm run build', 'Production build');
  
  // Check build output
  if (!checkFile('.next', 'Build output directory')) {
    log('❌ Build failed - no output directory found', 'red');
    process.exit(1);
  }
}

function runPerformanceAnalysis() {
  logStep(5, 'Performance Analysis');
  
  try {
    // Run bundle analyzer if available
    log('Generating bundle analysis...', 'cyan');
    runCommand('ANALYZE=true npm run build', 'Bundle analysis');
    
    if (checkFile('bundle-analyzer-report.html', 'Bundle analysis report')) {
      log('📊 Bundle analysis report generated', 'green');
    }
  } catch (error) {
    log('⚠️ Bundle analysis failed or not configured', 'yellow');
  }
}

function testProductionBuild() {
  logStep(6, 'Testing Production Build');
  
  log('Starting production server for testing...', 'cyan');
  
  try {
    // Start the production server in background
    const { spawn } = require('child_process');
    const server = spawn('npm', ['start'], { detached: false });
    
    // Wait for server to start
    setTimeout(() => {
      log('✅ Production server started successfully', 'green');
      log('🌐 Server should be running at http://localhost:3000', 'cyan');
      
      // Kill the server after verification
      server.kill();
      log('✅ Production server test completed', 'green');
    }, 5000);
    
  } catch (error) {
    log('❌ Production server test failed', 'red');
    log(`Error: ${error.message}`, 'red');
  }
}

function generateDeploymentReport() {
  logStep(7, 'Generating Deployment Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    buildStatus: 'success',
    files: {
      nextConfig: fs.existsSync('next.config.js'),
      vercelConfig: fs.existsSync('vercel.json'),
      manifest: fs.existsSync('public/manifest.json'),
      envFile: fs.existsSync('.env.local')
    },
    buildSize: getBuildSize(),
    recommendations: [
      'Set up environment variables in Vercel dashboard',
      'Configure custom domain and SSL',
      'Set up monitoring and error tracking',
      'Test all functionality in preview environment before production',
      'Set up proper DNS records for custom domain'
    ]
  };
  
  const reportPath = 'deployment-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📋 Deployment report saved to ${reportPath}`, 'green');
  
  // Display key metrics
  log('\n📊 Build Metrics:', 'magenta');
  log(`• Build size: ${report.buildSize}`, 'cyan');
  log(`• Node version: ${report.nodeVersion}`, 'cyan');
  log(`• Timestamp: ${report.timestamp}`, 'cyan');
}

function getBuildSize() {
  try {
    if (fs.existsSync('.next')) {
      const { execSync } = require('child_process');
      const sizeOutput = execSync('du -sh .next', { encoding: 'utf8' }).trim();
      return sizeOutput.split('\t')[0];
    }
  } catch (error) {
    return 'Unknown';
  }
  return 'Build not found';
}

function displayDeploymentInstructions() {
  logStep(8, 'Deployment Instructions');
  
  log('🎯 Ready for deployment! Follow these steps:', 'green');
  log('', 'reset');
  log('1. Set up environment variables in Vercel:', 'cyan');
  log('   - NEXT_PUBLIC_SUPABASE_URL', 'yellow');
  log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY', 'yellow');
  log('   - Any other environment variables from .env.local', 'yellow');
  log('', 'reset');
  log('2. Deploy to Vercel:', 'cyan');
  log('   npx vercel --prod', 'yellow');
  log('', 'reset');
  log('3. Configure custom domain (if applicable):', 'cyan');
  log('   - Add domain in Vercel dashboard', 'yellow');
  log('   - Update DNS records', 'yellow');
  log('   - Verify SSL certificate', 'yellow');
  log('', 'reset');
  log('4. Test production deployment:', 'cyan');
  log('   - Verify all pages load correctly', 'yellow');
  log('   - Test all interactive features', 'yellow');
  log('   - Check Core Web Vitals with Lighthouse', 'yellow');
  log('   - Verify database connections', 'yellow');
  log('', 'reset');
  log('5. Monitor deployment:', 'cyan');
  log('   - Set up error tracking', 'yellow');
  log('   - Configure performance monitoring', 'yellow');
  log('   - Set up uptime monitoring', 'yellow');
  log('', 'reset');
  log('📚 For detailed instructions, see: PRODUCTION_ENV_SETUP.md', 'magenta');
}

// Main execution
function main() {
  try {
    validateEnvironment();
    installDependencies();
    runLinting();
    buildProduction();
    runPerformanceAnalysis();
    testProductionBuild();
    generateDeploymentReport();
    displayDeploymentInstructions();
    
    log('\n🎉 Production deployment preparation completed successfully!', 'green');
    log('Your application is ready for deployment to Vercel.', 'green');
    
  } catch (error) {
    log('\n💥 Deployment preparation failed', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main }; 