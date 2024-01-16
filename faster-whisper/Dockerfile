FROM python:3.12-bookworm as base

# Using intermediate images so that we don't rebuild everything if something
# fails later on
FROM base as pybuilder
RUN set -eux; \
        apt update; \
        apt install -y --no-install-recommends \
        libolm-dev \
        ; \
        rm -rf /var/lib/apt/lists/*

RUN pip install -U pip setuptools wheel && \
    pip install --user --no-cache-dir faster-whisper && \
    pip install --user --no-cache-dir flask && \
    pip install --user --no-cache-dir gunicorn

FROM base as runner
RUN set -eux; \
        apt update; \
        apt install -y --no-install-recommends \
        libolm-dev \
        ; \
        rm -rf /var/lib/apt/lists/*
COPY --from=pybuilder /root/.local /usr/local
COPY *.py /app/

WORKDIR /app

ARG MODEL_SIZE
ENV MODEL_SIZE=$MODEL_SIZE

# predownload the model
RUN python3 model.py

FROM runner
WORKDIR /app

EXPOSE 5000

CMD [ "gunicorn", "api:app", "-w", "2", "--threads", "2", "-b", "0.0.0.0:5000", "--timeout", "900" ]
