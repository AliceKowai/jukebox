# 1. Usa uma imagem leve do Node.js (Linux Alpine)
FROM node:18-alpine

# 2. Cria a pasta do app dentro do container
WORKDIR /app

# 3. Copia os arquivos de dependências primeiro (para aproveitar o cache)
COPY package*.json ./

# 4. Instala as bibliotecas
RUN npm install

# 5. Copia o resto do código do projeto
COPY . .

# 6. Avisa que o app usa a porta 3001
EXPOSE 3001

# 7. O comando para ligar o servidor
CMD ["node", "server.js"]