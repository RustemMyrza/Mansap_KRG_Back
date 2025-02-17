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

export function parseXMLtoJSON(xml) {
    // Находим тег <xsd:element ... />
    const match = xml.match(/<xsd:element\s+([^>]+)\/>/);
    if (!match) {
        console.error("Не найден xsd:element");
        return {};
    }

    // Извлекаем строку с атрибутами
    const attributesString = match[1];

    // Разбираем атрибуты формата key="value"
    const attributesArray = attributesString.match(/([\w:.-]+)="([^"]*)"/g);

    const jsonObject = {};
    if (attributesArray) {
        attributesArray.forEach(attr => {
            const parts = attr.match(/([\w:.-]+)="([^"]*)"/);
            if (parts) {
                const key = parts[1];
                const value = parts[2];
                jsonObject[key] = value;
            }
        });
    }

    return jsonObject;
}