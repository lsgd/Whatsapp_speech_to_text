# docker-compose.override.yml should expose your environment keys
# start: run_docker.sh up -d
# logs: rund_docker.sh logs -f
# build: rund_docker.sh build [--no-cache]
docker compose -f docker-compose.openai-online-api.yml -f ../docker-compose.override.whatsapp.yml "$@"
