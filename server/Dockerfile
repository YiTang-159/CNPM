FROM node:20-alpine
WORKDIR /app
# Render TTS locally, including VI/EN/ZH; FFmpeg muxes true MP3/MP4 files.
RUN apk add --no-cache ffmpeg espeak-ng
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY shared ./shared
COPY db ./db
COPY server ./server
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
