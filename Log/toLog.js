import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve('logs', 'appLog.log');

export default function writeToLog(message) {
    fs.appendFile(logFilePath, `${new Date().toISOString()} - ${message}\n`, 'utf8', (err) => {
        if (err) console.error('Ошибка записи лога:', err);
    });
}