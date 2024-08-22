 
FROM node:18
 
WORKDIR / 
 
COPY package*.json ./
 
RUN npm install
 
COPY . .
 
RUN npm install -g typescript
 
RUN tsc
 
EXPOSE 8080 

CMD ["node", "server.js"]
