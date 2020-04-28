FROM node:13.0.1-stretch

# Bundle APP files
COPY . app/

COPY package*.json app/

WORKDIR app/

RUN npm install

EXPOSE 4000

CMD [ "pm2-runtime", "start", "pm2.json" ]

