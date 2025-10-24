// Startup script to run all servers
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Full Stack Bike Service Project...\n');

// Function to start a server
function startServer(name, command, args, cwd) {
  console.log(`📦 Starting ${name}...`);
  
  const child = spawn(command, args, {
    cwd: path.resolve(__dirname, cwd),
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    console.error(`❌ Error starting ${name}:`, err.message);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ ${name} exited with code ${code}`);
    }
  });

  return child;
}

// Start servers with delays to avoid port conflicts
setTimeout(() => {
  console.log('1️⃣ Starting Main Server (Port 3001)...');
  startServer('Main Server', 'npm', ['run', 'dev'], 'server');
}, 1000);

setTimeout(() => {
  console.log('2️⃣ Starting Chatbot Server (Port 5000)...');
  startServer('Chatbot Server', 'npm', ['start'], 'chatbot');
}, 3000);

setTimeout(() => {
  console.log('3️⃣ Starting Frontend (Port 5173)...');
  startServer('Frontend', 'npm', ['run', 'dev'], 'client');
}, 5000);

console.log('\n📋 Server URLs:');
console.log('   Main Server: http://localhost:3001');
console.log('   Chatbot API: http://localhost:5000');
console.log('   Frontend: http://localhost:5173');
console.log('\n💡 Press Ctrl+C to stop all servers\n');

