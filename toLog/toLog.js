import fs from "fs";

export default function writeToLog (logFile, message) {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`, 'utf8');
}