// Добавляем красок консоли
require('colors').setTheme({
  info: ['black', 'bgBlue'],
  data: ['black', 'bgMagenta'],
  help: ['black', 'bgCyan'],
  warn: ['black', 'bgYellow'],
  error: ['black', 'bgRed'],
});

// Загружаем переменные окружения
require('dotenv').config();

// Запускаем сервер
require('./server');
