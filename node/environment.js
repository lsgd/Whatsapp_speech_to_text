// Manages environment variables and falls back to provided default values.
// Environment variables are mainly used in production, for example with docker.

const fs = require('fs');

function getBooleanEnvVariable(variable) {
    return variable && variable.toString().toLowerCase() === 'true';
}

function getStringEnvVariable(variable, defaultValue) {
    if (variable === undefined || variable === null) {
        return defaultValue;
    }
    return variable;
}


// Required to access environment variables.
const process = require('node:process');


// Transcription command to use when manually triggering transcriptions.
const _transcriptionCommands = getStringEnvVariable(process.env.TRANSCRIPTION_COMMANDS, '!tran').toLowerCase().split(',');
const transcriptionCommands = _transcriptionCommands.map(result => result.trim()).filter(Boolean);
exports.transcriptionCommands = transcriptionCommands;
if (transcriptionCommands.length < 1) {
    throw new Error('Environment variable TRANSCRIPTION_COMMANDS '
        + 'needs to be a comma-separated list with at least 1 non-empty value.');
}
console.log(`Use one of the following commands to manually transcribe voice messages: ${transcriptionCommands.join(', ')}`);

// System language in ISO 639-1 defines which language will be used in WhatsApp for the user-visible text.
// Check the languages.js file for available languages.
const systemLanguage = getStringEnvVariable(process.env.SYSTEM_LANGUAGE, 'en');
exports.systemLanguage = systemLanguage;

// chromeDataPath is the path where the Google Chrome session will be stored.
const chromeDataPath = getStringEnvVariable(process.env.CHROME_DATA_PATH, './');
exports.chromeDataPath = chromeDataPath;

// automaticTranscription enables auto-detection of incoming voice messages to transcribe them.
const automaticTranscription = getBooleanEnvVariable(process.env.AUTOMATIC_TRANSCRIPTION);
exports.automaticTranscription = automaticTranscription;
console.log(automaticTranscription
    ? 'Automatic transcription for incoming voice messages is enabled.'
    : `Automatic transcription for incoming voice messages is not enabled. You need to use '${transcriptionCommands}'`);

const _speechRecognitionSystem = getStringEnvVariable(process.env.SPEECH_RECOGNITION_SYSTEM, '').toLowerCase();
let _sanitizedSpeechRecognitionSystem = '';
switch (_speechRecognitionSystem) {
    case 'google':
        _sanitizedSpeechRecognitionSystem = _speechRecognitionSystem;
        const googleCloudProjectID = getStringEnvVariable(process.env.GOOGLE_CLOUD_PROJECT_ID, null);
        exports.googleCloudProjectID = googleCloudProjectID;
        const googleCloudServiceAccountCredentialsFile = getStringEnvVariable(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_CREDENTIALS_FILE, null);
        exports.googleCloudServiceAccountCredentialsFile = googleCloudServiceAccountCredentialsFile;
        const googleCloudStorageBucket = getStringEnvVariable(process.env.GOOGLE_CLOUD_STORAGE_BUCKET, null);
        exports.googleCloudStorageBucket = googleCloudStorageBucket;
        const googleCloudSpeechLanguage = getStringEnvVariable(process.env.GOOGLE_CLOUD_SPEECH_LANGUAGE, null);
        exports.googleCloudSpeechLanguage = googleCloudSpeechLanguage;

const _alternativeLanguages = getStringEnvVariable(process.env.GOOGLE_CLOUD_SPEECH_ALTERNATIVE_LANGUAGES, '').split(',');
        // $array.filter(Boolean) filters out all empty elements.
        const googleCloudSpeechAlternativeLanguages = _alternativeLanguages.map(result => result.trim()).filter(Boolean);
        exports.googleCloudSpeechAlternativeLanguages = googleCloudSpeechAlternativeLanguages;

        if (googleCloudProjectID == null) {
            throw new Error('Environment variable GOOGLE_CLOUD_PROJECT_ID is required '
                + 'when using `google` as the speech recognition system.');
        }
        if (googleCloudServiceAccountCredentialsFile == null) {
            throw new Error('Environment variable GOOGLE_CLOUD_SERVICE_ACCOUNT_CREDENTIALS_FILE is required '
                + 'when using `google` as the speech recognition system.');
        }
        if (!fs.existsSync(googleCloudServiceAccountCredentialsFile)) {
            throw new Error('Environment variable GOOGLE_CLOUD_SERVICE_ACCOUNT_CREDENTIALS_FILE needs to point '
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
    case 'openai':
        _sanitizedSpeechRecognitionSystem = _speechRecognitionSystem;
        // The OpenAI class automatically gets the key from the environment variable.
        // We only check that this variable is set and do not export its value;
        const _openAIAPIKey = getStringEnvVariable(process.env.OPENAI_API_KEY, null);

        const openAITranslateToEnglish = getBooleanEnvVariable(process.env.OPENAI_TRANSLATE_TO_ENGLISH);
        exports.openAITranslateToEnglish = openAITranslateToEnglish;

        const _excludedLanguages = getStringEnvVariable(process.env.OPENAI_EXCLUDED_TRANSLATION_LANGUAGES, '').toLowerCase().split(',');
        // $array.filter(Boolean) filters out all empty elements.
        const openAIExcludedTranslationLanguages = _excludedLanguages.map(result => result.trim()).filter(Boolean);
        exports.openAIExcludedTranslationLanguages = openAIExcludedTranslationLanguages;

        if (_openAIAPIKey == null) {
            throw new Error('Environment variable OPENAI_API_KEY is required '
                + 'when using `openai` as the speech recognition system.');
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

const _saveStateDir = getStringEnvVariable(process.env.SAVE_STATE_DIR, './state');
exports.saveStateDir = _saveStateDir;

const _freshStateOnStart = getBooleanEnvVariable(process.env.NO_SAVED_STATE, false);
exports.freshStateOnStart = _freshStateOnStart;

const _userAgent = getStringEnvVariable(process.env.USER_AGENT, null);
exports.userAgent = _userAgent;

const _chromiumPath = getStringEnvVariable(process.env.CHROMIUM_PATH, null);
exports.chromiumPath = _chromiumPath;

const _playSlowMovie = getBooleanEnvVariable(process.env.PLAY_SLOW_MOVIE, false);
exports.playSlowMovie = _playSlowMovie;

const _slowMovieFile = getStringEnvVariable(process.env.SLOW_MOVIE_FILE, null);
exports.slowMovieFile = _slowMovieFile;

const _slowMovieSkipFrames = Number(getStringEnvVariable(process.env.SLOW_MOVIE_SKIP_FRAMES, "8"));
exports.slowMovieSkipFrames = _slowMovieSkipFrames; 

