FROM node:14.16-stretch

# Update Local Repository Index
RUN apt-get update
# Upgrade packages in the base image and apply security updates
RUN DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -yq
#Add mongodb repo
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add
RUN echo 'deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.4 main' | tee /etc/apt/sources.list.d/mongodb.list
RUN apt-get update
# Install package utils
RUN DEBIAN_FRONT=noninteractive apt-get install -yq --no-install-recommends apt-utils
# Install MongoDB
RUN DEBIAN_FRONT=noninteractive apt-get install -yq --no-install-recommends ca-certificates
RUN DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends mongodb-org

# Remove package files fetched for install
RUN apt-get clean
# Remove unwanted files
RUN rm -rf /var/lib/apt/lists/

COPY . /app
WORKDIR /app/server

ENV NODE_ENV=production
ENV MONGO=mongodb://127.0.0.1:27017/octofarm

RUN npm install -g npm@latest
RUN npm install -g pm2

RUN npm ci --omit=dev

EXPOSE 4000
WORKDIR /app

COPY docker/monolithic-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
