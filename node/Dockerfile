FROM oven/bun:alpine

RUN apk update
RUN apk upgrade

RUN apk add chromium

RUN mkdir /app

COPY package.json /app/


WORKDIR /app

RUN bun pm trust protobufjs || true
RUN bun install

COPY index.js /app/
COPY state.js /app/
COPY environment.js /app/
COPY speech_google.js /app/
COPY speech_whisper.js /app/
COPY speech_openai.js /app/
COPY speech_openai_4o_transcribe.js /app/
COPY languages.js /app/
COPY runbun.sh /app/

CMD ["runbun.sh"]
