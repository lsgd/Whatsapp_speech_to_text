// Handles user-visible text strings in different languages.

const env = require('./environment');

const languages = {
    de: {
        successHeader: '*Transkript:*\n',
        errorHeader: '*Fehler:* Die Sprachnachricht konnte nicht transkribiert werden.',
    }, en: {
        successHeader: '*Transcription:*\n', errorHeader: '*Error:* The voice message could not be transcripted.',
    }
};

let selectedLanguage = env.systemLanguage;
if (!languages.hasOwnProperty(selectedLanguage)) {
    console.warn(`Selected SYSTEM_LANGUAGE='${env.systemLanguage}' does not exist. Fallback to English;`)
    selectedLanguage = 'en';
}

const successHeader = languages[selectedLanguage].successHeader;
const errorHeader = languages[selectedLanguage].errorHeader;

exports.successHeader = successHeader;
exports.errorHeader = errorHeader;
