require("dotenv").config();
const http = require("http");
const { Connection } = require("tedious");

const port = process.env.PORT || 8080;

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
  let attemps = 0;
  let connected = false;

  http
    .createServer(function (req, res) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.write("Hello World - this is node.js\n");
      res.write("Date on server: " + now.toGMTString());
      res.write("Connect status: ", { connected });
      res.end("\nbye!");
    })
    .listen(port, "");

  console.log("Server running at port: " + port);

  while (true) {
    try {
      if (attemps > 0) {
        console.log(`Retrying (attemp #${attemps})....`);
      }

      console.log("Connect with env", process.env);

      await connect();

	  connected = true;

      console.log("Connection successfully");

      break;
    } catch (e) {
      console.log("Error trying to connect", e);
      console.log("Retrying in 5ms");
      attemps++;
      await sleep(5000);
    }
  }
}

main();
