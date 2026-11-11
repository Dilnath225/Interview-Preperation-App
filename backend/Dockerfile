# =========================================================
# Stage 1: Build TypeScript and Prisma Client
# =========================================================
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# =========================================================
# Stage 2: Production Image (Google Cloud Run Ready)
# =========================================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install system dependencies:
# - python3 & python3-pip for Certificate Generation pipeline
# - libreoffice-writer-nogui for headless DOCX to PDF conversion on Linux
# - fonts-dejavu & fonts-liberation for pristine font rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    libreoffice-writer-nogui \
    fonts-dejavu \
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements for Certificate Generator
RUN pip3 install --no-cache-dir --break-system-packages python-docx openpyxl

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production
RUN npx prisma generate

# Copy compiled JavaScript files from builder
COPY --from=builder /app/dist ./dist

# Copy certificate generator templates and scripts
COPY ["certificate generator", "./certificate generator/"]

# Ensure upload directories exist
RUN mkdir -p uploads/certificates uploads/resumes uploads/avatars

# Port 5000 default (Google Cloud Run overrides with $PORT dynamically)
EXPOSE 5000

CMD ["node", "dist/server.js"]
