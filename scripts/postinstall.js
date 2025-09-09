#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Получаем путь к CLI файлу
const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');

try {
  // Проверяем что файл существует
  if (fs.existsSync(cliPath)) {
    // Устанавливаем исполняемые права для всех пользователей
    fs.chmodSync(cliPath, '755');
    console.log('✓ Set executable permissions for cfrok CLI');
  }
} catch (err) {
  // Игнорируем ошибки - может не быть прав, но это не критично
  console.warn('Could not set executable permissions:', err.message);
}
