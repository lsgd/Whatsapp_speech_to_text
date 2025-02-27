# WhatsApp Voice-To-Text Bot

This is a Speech-to-Text application for Whatsapp that
uses [Whatsapp-Web.js](https://github.com/pedroslopez/whatsapp-web.js) running on Docker and supports different speech
recognition systems:

- [Whisper](https://github.com/openai/whisper)
    - OpenWhisper (locally)
    - FasterWhisper (locally)
    - OpenAI Whisper (online API)
- [Google Speech-to-Text](https://cloud.google.com/speech-to-text)

<p>
  <img src="https://github.com/altbert/Whatsapp_speech_to_text/raw/main/media/Screenshot.jpg" width="400" title="Example">
</p>

### Description

Once authenticated on Whatsapp Web, the worker will transcribe all voice messages either automatically or when you reply
to the voice message with the command **!tran**. Currently, it is configured to only transcribe messages from contacts
saved in
your contact book.

If you want to contribute, just send a pull request.

### Usage

Just reply to the voice message you want to transcribe with **!tran**.

You can also turn on/off automatic transcription globally or per chat via chat commands.
Simply send **!help** in the chat to get an overview of the available commands. The bot commands can only be used by
you.

### Running the services

- To build the images, choose your compose file and run ```docker compose build```
- To run the containers run ```docker compose up -d```
- Display the logs for the node container with ```docker logs -f --tail 100 speech_to_text_node``` to see the QR code
  which is required to authenticate against the WhatsApp web client.

### Configurations

Check the detailed documentation of the different Speech-to-text implementations:

- [Google Speech-to-text API](./speech_google.md)
- [Local OpenWhisper](./speech_open-whisper.md)
- [Local FasterWhisper](./speech_google.md)
- [OpenAI Online API](./speech_openai-online-api.md)

### TODOs

- [ ] Persist configuration state of the bot based on chat message input
    - Currently, if transcription is disabled within a single chat this information will be lost when the service
      restarts.sh run_docker.sh start -d
