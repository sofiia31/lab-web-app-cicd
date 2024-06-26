FROM node:14

# Створюємо директорію додатку у контейнері
WORKDIR /app

# Копіюємо package.json та package-lock.json для встановлення залежностей
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код додатку до контейнера
COPY ./src .

# Виконуємо команду для запуску додатку
CMD [ "node", "app.js" ]