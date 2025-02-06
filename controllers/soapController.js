import { getSoapClient } from '../soap/soapClient.js';
import { parseXml } from '../xmlParser.js';
import responseHandlers from '../utils/responseHandlers.js';

const url = {
    operator: 'http://10.10.111.85:3856?wsdl',
    terminal: 'http://10.10.111.85:3857?wsdl'
};

const getData = (methodData) => async (req, res) => {
    console.log(`[${new Date().toISOString()}] Создаём SOAP клиент...`);
    try {
        const client = await getSoapClient(url.operator); // Получаем клиент или используем уже созданный

        if (!client[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            return res.status(500).json({ error: 'SOAP method not found' });
        }

        console.log(`[${new Date().toISOString()}] Вызываем ${methodData.name}...`);

        client[methodData.name](methodData.args, methodData.options, async (err, result, rawResponse) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                return res.status(500).json({ error: "SOAP request failed", message: err.toString() });
            }

            console.log(`[${new Date().toISOString()}] Ответ получен!`);

            try {
                const parsedResult = await parseXml(rawResponse);
                const result = responseHandlers.serviceList(parsedResult);
                return res.json(result);
            } catch (parseErr) {
                console.error(`[${new Date().toISOString()}] Ошибка парсинга XML:`, parseErr);
                res.status(500).json({ error: "Error parsing XML", message: parseErr.toString() });
            }
        });

    } catch (err) {
        console.error(`[${new Date().toISOString()}] Ошибка SOAP клиента:`, err);
        res.status(500).json({ error: 'SOAP client creation failed', message: err.toString() });
    }
};
  
const postData = (req, res) => {
    const receivedData = req.body;
    console.log(receivedData);
    res.status(201).json({
        message: 'Data received successfully',
        receivedData
    });
};

export default { getData, postData };