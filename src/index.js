require("dotenv").config();
const { Connection } = require("tedious");

const connection = new Connection({
  server: process.env.SQL_SERVER_NAME,
  authentication: {
    type: "azure-active-directory-msi-app-service",
    options: {},
  },
  options: {
    database: process.env.SQL_SERVER_DB_NAME,
    encrypt: true,
  },
});

function connect() {
  return new Promise((resolve, reject) => {
    // Attempt to connect and execute queries if connection goes through
    connection.on("connect", (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });

    connection.connect();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  let isRetrying = false;

  while (true) {
    try {
      if (isRetrying) {
        console.log("Retrying....");
      }

      console.log("Connect with env", process.env);

      await connect();

      console.log("Connection successfully");

      break;
    } catch (e) {
      console.log("Error trying to connect", e);
      console.log("Retrying in 5ms");
      isRetrying = true;
      await sleep(5000);
    }
  }
}

main();
