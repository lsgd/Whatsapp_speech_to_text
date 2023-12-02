// Imports the Google Cloud client libraries
const speech = require('@google-cloud/speech');
const {Storage} = require('@google-cloud/storage');


const env = require('./environment.js');
const request = require("request");

const storage = new Storage({
    projectId: env.googleCloudStorageBucket,
    keyFilename: env.googleServiceAccountCredentialsFile,
});

// Creates a client
const client = new speech.SpeechClient({
    projectId: env.googleCloudStorageBucket,
    keyFilename: env.googleServiceAccountCredentialsFile,
});

async function transcribeSpeechToText(gcsURI) {
    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
        uri: gcsURI,
    };
    const config = {
        encoding: 'OGG_OPUS',
        sampleRateHertz: 16000,
        languageCode: env.googleCloudSpeechLanguage,
        alternativeLanguageCodes: env.googleCloudSpeechAlternativeLanguages,
        profanityFilter: false,
        enableWordTimeOffsets: false,
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        useEnhanced: true,
    };
    const request = {
        audio: audio,
        config: config,
    };

    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    return response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
}

async function uploadToCloudStorageFromMemory(destFile, content) {
    const bucket = storage.bucket(`gs://${env.googleCloudStorageBucket}`);
    return bucket.file(destFile).save(content);
}

function generateGcsURI(fileName) {
    return `gs://${env.googleCloudStorageBucket}/${fileName}`
}

async function transcribe(decodedVoiceBinaryData, voiceMessageId, message) {
    // Send the decoded binary buffer to the Flask API
    return new Promise(async (resolve, reject) => {
        const destFile = message.from + message.timestamp + voiceMessageId;
        await uploadToCloudStorageFromMemory(destFile, decodedVoiceBinaryData);
        console.log(`Upload successful! Voice message #${voiceMessageId} stored on Google CloudStorage.`)
        const transcript = await transcribeSpeechToText(generateGcsURI(destFile));
        console.log(`Transcription successful! Google Speech-to-Text responded with: ${transcript}`)
        resolve(JSON.stringify({'results': [{'filename': destFile, 'transcript': transcript}]}));
    });
}

exports.transcribe = transcribe;