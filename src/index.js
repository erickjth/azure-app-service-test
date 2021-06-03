require("dotenv").config();
const http = require("http");
const { Connection } = require("tedious");

const port = 8080;

function connect() {
  return new Promise((resolve, reject) => {
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

    connection.connect((err) => {
      if (err) {
        connection.close();
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  let attemps = 0;
  let connected = false;
  let lastError = '';

  http
    .createServer(function (req, res) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.write("Azure Connection Testing\n");
      res.write(`Connect status: ${JSON.stringify({
        server: process.env.SQL_SERVER_NAME,
        database: process.env.SQL_SERVER_DB_NAME,
        connected: connected ? "success" : "failed",
        attemps,
        lastError: lastError?.message,
        lastErrorStack: lastError?.stack
      }, null, 4)}`);

      res.end("\nbye!");
    })
    .listen(port, "");

  console.log("Server running at port: " + port);

  while (true) {
    try {
      if (attemps > 0) {
        console.log(`Retrying (attemp #${attemps})....`);
      }

      console.log("Connect with env");

      await connect();

      connected = true;

      console.log("Connection successfully");

      break;
    } catch (e) {
      console.log("Error trying to connect", e);
      lastError = e;
      console.log("Retrying in 5ms");
      attemps++;
      await sleep(5000);
    }
  }
}

main();
