import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve('logs', 'appLog.log');

export default function writeToLog(message) {
    // Если message — объект, преобразуем в форматированный JSON
    const formattedMessage = typeof message === 'object' 
        ? JSON.stringify(message, null, 2) 
        : message;

    fs.appendFile(logFilePath, `${new Date().toISOString()} - ${formattedMessage}\n`, 'utf8', (err) => {
    });
}