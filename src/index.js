require("dotenv").config();
const http = require("http");
const { Connection } = require("tedious");
const msRestNodeAuth = require("@azure/ms-rest-nodeauth");

const port = 8080;

function connect(accessToken) {
  return new Promise((resolve, reject) => {
    const connection = new Connection({
      server: process.env.SQL_SERVER_NAME,
      authentication: accessToken
        ? {
            type: "azure-active-directory-access-token",
            options: {
              token: accessToken,
            },
          }
        : {
            type: "azure-active-directory-msi-app-service",
            options: {
              clientId: process.env.SQL_SERVER_CLIENT_ID,
              resource: "https://database.windows.net",
            },
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

async function getToken() {
  const credentials = await msRestNodeAuth.loginWithAppServiceMSI({
    clientId: process.env.SQL_SERVER_CLIENT_ID,
    resource: "https://database.windows.net/",
  });

  return credentials.getToken();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, 10 ** ms));

const msToSec = (ms) => Math.floor(ms / 1000);

async function main() {
  let attemps = 0;
  let connected = false;
  let lastError;
  let maxAttempt = 10;
  let tokenResponse;

  http
    .createServer(async function (req, res) {
      res.writeHead(200, { "Content-Type": "application/json" });

      try {
        tokenResponse = await getToken();
        await connect(tokenResponse.accessToken);
        connected = true;
      } catch (e) {
        connected = false;
        lastError = e;
      }

      res.write(
        JSON.stringify(
          {
            version: 1,
            server: process.env.SQL_SERVER_NAME,
            database: process.env.SQL_SERVER_DB_NAME,
            connected: connected ? "success" : "failed",
            lastError: lastError ? lastError.message : "",
            lastErrorStack: lastError ? lastError.stack : "",
            tokenResponse,
          },
          null,
          4
        )
      );

      res.end("");
    })
    .listen(port);

  console.log("Server running at port: " + port);

  // while (true) {
  //   try {
  //     if (attemps > maxAttempt) {
  //       console.log(`Max attempt reached!`);
  //       break;
  //     }

  //     if (attemps > 0) {
  //       console.log(`Retrying (attemp #${attemps})....`);
  //     }

  //     console.log("Connect with env");

  //     await connect();

  //     connected = true;

  //     console.log("Connection successfully");

  //     break;
  //   } catch (e) {
  //     console.log("Error trying to connect", e);
  //     lastError = e;
  //     attemps++;
  //     console.log(`Retrying in ${msToSec(attemps ** 10)}s`);
  //     await sleep(attemps);
  //   }
  // }
}

main();
