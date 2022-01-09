FROM node:14.17.6-stretch

# Update Local Repository Index
RUN apt-get update
# Upgrade packages in the base image and apply security updates
RUN DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -yq
# Install package utils
RUN DEBIAN_FRONT=noninteractive apt-get install -yq apt-utils
# Install MongoDB
RUN DEBIAN_FRONTEND=wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add
RUN DEBIAN_FRONTEND=echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
RUN DEBIAN_FRONTEND=noninteractive apt-getinstall mongodb-org
# Remove package files fetched for install
RUN apt-get clean
# Remove unwanted files
RUN rm -rf /var/lib/apt/lists/

COPY . /app
WORKDIR /app

RUN npm ci --production
RUN npm install -g pm2

EXPOSE 4000

COPY docker/monolithic-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
