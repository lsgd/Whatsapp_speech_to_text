// Handles user-visible text strings in different languages.

const env = require('./environment');

const languages = {
    de: {
        successHeader: '*Transkript:*\n',
        errorHeader: '*Fehler:* Die Sprachnachricht konnte nicht transkribiert werden.',
        couldNotDownloadAudio: '*Fehler:* Die Sprachnachricht konnte nicht geladen werden.',
        commands: {
            enabled: 'aktiviert',
            disabled: 'deaktiviert',
            help: '*Transkription-Bot:*\n' +
                `- Verwende "${env.transcriptionCommands.join('" oder "')}" um eine Sprachnachricht zu transkribieren.\n` +
                `- "!transcription-global=on/off": Automatische Transkription global an- oder abschalten.\n` +
                `- "!transcription=on/off": Automatische Transkription für diesen Chat an- oder abschalten.\n` +
                `- "!status": Aktuellen Status einsehen.\n` +
                `- "!help": Diesen Hilfetext anzeigen.`,
            status: '*Transkription-Bot:*\n' +
                '- Globale Transkription ist {globalStatus}.\n' +
                '- Transkription für diesen Chat ist {chatStatus}.',
            globalTranscription: '*Transkription-Bot:*\nAutomatische globale Transkription ist ab jetzt {status}.',
            chatTranscription: '*Transkription-Bot:*\nAutomatische Transkription in diesem Chat ist ab jetzt {status}.',


        },
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