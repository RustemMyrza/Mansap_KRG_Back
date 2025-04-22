import fs from 'fs';
import path from 'path';

// Путь к папке logs и файлу error.log
const logDir = path.resolve('logs');
const logFilePath = path.join(logDir, 'error.log');

// Создание папки, если её нет
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Функция логгирования ошибок
export default function logError(error) {
    const timestamp = new Date().toISOString();
    
    // Форматируем сообщение (если это Error объект, строка или что-то другое)
    let formattedMessage = '';

    if (error instanceof Error) {
        formattedMessage = `${error.name}: ${error.message}\n${error.stack}`;
    } else if (typeof error === 'object') {
        formattedMessage = JSON.stringify(error, null, 2);
    } else {
        formattedMessage = String(error);
    }

    const logEntry = `${timestamp} - ${formattedMessage}\n\n`;

    fs.appendFile(logFilePath, logEntry, 'utf8', (err) => {
        if (err) console.error('Ошибка записи в лог:', err);
    });
}
