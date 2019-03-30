FROM node:10.11.0
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
COPY .dockerenv .env
EXPOSE 5001
CMD [ "npm", "run", "startDocker" ]
