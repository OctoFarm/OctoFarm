FROM node:lts-stretch

# Update Local Repository Index
RUN apt-get update
# Upgrade packages in the base image and apply security updates
RUN DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -yq
# Install package utils
RUN DEBIAN_FRONT=noninteractive apt-get install -yq apt-utils

# Remove package files fetched for install
RUN apt-get clean
# Remove unwanted files
RUN rm -rf /var/lib/apt/lists/

COPY . /app
WORKDIR /app

ENV NODE_ENV=production

RUN npm ci
RUN npm install -g pm2

EXPOSE 4000

COPY docker/monolithic-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
