# ---- Etapa 1: compilar Angular ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Etapa 2: servir con Nginx ----
FROM nginx:alpine
# Railway define la variable PORT; la plantilla la reemplaza al arrancar
ENV PORT=80
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/aquabalance-frontend/browser /usr/share/nginx/html
EXPOSE 80
