
// const express = require('express');
// const venom = require('venom-bot');
// const app = express();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server, { cors: { origin: "*" } });

// app.set("view engine", "ejs");

// app.get('/home', (req, res) => {
//     res.render('home');
// });

// app.use(express.static(__dirname + '/images'));

// server.listen(3001, () => {
//     console.log('listening on port 3001')
// })

// io.on('connection', (socket) => {
//     let handshake = socket.handshake;
//     console.log('User connected:' + socket.id);

//     socket.on('message', () => {


//         venom
//             .create({
//                 session: 'sessionName',
//                 catchQR: (base64Qr, asciiQR) => {
//                     console.log(asciiQR); // Optional to log the QR in the terminal
//                     var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
//                         response = {};

//                     if (matches.length !== 3) {
//                         return new Error('Invalid input string');
//                     }
//                     response.type = matches[1];
//                     response.data = new Buffer.from(matches[2], 'base64');

//                     var imageBuffer = response;

//                     require('fs').writeFile(
//                         './images/out.png',
//                         imageBuffer['data'],
//                         'binary',
//                         function (err) {
//                             if (err != null) {
//                                 console.log(err);
//                             }
//                         }
//                     );
//                 },

//                 logQR: false,
//             })
//             .then((client) => {
//                 console.log(client);
//                 start(client);
//             })
//             .catch((error) => console.log(error));

//         function start(client) {
//             client.onStateChange((state) => {
//                 socket.emit('message', 'Status: ' + state);
//                 console.log('State changed: ', state);
//                 //socket.disconnect(true);           
//             });
//         }
//     });

//     socket.on("ready", () => {
//         setTimeout(function () {
//             socket.emit('ready', './out.png');
//         }, 3000);
//     });

//     // socket.on("ready", () => {
//     //   for (i = 0; i < 5; i++) {
//     //     (function() {
//     //       var j = i;
//     //       setTimeout(function () {
//     //         console.log(j);
//     //         socket.emit('ready', j);
//     //       }, Math.floor(Math.random() * 1000));
//     //     })();
//     //   }
//     // });

// });



const venom = require("venom-bot");
const { WebhookClient } = require('dialogflow-fulfillment');
const dialogflow = require('@google-cloud/dialogflow');
const sessionClient = new dialogflow.SessionsClient({ keyFilename: 'persianasny-w-api-wcoj-294ef33e72ab.json' });



function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}
async function detectIntent(
    projectId,
    sessionId,
    query,
    contexts,
    languageCode
) {

    try {
        const sessionPath = sessionClient.projectAgentSessionPath(
            projectId,
            sessionId
        );

        // The text query request.
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: query,
                    languageCode: languageCode,
                },
            },
        };

        if (contexts && contexts.length > 0) {
            request.queryParams = {
                contexts: contexts,
            };
        }

        const responses = await sessionClient.detectIntent(request);
        return responses[0];
    } catch (error) {
        console.log(error);
    }


}
async function executeQueries(projectId, sessionId, queries, languageCode) {
    let context;
    let intentResponse;
    for (const query of queries) {
        try {
            console.log(`Pergunta: ${query}`);
            intentResponse = await detectIntent(
                projectId,
                sessionId,
                query,
                context,
                languageCode
            );
            //console.log('Enviando Resposta');
            if (isBlank(intentResponse.queryResult.fulfillmentText)) {
                console.log('Sem resposta definida no DialogFlow');
                return "null";
            }
            else {
                console.log('Resposta definida no DialogFlow');
                //console.log(intentResponse.queryResult.fulfillmentText);
                return `${intentResponse.queryResult.fulfillmentText}`
            }
        } catch (error) {
            console.log(error);
        }
    }
}







function start(client) {
    client.onMessage(async (msg) => {
        try {
            console.log('Mensagem recebida', msg);
            let textoResposta = await executeQueries('persianasny-w-api-wcoj', msg.from, [msg.body], 'pt-br');
            let textoFormatado;

            try {
                textoFormatado = textoResposta.replace(/\\n/g, '\n');

            } catch (error) {

            }

            client.reply(msg.from, textoFormatado, msg.id.toString());
        } catch (error) {
            console.log(error);
        }
    });
}


try {
    venom.create(
        "sessionName",
        (base64Qr, asciiQR) => {
            console.log(asciiQR);
            var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
                response = {};

            if (matches.length !== 3) {
                return new Error("String input inválido");
            }
            response.type = matches[1];
            response.data = new Buffer.from(matches[2], "base64");

            var imageBuffer = response;
            require("fs").writeFile(
                "images/out.png",
                imageBuffer["data"],
                "binary",
                function (err) {
                    if (err != null) {
                        console.log(err);
                    }
                }
            );
        },
        undefined,
        { logQR: false }
    )
        .then((client) => {
            start(client);
        })
        .catch((error) => {
            console.log(error);
        });
} catch (error) {
    console.log(error);
}
