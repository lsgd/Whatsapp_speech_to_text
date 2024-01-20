# Using Faster-Whisper locally

> faster-whisper is a reimplementation of OpenAI's Whisper model using CTranslate2, which is a fast inference engine for
Transformer models.

_(Source: https://pypi.org/project/faster-whisper/)_

## 1. Workflow

1. Download the voice audio from WhatsApp
2. Send the voice audio to the local API running on the Whisper service
3. Parse the returned transcription

## 2. Configure our Whisper service

### Find your model version

Decide which model version you want to use: The larger the model, the better the transcription, but the more memory is
required to run in.

The documentation on https://github.com/openai/whisper has a list of the available models.  
As of 2024-01-20, the possible values are: `tiny`, `base`, `small`, `medium` and `large`.

### Configure the model version

You need to set the model version __twice__ in the compose file:

1. Set it in `build > args > MODEL_SIZE`
2. Set it in `environment > MODEL_SIZE`

### Use a GPU

If you want to use a GPU, copy the following section to the whisper service in your compose file and edit it
accordingly:

``` yml
deploy:
   resources:
      reservations:
         devices:
         - driver: nvidia
            count: 1
            capabilities: [gpu]
```

Check the official docker compose documentation for more details at https://docs.docker.com/compose/gpu-support/.

## 3. Configure the node service

### Environment variables

You need to pass the following additional environment variables in order to run our node service with the local
FasterWhisper
model:

1. `SPEECH_RECOGNITION_SYSTEM = 'whisper'` to tell the node service to use the local API with Whisper as backend.
2. `WHISPER_API_ADDRESS` points to the HTTP endpoint of your Whisper container.
    - Usually, this points to `http://` _+ CONTAINER_NAME +_ `:5000` where `CONTAINER_NAME` is the name of your
      container running the Whisper model and our API script.

## 4. Example docker compose configuration

An example configuration can be found in [docker-compose.faster-whisper.yml](./docker-compose.faster-whisper.yml).