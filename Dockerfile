# ==========================================
# Etapa 1: Construcción (Build Stage)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de definición de paquetes
COPY package*.json ./

# Instalar dependencias utilizando npm ci para instalaciones reproducibles y limpias
RUN npm ci

# Copiar el código fuente del proyecto
COPY . .

# Compilar la aplicación para producción
RUN npm run build

# ==========================================
# Etapa 2: Producción (Production Stage)
# ==========================================
FROM nginx:stable-alpine AS production

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80 del contenedor
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
