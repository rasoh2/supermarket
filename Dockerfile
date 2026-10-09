FROM node:22-slim

WORKDIR /workspace

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar frontend
RUN npm run build

# Exponer el puerto
EXPOSE 8080

# Iniciar servidor
CMD ["npm", "start"]
