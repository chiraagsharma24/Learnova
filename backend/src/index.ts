import os from "node:os";
import dotenv from "dotenv";

import app from "./app.js";

dotenv.config();
const PORT = Number(process.env.PORT) || 1337;

// Network URL
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    if (nets[name] === undefined) break;
    for (const net of nets[name]) if (net.family === "IPv4" && !net.internal) return net.address;
  }
  return "127.0.0.1";
}

// Serve
app.listen(PORT, "0.0.0.0", () => {
  const localIP = getLocalIP();
  const localUrl = `http://localhost:${PORT}`;
  const networkUrl = `http://${localIP}:${PORT}`;

  const color = {
    cyan: (txt: string) => `\x1b[36m${txt}\x1b[0m`,
    bold: (txt: string) => `\x1b[1m${txt}\x1b[0m`,
    green: (txt: string) => `\x1b[32m${txt}\x1b[0m`,
  };

  console.clear();
  console.log("Server running at:");
  console.log(`${color.green("➜")}  ${color.bold("Local:")}    ${color.cyan(localUrl)}`);
  console.log(`${color.green("➜")}  ${color.bold("Network:")}  ${color.cyan(networkUrl)}\n`);
});
