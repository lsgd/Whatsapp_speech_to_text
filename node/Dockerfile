FROM oven/bun:debian

RUN apt-get update
RUN apt-get install -y wget gnupg2

# Install Chromium.
RUN \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable && \
  rm -rf /var/lib/apt/lists/*


RUN mkdir /app

COPY index.js /app/
COPY state.js /app/
COPY environment.js /app/
COPY speech_google.js /app/
COPY speech_whisper.js /app/
COPY speech_openai.js /app/
COPY languages.js /app/
COPY package.json /app/

WORKDIR /app

RUN bun pm trust protobufjs || true
RUN bun install

CMD ["bun","index.js"]
