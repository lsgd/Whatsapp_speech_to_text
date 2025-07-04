#FROM oven/bun:alpine
FROM node:current-alpine3.19

RUN apk update
RUN apk upgrade

RUN apk add --no-cache chromium ffmpeg font-inconsolata

RUN mkdir /app

COPY package.json /app/

WORKDIR /app

RUN bun pm trust protobufjs || true
RUN bun install
#RUN npm install

COPY index.js /app/
COPY state.js /app/
COPY environment.js /app/
COPY speech_google.js /app/
COPY speech_whisper.js /app/
COPY speech_openai.js /app/
COPY languages.js /app/
COPY slow_movie.js /app/
COPY runbun.sh /app/
COPY runnode.sh /app/

#CMD ["runbun.sh"]
CMD ["runnode.sh"]
