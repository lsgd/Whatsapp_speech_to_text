FROM python:3.11-bullseye as base

# Using intermediate images so that we don't rebuild everything if something
# fails later on
FROM base as pybuilder
RUN set -eux; \
        apt update; \
        apt install -y --no-install-recommends \
        libolm-dev \
        ; \
        rm -rf /var/lib/apt/lists/*
COPY requirements.txt /requirements.txt
RUN pip install -U pip setuptools wheel && pip install --user -r /requirements.txt && rm /requirements.txt


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
# enable debug output during preload
ENV DEBUG=1
# predownload the model
RUN python3 model.py

FROM runner
WORKDIR /app

EXPOSE 5000
CMD [ "gunicorn", "api:app", "-w", "2", "--threads", "2", "-b", "0.0.0.0:5000" ]

