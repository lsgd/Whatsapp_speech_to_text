// Functions when using Whisper AI as speech recognition system.

const request = require("request");
const env = require("./environment");

async function transcribe(base64data, message) {
    // Decode the base64 data (The data is a base64 string because thats the way WhatsApp.js handles media)
    const decodedBuffer = Buffer.from(base64data, 'base64');

    // Send the decoded binary buffer to the Flask API
    return new Promise((resolve, reject) => {
        request.post(
            {
                // This url is the url of the Flask API that handles the transcription using Whisper
                url: env.whisperAPIAddress,
                formData: {
                    file: {
                        value: decodedBuffer,
                        options: {
                            filename: message.from + message.timestamp
                        }
                    }
                }
            },
            function (err, httpResponse, body) {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Upload successful! Server responded with:', body);
                }
                resolve(body);
            }
        );
    });
}

exports.transcribe = transcribe;