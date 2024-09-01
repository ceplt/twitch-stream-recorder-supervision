const { exec } = require("child_process");
const path = require("path");

const backendScript = path.join(__dirname, "../backend/index.js");
const frontendScript = path.join(__dirname, "../frontend/start.js");

const startBackend = () => {
  console.log("Starting backend server...");
  exec(`node ${backendScript}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting backend server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error starting backend server: ${stderr}`);
      return;
    }
    console.log(`Backend server stdout: ${stdout}`);
  });
};

const startFrontend = () => {
  console.log("Starting frontend server...");
  exec(`node ${frontendScript}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting frontend server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error starting frontend server: ${stderr}`);
      return;
    }
    console.log(`Frontend server stdout: ${stdout}`);
  });
};

startBackend();
startFrontend();
