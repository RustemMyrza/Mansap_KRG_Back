import fs from 'fs';
import path from 'path';

const logDir = path.resolve('logs');
const logFilePath = path.join(logDir, 'appLog.log');
console.log(logFilePath);
// Проверяем существование папки и создаем её при необходимости
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

export default function writeToLog(message) {
    const formattedMessage = typeof message === 'object' 
        ? JSON.stringify(message, null, 2) 
        : message;

    fs.appendFile(logFilePath, `${new Date().toISOString()} - ${formattedMessage}\n`, 'utf8', (err) => {
        if (err) console.error('Ошибка записи в лог:', err);
    });
}
