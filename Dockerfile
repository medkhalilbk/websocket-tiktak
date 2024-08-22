 
FROM node:alpine
 
WORKDIR /app
 
COPY package*.json ./
 
RUN npm install
 
COPY . .
 
RUN npm install -g typescript && npm install -g ts-node

RUN tsc
 
EXPOSE 8080 

CMD ["node", "server.js"]
