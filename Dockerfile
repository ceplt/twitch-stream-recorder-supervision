FROM node:20.12.2-alpine

ARG ENVIRONMENT="dev"
ARG APP_FOLDER_NAME="twitch-stream-recorder-supervision"
ARG APP_FOLDER_PATH="/app/${APP_FOLDER_NAME}"

ENV REACT_APP_API_URL=http://localhost:3001
ENV CONFIG=../config/config.${ENVIRONMENT}.json

RUN mkdir -p ${APP_FOLDER_PATH}

WORKDIR ${APP_FOLDER_PATH}

COPY . ${APP_FOLDER_PATH}

EXPOSE 3000

CMD npm run install:all; npm run start
