FROM node

# Install Chromium.
RUN \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable && \
  rm -rf /var/lib/apt/lists/*


RUN mkdir /app

COPY index.js /app/index.js
COPY configuration.js /app/configuration.js
COPY environment.js /app/environment.js
COPY speech_google.js /app/speech_google.js
COPY speech_whisper.js /app/speech_whisper.js
COPY speech_openai.js /app/speech_openai.js
COPY languages.js /app/languages.js
COPY package.json /app/package.json

WORKDIR /app

RUN npm install

CMD ["node","index.js"]
