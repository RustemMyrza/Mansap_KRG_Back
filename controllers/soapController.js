import { getSoapClient } from '../soap/soapClient.js';
import { parseXml } from '../xmlParser.js';
import responseHandlers from '../utils/responseHandlers.js';
import mysql from 'mysql2/promise';
import requestToDB from '../db/dbconnect.js';

const url = {
    operator: 'http://192.168.101.7:3856?wsdl',
    terminal: 'http://192.168.101.7:3857?wsdl'
};

async function getOperatorClient(methodData) {
    try {
        const operatorClient = await getSoapClient(url.operator);

        if (!operatorClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            throw new Error('SOAP method not found');
        }

        return new Promise((resolve, reject) => {
            operatorClient[methodData.name](methodData.args, methodData.options, async (err, result, rawResponse) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                    return reject(err);
                }

                console.log(`[${new Date().toISOString()}] Ответ получен!`);

                try {
                    const parsedResult = await parseXml(rawResponse);
                    const serviceList = responseHandlers.serviceList(parsedResult);
                    resolve(serviceList); // ✅ Возвращаем результат
                } catch (parseErr) {
                    console.error(`[${new Date().toISOString()}] Ошибка парсинга XML:`, parseErr);
                    reject(parseErr);
                }
            });
        });
    } catch (error) {
        console.error("Ошибка при вызове SOAP-клиента:", error);
        throw error;
    }
}



const getWebServiceList = () => async (req, res) => {
    const tree = [];
    const map = new Map();

    function parseName(name) {
        const parts = name.split(';');
        const parsed = {};
      
        for (const part of parts) {
          const [lang, value] = part.split('=');
          if (lang && value) {
            parsed[`name_${lang.toLowerCase()}`] = value.trim();
          }
        }
      
        return parsed;
    }
    
    let services = await requestToDB('SELECT F_ID, F_NAME, F_WEB_VISIBLE, F_ID_PARENT FROM t_g_queue WHERE F_ID_PARENT IS NOT NULL AND F_WEB_VISIBLE = 1')

    services = services.map(service => ({
        queueId: service.F_ID,
        parentId: service.F_ID_PARENT,
        visible: service.F_WEB_VISIBLE,
        ...parseName(service.F_NAME)
    }))

    services.forEach(item => {
        map.set(item.queueId, { ...item, children: [] });
    });
    
    // Формируем иерархию
    services.forEach(item => {
        if (map.has(item.parentId)) {
            map.get(item.parentId).children.push(map.get(item.queueId));
        } else {
            tree.push(map.get(item.queueId));
        }
    });
    return res.json(tree);
};

export default { getWebServiceList };