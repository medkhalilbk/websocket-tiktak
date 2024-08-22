FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g typescript && npm install -g ts-node

RUN tsc  # This will now compile to 'dist/' directory

EXPOSE 8080

CMD ["node", "dist/server.js"]  # Adjust based on your 'outDir'
