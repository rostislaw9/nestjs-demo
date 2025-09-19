FROM node:20-alpine

WORKDIR /app

COPY /package.json /yarn.lock ./
RUN yarn install --frozen-lockfile

RUN yarn global add @nestjs/cli

COPY . .
RUN yarn build

ARG PORT=3100
ENV PORT=$PORT

EXPOSE $PORT
CMD ["node", "dist/main.js"]
