# Base image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Listen to all network interface
ENV HOST=0.0.0.0

# ENV DATABASE_URL=${DATABASE_URL}

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy prisma schema and generate the client
COPY prisma ./prisma
RUN npx prisma generate

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build

# Expose port
EXPOSE 3000

# Define entrypoint to automate deploying latest prisma migration
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

# Start the server using the production build
CMD [ "node", "dist/src/main.js" ]