// Functions when using Whisper AI as speech recognition system.

const request = require("request");
const env = require("./environment");

async function transcribe(decodedVoiceBinaryData, voiceMessageId, message) {
    // Send the decoded binary buffer to the Flask API
    return new Promise((resolve, reject) => {
        request.post(
            {
                // This url is the url of the Flask API that handles the transcription using Whisper
                url: env.whisperAPIAddress,
                formData: {
                    file: {
                        value: decodedVoiceBinaryData,
                        options: {
                            filename: message.from + message.timestamp + voiceMessageId
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