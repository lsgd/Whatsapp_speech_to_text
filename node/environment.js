// Manages environment variables and falls back to provided default values.
// Environment variables are mainly used in production, for example with docker.

const fs = require('fs');

function getBooleanEnvVariable(variable) {
    return variable && variable.toString().toLowerCase() == 'true';
}

function getStringEnvVariable(variable, defaultValue) {
    if (variable == undefined || variable == null) {
        return defaultValue;
    }
    return variable;
}


// Required to access environment variables.
const process = require('node:process');


// chromeDataPath is the path where the Google Chrome session will be stored.
const chromeDataPath = getStringEnvVariable(process.env.CHROME_DATA_PATH, './');
exports.chromeDataPath = chromeDataPath;

// automaticTranscription enables auto-detection of incoming voice messages to transcribe them.
const automaticTranscription = getBooleanEnvVariable(process.env.AUTOMATIC_TRANSCRIPTION);
exports.automaticTranscription = automaticTranscription;
console.log(automaticTranscription
    ? 'Automatic transcription for incoming voice messages is enabled.'
    : 'Automatic transcription for incoming voice messages is not enabled. You need to use `!tran`');

const _speechRecognitionSystem = getStringEnvVariable(process.env.SPEECH_RECOGNITION_SYSTEM, '').toLowerCase();
let _sanitizedSpeechRecognitionSystem = '';
switch (_speechRecognitionSystem) {
    case 'google':
        _sanitizedSpeechRecognitionSystem = _speechRecognitionSystem;
        const googleServiceAccountCredentialsFile = getStringEnvVariable(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_FILE, null);
        exports.googleServiceAccountCredentialsFile = googleServiceAccountCredentialsFile;
        const googleCloudStorageBucket = getStringEnvVariable(process.env.GOOGLE_CLOUD_STORAGE_BUCKET, null);
        exports.googleCloudStorageBucket = googleCloudStorageBucket;
        const googleCloudSpeechLanguage = getStringEnvVariable(process.env.GOOGLE_CLOUD_SPEECH_LANGUAGE, null);
        exports.googleCloudSpeechLanguage = googleCloudSpeechLanguage;

        const _alternativeLanguages = getStringEnvVariable(process.env.GOOGLE_CLOUD_SPEECH_ALTERNATIVE_LANGUAGES, '').split(',');
        const googleCloudSpeechAlternativeLanguages = _alternativeLanguages.map(result => result.trim());
        exports.googleCloudSpeechAlternativeLanguages = googleCloudSpeechAlternativeLanguages;

        if (googleServiceAccountCredentialsFile == null) {
            throw new Error('Environment variable GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_FILE is required '
                + 'when using `google` as the speech recognition system.');
        }
        if (!fs.existsSync(googleServiceAccountCredentialsFile)) {
            throw new Error('Environment variable GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_FILE needs to point '
                + 'to a JSON file containing the service account\'s credentials '
                + 'when using `google` as the speech recognition system.');
        }
        if (googleCloudStorageBucket == null) {
            throw new Error('Environment variable GOOGLE_CLOUD_STORAGE_BUCKET is required '
                + 'when using `google` as the speech recognition system.');
        }
        if (googleCloudSpeechLanguage == null) {
            throw new Error('Environment variable GOOGLE_CLOUD_SPEECH_LANGUAGE is required '
                + 'when using `google` as the speech recognition system.');
        }
        if (googleCloudSpeechAlternativeLanguages.length > 3) {
            throw new Error('Environment variable GOOGLE_CLOUD_SPEECH_ALTERNATIVE_LANGUAGES '
                + 'can only have up to 3 comma-separated values.');
        }
        break;
    case 'whisper':
    default:
        _sanitizedSpeechRecognitionSystem = 'whisper';
        // whisperAPIAddress points to the API for translating with Whisper AI.
        // The code to this api can be found in api/api.py
        const whisperAPIAddress = getStringEnvVariable(process.env.WHISPER_API_ADDRESS, 'http://127.0.0.1:5000');
        exports.whisperAPIAddress = whisperAPIAddress;
}
const speechRecognitionSystem = _sanitizedSpeechRecognitionSystem;
exports.speechRecognitionSystem = speechRecognitionSystem;
console.log('Used speech recognition system:', speechRecognitionSystem);
