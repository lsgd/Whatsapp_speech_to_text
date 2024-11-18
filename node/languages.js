// Handles user-visible text strings in different languages.

const env = require('./environment');

function template(strings, ...keys) {
	  return (...values) => {
		      const dict = values[values.length - 1] || {};
		      const result = [strings[0]];
		      keys.forEach((key, i) => {
			            const value = Number.isInteger(key) ? values[key] : dict[key];
			            result.push(value, strings[i + 1]);
			          });
		      const withSpace = result.join("");
		      return withSpace.replace(/^\s*/gm, '');
		    };
}

const languages = {
    de: {
        successHeader: '*Transkript:*\n',
        errorHeader: '*Fehler:* Die Sprachnachricht konnte nicht transkribiert werden.',
        couldNotDownloadAudio: '*Fehler:* Die Sprachnachricht konnte nicht geladen werden.',
        commands: {
            enabled: 'aktiviert',
            disabled: 'deaktiviert',
            help: '*Transkription-Bot:*\n' +
                `- Antworte auf eine Sprachnachricht mit "${env.transcriptionCommands.join('" oder "')}" um diese zu transkribieren.\n` +
                `- "!transcription-global=on/off": Automatische Transkription global an- oder abschalten.\n` +
                `- "!transcription=on/off": Automatische Transkription für diesen Chat an- oder abschalten.\n` +
                `- "!status": Aktuellen Status einsehen.\n` +
                `- "!help": Diesen Hilfetext anzeigen.`,
            helpUnauthorized: '*Transkription-Bot:*\n' +
                'Alles in Ordnung?\nNur ein Witz..., aber du bist nicht authorisiert um weitreichende Änderungen vorzunehmen.\n' +
                `Antworte auf eine Sprachnachricht mit "${env.transcriptionCommands.join('" oder "')}" um diese zu transkribieren.` +
                `Gib "!help" ein, um diesen Hilfetext anzeigen.`
	},
	templates: {
            status: template`*Transkription-Bot:*\n\
                - Globale Transkription ist ${"globalStatus"}.\n\
                - Transkription für diesen Chat ist ${"chatStatus"}\n\
		- Current image: ${"currentFrame"}.`,
            globalTranscription: template`*Transkription-Bot:*\nAutomatische globale Transkription ist ab jetzt ${"status"}.`,
            chatTranscription: template`*Transkription-Bot:*\nAutomatische Transkription in diesem Chat ist ab jetzt ${"status"}.`,
        },
    },
    en: {
        successHeader: '*Transcription:*\n',
        errorHeader: '*Error:* The voice message could not be transcripted.',
        couldNotDownloadAudio: '*Error:* Couldn\'t download the audio part of the voice message.',
        commands: {
            enabled: 'enabled',
            disabled: 'disabled',
            help: '*Transcription-Bot:*\n' +
                `- Respond to a voice message with "${env.transcriptionCommands.join('" or "')}" to trigger transcription.\n` +
                `- "!transcription-global=on/off": Enable / disable automatic transcription globally.\n` +
                `- "!transcription=on/off": Enable / disable automatic transcription within the current chat.\n` +
                `- "!status": Show current status.\n` +
                `- "!help": Show this help text.`,
            helpUnauthorized: '*Transcription-Bot:*\n' +
                'Are you okay?\nJust joking..., but you are not authorized to run any commands of this bot.\n' +
                `However, you can respond to a voice message with "${env.transcriptionCommands.join('" or "')}" to trigger transcription.` +
                `Send "!help" to see this text again.`
	},
	templates: {
            status: template`*Transcription-Bot:*\n\
                - Global transcription is ${"globalStatus"}.\n\
                - Transcription within this chat is ${"chatStatus"}.\n\
		- Current image: ${"currentFrame"}.`,
            globalTranscription: template`*Transcription-Bot:*\nAutomatic global transcription is now ${"status"}.`,
            chatTranscription: template`*Transcription-Bot:*\nAutomatic transcription within this chat is now ${"status"}.`,
        },
    }
};

let selectedLanguage = env.systemLanguage;
if (!languages.hasOwnProperty(selectedLanguage)) {
    console.warn(`Selected SYSTEM_LANGUAGE='${env.systemLanguage}' does not exist. Fallback to English;`)
    selectedLanguage = 'en';
}

exports.text = languages[selectedLanguage];
