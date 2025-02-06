import xml2js from 'xml2js';

export const parseXml = (xmlString) => {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser();

        parser.parseString(xmlString, (err, result) => {
            if (err) {
                reject(new Error(`Ошибка при парсинге XML: ${err.toString()}`));
            } else {
                resolve(result);
            }
        });
    });
};
