#!/usr/bin/env node

const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const localNextBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

function resolveNextCommand() {
  if (fs.existsSync(localNextBin)) {
    return {
      command: localNextBin,
      prefixArgs: [],
    };
  }

  try {
    const resolvedNextBin = require.resolve("next/dist/bin/next", {
      paths: [projectRoot],
    });

    return {
      command: process.execPath,
      prefixArgs: [resolvedNextBin],
    };
  } catch (_error) {
    return null;
  }
}

const nextCommand = resolveNextCommand();

function readRequestedPort(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-p" || arg === "--port") {
      const value = Number.parseInt(argv[index + 1], 10);
      if (Number.isFinite(value)) {
        return value;
      }
    }

    if (arg.startsWith("--port=")) {
      const value = Number.parseInt(arg.slice("--port=".length), 10);
      if (Number.isFinite(value)) {
        return value;
      }
    }

    if (arg.startsWith("-p=")) {
      const value = Number.parseInt(arg.slice(3), 10);
      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  const envPort = Number.parseInt(process.env.PORT || "", 10);
  return Number.isFinite(envPort) ? envPort : 3000;
}

function stripPortArgs(argv) {
  const result = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-p" || arg === "--port") {
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=") || arg.startsWith("-p=")) {
      continue;
    }

    result.push(arg);
  }

  return result;
}

function hasBundlerFlag(argv) {
  return argv.includes("--webpack") || argv.includes("--turbo") || argv.includes("--turbopack");
}

function isHelpRequest(argv) {
  return argv.includes("--help") || argv.includes("-h");
}

function getListeningPorts() {
  try {
    const { spawnSync } = require("child_process");
    const result = spawnSync("lsof", ["-Pan", "-iTCP", "-sTCP:LISTEN"], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    if (result.status !== 0 || !result.stdout) {
      return new Set();
    }

    return new Set(
      result.stdout
        .split("\n")
        .map((line) => line.match(/:(\d+)\s+\(LISTEN\)$/))
        .filter(Boolean)
        .map((match) => Number.parseInt(match[1], 10))
        .filter(Number.isFinite)
    );
  } catch (_error) {
    return new Set();
  }
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort) {
  const listeningPorts = getListeningPorts();
  if (listeningPorts.size > 0) {
    let port = startPort;

    while (listeningPorts.has(port)) {
      port += 1;
    }

    return port;
  }

  let port = startPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

async function main() {
  if (!nextCommand) {
    console.error("[dev] Next.js CLI not found. Run `yarn install` first.");
    process.exit(1);
  }

  if (isHelpRequest(args)) {
    const child = spawn(nextCommand.command, [...nextCommand.prefixArgs, "dev", ...args], {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });

    child.on("error", (error) => {
      console.error(`[dev] Could not start Next.js: ${error.message}`);
      process.exit(1);
    });

    return;
  }

  const requestedPort = readRequestedPort(args);
  const selectedPort = await findAvailablePort(requestedPort);
  const explicitDistDir = Boolean(process.env.NEXT_DIST_DIR);
  const defaultDistDir = process.env.NEXT_DIST_DIR || ".next";
  const defaultLockPath = path.join(projectRoot, defaultDistDir, "dev", "lock");

  let tempDistDir = "";

  if (!explicitDistDir && fs.existsSync(defaultLockPath)) {
    tempDistDir = `.next-dev-${selectedPort}-${process.pid}`;
    process.env.NEXT_DIST_DIR = tempDistDir;

    console.log(`[dev] Detected an active Next.js build lock at ${path.relative(projectRoot, defaultLockPath)}.`);
    console.log(`[dev] Starting a parallel dev server on port ${selectedPort} with ${tempDistDir}.`);
  } else if (selectedPort !== requestedPort) {
    console.log(`[dev] Port ${requestedPort} is in use. Starting on port ${selectedPort}.`);
  }

  const cleanupTempDistDir = () => {
    if (!tempDistDir) {
      return;
    }

    try {
      fs.rmSync(path.join(projectRoot, tempDistDir), {
        force: true,
        recursive: true,
      });
    } catch (_error) {
      // Ignore cleanup errors for ephemeral dev output.
    }
  };

  const child = spawn(
    nextCommand.command,
    [
      ...nextCommand.prefixArgs,
      "dev",
      ...stripPortArgs(args),
      "--port",
      String(selectedPort),
      ...(hasBundlerFlag(args) ? [] : ["--webpack"]),
    ],
    {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    }
  );

  child.on("error", (error) => {
    cleanupTempDistDir();
    console.error(`[dev] Could not start Next.js: ${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    cleanupTempDistDir();
    process.exit(code ?? 0);
  });

  ["SIGINT", "SIGTERM", "SIGHUP"].forEach((signal) => {
    process.on(signal, () => {
      if (!child.killed) {
        child.kill(signal);
      }
    });
  });
}

main().catch((error) => {
  console.error(`[dev] ${error.message}`);
  process.exit(1);
});
