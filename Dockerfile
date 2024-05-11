FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./

COPY . .

RUN npx prisma generate

RUN NODE_OPTIONS="--max-old-space-size=8192" npm run build


ENTRYPOINT ["npm", "run", "start:prod"]
