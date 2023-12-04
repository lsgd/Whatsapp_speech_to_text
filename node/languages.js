// Handles user-visible text strings in different languages.

const env = require('./environment');

const languages = {
    de: {
        successHeader: '*Transkript:*\n',
        errorHeader: '*Fehler:* Die Sprachnachricht konnte nicht transkribiert werden.',
        couldNotDownloadAudio: '*Fehler:* Die Sprachnachricht konnte nicht geladen werden.',
    },
    en: {
        successHeader: '*Transcription:*\n',
        errorHeader: '*Error:* The voice message could not be transcripted.',
        couldNotDownloadAudio: '*Error:* Couldn\'t download the audio part of the voice message.',
    }
};

let selectedLanguage = env.systemLanguage;
if (!languages.hasOwnProperty(selectedLanguage)) {
    console.warn(`Selected SYSTEM_LANGUAGE='${env.systemLanguage}' does not exist. Fallback to English;`)
    selectedLanguage = 'en';
}

exports.text = languages[selectedLanguage];