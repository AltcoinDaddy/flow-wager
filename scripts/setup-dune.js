#!/usr/bin/env node

/**
 * Dune Analytics Setup Script for Flow Wager
 *
 * This script helps you set up the Dune Analytics integration by:
 * 1. Validating your Dune API key
 * 2. Testing Flow blockchain data access
 * 3. Providing setup instructions
 * 4. Validating environment variables
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log("\n" + "=".repeat(60), "cyan");
  log(message.toUpperCase(), "bright");
  log("=".repeat(60), "cyan");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Check if .env.local exists
function checkEnvFile() {
  logHeader("Environment Configuration Check");

  const envPath = path.join(process.cwd(), ".env.local");
  const envExamplePath = path.join(process.cwd(), ".env.local.example");

  if (!fs.existsSync(envPath)) {
    logError(".env.local file not found");

    if (fs.existsSync(envExamplePath)) {
      logInfo("Found .env.local.example file");
      logInfo(
        "Please copy .env.local.example to .env.local and configure your variables",
      );
      log("\nCommand: cp .env.local.example .env.local", "yellow");
    } else {
      logError(".env.local.example file also not found");
    }
    return false;
  }

  logSuccess(".env.local file found");
  return true;
}

// Load environment variables
function loadEnvVars() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf8");

    const envVars = {};
    envContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value && !key.startsWith("#")) {
        envVars[key.trim()] = value.trim();
      }
    });

    return envVars;
  } catch (error) {
    logError(`Failed to load .env.local: ${error.message}`);
    return {};
  }
}

// Validate required environment variables
function validateEnvVars(envVars) {
  logHeader("Environment Variables Validation");

  const requiredVars = {
    NEXT_PUBLIC_DUNE_API_KEY: "Dune API Key",
    NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS: "Flow Contract Address",
  };

  const optionalVars = {
    NEXT_PUBLIC_DUNE_MARKET_METRICS_QUERY_ID: "Market Metrics Query ID",
    NEXT_PUBLIC_DUNE_USER_ANALYTICS_QUERY_ID: "User Analytics Query ID",
    NEXT_PUBLIC_DUNE_TRENDING_MARKETS_QUERY_ID: "Trending Markets Query ID",
    NEXT_PUBLIC_DUNE_VOLUME_OVER_TIME_QUERY_ID: "Volume Over Time Query ID",
    NEXT_PUBLIC_DUNE_CATEGORY_INSIGHTS_QUERY_ID: "Category Insights Query ID",
  };

  let allRequired = true;

  // Check required variables
  for (const [key, description] of Object.entries(requiredVars)) {
    if (
      envVars[key] &&
      envVars[key] !== "your_dune_api_key_here" &&
      envVars[key] !== "your_contract_address_here"
    ) {
      logSuccess(`${description}: ${envVars[key].substring(0, 10)}...`);
    } else {
      logError(`${description} is missing or not configured`);
      allRequired = false;
    }
  }

  // Check optional variables
  log("\nOptional Query IDs:", "bright");
  for (const [key, description] of Object.entries(optionalVars)) {
    if (envVars[key] && envVars[key] !== "your_query_id_here") {
      logSuccess(`${description}: ${envVars[key]}`);
    } else {
      logWarning(`${description} not configured (will use mock data)`);
    }
  }

  return allRequired;
}

// Test Dune API connection
function testDuneAPI(apiKey) {
  return new Promise((resolve) => {
    logHeader("Dune API Connection Test");

    if (!apiKey || apiKey === "your_dune_api_key_here") {
      logError("Dune API key not configured");
      resolve(false);
      return;
    }

    const options = {
      hostname: "api.dune.com",
      port: 443,
      path: "/api/v1/queries/recent",
      method: "GET",
      headers: {
        "X-Dune-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    };

    logInfo("Testing Dune API connection...");

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          logSuccess("Dune API connection successful");
          logInfo(`Response: ${res.statusCode} ${res.statusMessage}`);
          resolve(true);
        } else if (res.statusCode === 401) {
          logError("Invalid Dune API key - check your API key");
          logInfo("Get your API key from: https://dune.com/settings/api");
          resolve(false);
        } else {
          logError(`Dune API error: ${res.statusCode} ${res.statusMessage}`);
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      logError(`Connection error: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      logError("Request timeout - check your internet connection");
      req.abort();
      resolve(false);
    });

    req.end();
  });
}

// Check if SQL query files exist
function checkQueryFiles() {
  logHeader("SQL Query Files Check");

  const queryDir = path.join(process.cwd(), "dune-queries");
  const expectedFiles = [
    "00-flow-data-diagnostic.sql",
    "01-simple-market-metrics.sql",
    "01-market-metrics.sql",
    "02-user-analytics.sql",
    "03-trending-markets.sql",
    "04-volume-over-time.sql",
    "05-category-insights.sql",
  ];

  if (!fs.existsSync(queryDir)) {
    logError("dune-queries directory not found");
    return false;
  }

  let allFilesExist = true;

  expectedFiles.forEach((file) => {
    const filePath = path.join(queryDir, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Query file: ${file}`);
    } else {
      logError(`Missing query file: ${file}`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Validate Flow contract address format
function validateFlowAddress(address) {
  if (!address) return false;

  // Remove 0x prefix if present
  const cleanAddress = address.replace(/^0x/, "");

  // Flow addresses should be 16 hexadecimal characters
  const flowAddressRegex = /^[a-fA-F0-9]{16}$/;

  return flowAddressRegex.test(cleanAddress);
}

// Provide setup instructions
function provideInstructions(envVarsValid, duneConnected, queryFilesExist) {
  logHeader("Setup Instructions");

  if (!envVarsValid) {
    log("\n📋 STEP 1: Configure Environment Variables", "bright");
    log("1. Copy .env.local.example to .env.local");
    log("2. Get your Dune API key from: https://dune.com/settings/api");
    log("3. Update NEXT_PUBLIC_DUNE_API_KEY with your actual API key");
    log(
      "4. Update NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS with your contract address",
    );
  }

  if (!duneConnected) {
    log("\n🔑 STEP 2: Dune API Access", "bright");
    log("1. Sign up for Dune Pro at: https://dune.com/pricing");
    log("2. Dune Pro ($390/month) is required for API access");
    log("3. Generate an API key in your Dune settings");
    log("4. Test the connection by running this script again");
  }

  if (!queryFilesExist) {
    log("\n📝 STEP 3: Create SQL Queries in Dune Studio", "bright");
    log("1. Go to: https://dune.com/queries");
    log("2. Create new queries using the SQL files in ./dune-queries/");
    log("3. Start with 00-flow-data-diagnostic.sql to understand your data");
    log("4. Save each query and note the Query ID");
    log("5. Update your .env.local with the Query IDs");
  }

  if (queryFilesExist && !duneConnected) {
    log("\n🔍 STEP 4: Test Your Setup", "bright");
    log("1. Start with the diagnostic query (00-flow-data-diagnostic.sql)");
    log("2. Use your Flow contract address as a parameter");
    log("3. Verify that Flow blockchain data is available in Dune");
    log("4. Adjust queries based on your actual event structure");
  }

  log("\n🚀 Next Steps:", "bright");
  log("• Run your Next.js development server: npm run dev");
  log("• Navigate to /admin/analytics to see the dashboard");
  log("• Mock data will be shown if queries are not configured");
  log("• Check the browser console for any API errors");

  log("\n📚 Documentation:", "bright");
  log("• Setup Guide: ./DUNE_SETUP.md");
  log("• Troubleshooting: ./FLOW_DUNE_TROUBLESHOOTING.md");
  log("• Implementation Summary: ./DUNE_IMPLEMENTATION_SUMMARY.md");
}

// Main setup function
async function main() {
  log("Flow Wager - Dune Analytics Setup", "bright");
  log("This script will help you configure your Dune Analytics integration\n");

  // Check environment file
  const envFileExists = checkEnvFile();
  if (!envFileExists) {
    process.exit(1);
  }

  // Load and validate environment variables
  const envVars = loadEnvVars();
  const envVarsValid = validateEnvVars(envVars);

  // Test Dune API connection
  const duneConnected = await testDuneAPI(envVars.NEXT_PUBLIC_DUNE_API_KEY);

  // Check query files
  const queryFilesExist = checkQueryFiles();

  // Validate Flow address format
  logHeader("Flow Contract Address Validation");
  const contractAddress = envVars.NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS;
  if (validateFlowAddress(contractAddress)) {
    logSuccess(`Flow address format is valid: ${contractAddress}`);
  } else {
    logError(`Invalid Flow address format: ${contractAddress}`);
    logInfo(
      "Flow addresses should be 16 hexadecimal characters (optionally with 0x prefix)",
    );
  }

  // Provide instructions
  provideInstructions(envVarsValid, duneConnected, queryFilesExist);

  // Summary
  logHeader("Setup Status Summary");
  log(
    `Environment Variables: ${envVarsValid ? "✅ Configured" : "❌ Needs Setup"}`,
    envVarsValid ? "green" : "red",
  );
  log(
    `Dune API Connection: ${duneConnected ? "✅ Connected" : "❌ Not Connected"}`,
    duneConnected ? "green" : "red",
  );
  log(
    `SQL Query Files: ${queryFilesExist ? "✅ Present" : "❌ Missing"}`,
    queryFilesExist ? "green" : "red",
  );

  const allReady = envVarsValid && duneConnected && queryFilesExist;
  if (allReady) {
    log("\n🎉 Your Dune Analytics integration is ready!", "green");
    log(
      "Start your development server and navigate to /admin/analytics",
      "green",
    );
  } else {
    log("\n⚠️  Setup incomplete - follow the instructions above", "yellow");
  }

  process.exit(0);
}

// Run the setup
main().catch((error) => {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
});
