# Basis-Image
FROM node:23-slim

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package.json & package-lock.json kopieren (für effizientes Caching)
COPY package.json package-lock.json ./

# Abhängigkeiten installieren
RUN npm install

# SvelteKit Build kopieren
COPY . .

# Synchronisiere SvelteKit-Projekt, um fehlende tsconfig.json zu generieren
RUN npm run prepare

# Migrate the database
RUN npm run db:push --force

# Kopiere .env.example und benenne sie in .env um, falls keine existiert
RUN cp .env.example .env

# Build durchführen
RUN npm run build

# Exponiere den Port
EXPOSE 3000

# Start der App
CMD ["node", "build"]