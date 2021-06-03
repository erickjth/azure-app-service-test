require('dotenv').config();
const {
    Connection,
    Request
} = require("tedious");
const msal = require('@azure/msal-node');
const fetch = require('./fetch');
const auth = require('./auth');

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: process.env.AAD_ENDPOINT + process.env.TENANT_ID,
        clientSecret: process.env.CLIENT_SECRET
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

const tokenRequest = {
    scopes: [
        // 'https://graph.microsoft.com/.default',
        'https://database.windows.net/.default'
    ]
};

async function main() {
    const authResponse = await cca.acquireTokenByClientCredential(tokenRequest);

    console.log(msalConfig, authResponse.accessToken);

    const connection = new Connection({
        server: "adcarepathwayscliniciands01.database.windows.net",
        authentication: {
            type: 'azure-active-directory-access-token',
            options: {
                token: authResponse.accessToken
            }
        },
        options: {
            database: 'adcarepathwayscliniciandb01',
            encrypt: true,
            port: 1433
        }
    });

    // Attempt to connect and execute queries if connection goes through
    connection.on("connect", err => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Ok')
        }
    });

    connection.connect();
}
main();
