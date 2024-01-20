# Using OpenAI Whisper online API

OpenAI offers a [Transcription API](https://platform.openai.com/docs/api-reference/audio/createTranscription) that can
be used to transcribe audio files
to text.

## 1. Workflow

1. Download the voice audio from WhatsApp
2. Upload the voice audio to the OpenAI Whisper Transcription API
3. Parse the returned transcription
4. If enabled, send transcription to the OpenAI Whisper Translation API
5. Parse the returned translation

## 2. Pricing

Using the online API of OpenAI is not free of charge.
However, the charges are quite low!

As of 2024-01-20, for transcribing speech-to-text, OpenAI charges
you `USD 0.006 / minute (rounded to the nearest second)`. This means that 17.3 seconds of a voice message costs you 18
seconds = 0.18 US Cent.  
_(Source: https://openai.com/pricing)_

## 3. Limitations

The online API has rate-limits and and upload limit for abuse protection.

### Rate limits

Rate-limits are defined here: https://platform.openai.com/docs/guides/rate-limits/rate-limits  
and you can check them for your account here: https://platform.openai.com/account/limits (Look for the _Audio_ category
and the entry _whispher-*_)

### Upload limit

> By default, the Whisper API only supports files that are less than 25 MB. If you have an audio file that is longer
> than that, you will need to break it up into chunks of 25 MB's or less [...]

_(Source: https://platform.openai.com/docs/guides/speech-to-text/longer-inputs)_

Our current implementation __does not split larger files__ into 25MB chunks!  
Larger voice messages than 25MB are therefore currently not supported out-of-the-box.

## 4. Setup an API key

In order to use the online API of OpenAI, you need to create an account at https://platform.openai.com, setup billing
properly and top-up your account with some money.

Once you have your account ready, go to https://platform.openai.com/api-keys and follow the instructions to create a new
API key.

## 5. Environment variables

You need to pass the following additional environment variables in order to run our node service with the OpenAI online
Whisper API.

1. `SPEECH_RECOGNITION_SYSTEM = 'openai'` to tell the node service to use the OpenAI online API as backend.
2. `OPENAI_API_KEY: 'my-private-key'` has the OpenAI Whisper API key.
    - You can generate an API key on https://platform.openai.com/api-keys
3. `OPENAI_TRANSLATE_TO_ENGLISH: true` whether voice messages shall be translated to English as well.
    - OpenAI supports only translating from other languages _to_ English.
4. `OPENAI_EXCLUDED_TRANSLATION_LANGUAGES: 'english,german'` to disable translations when one of the comma-separated
   languages is detected.
    - `OPENAI_TRANSLATE_TO_ENGLISH` needs to be enabled.
    - It's unclear which naming scheme is used for the languages! Details
      on https://platform.openai.com/docs/guides/speech-to-text/supported-languages

## 6. Example docker compose configuration

An example configuration can be found in [docker-compose.openai-online-api.yml](./docker-compose.openai-online-api.yml).