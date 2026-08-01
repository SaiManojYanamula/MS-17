FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000
# Apply pending migrations before every start — docker-compose's `command:`
# override did this locally, but Railway (and anywhere else running this
# Dockerfile directly, ignoring compose) needs it baked into the image itself.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
