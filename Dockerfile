FROM node:23.6.0-alpine

WORKDIR /app

COPY package.json .

RUN npm install

RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE 5174

CMD [ "serve", "-s", "dist", "-l", "5174" ]