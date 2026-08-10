FROM node:20-bookworm-slim

# System Chromium + fonts for certificate / report PDF generation (Puppeteer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-core \
    fonts-noto-extra \
    ca-certificates \
    libnss3 \
    libatk-bridge2.0-0t64 \
    libgtk-3-0t64 \
    libgbm1 \
    libasound2t64 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libpangocairo-1.0-0 \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist
COPY views ./views

EXPOSE 3000
CMD ["node", "dist/server.js"]
