FROM node:13.0.1-stretch
WORKDIR /app

COPY . .
RUN npm install -g pm2

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
