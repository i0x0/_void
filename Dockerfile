FROM node:16

ARG PORT

WORKDIR /usr/src

COPY ./ ./

RUN yarn

RUN yarn build

EXPOSE ${PORT}

ENTRYPOINT ["node", "dist/server.js"]
