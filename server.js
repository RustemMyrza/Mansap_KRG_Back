import express from 'express';
import soap from 'soap';
import cors from 'cors';
import xml2js from 'xml2js';
import apiRoutes from './routes/apiRoutes.js';

const app = express();
const port = 3001;

app.use(cors());
app.use('/api', apiRoutes);

// app.get('/get-soap-data', async (req, res) => {
//     const url = 'http://10.10.111.85:3856?wsdl';

//     console.log(`[${new Date().toISOString()}] Создаём SOAP клиент...`);

//     soap.createClient(url, (err, client) => {
//         if (err) {
//             console.error(`[${new Date().toISOString()}] Ошибка создания SOAP клиента:`, err);
//             return res.status(500).json({ error: 'SOAP client creation failed', message: err.toString() });
//         }

//         console.log(`[${new Date().toISOString()}] SOAP клиент успешно создан!`);

//         if (!client.NomadOperatorQueueList) {
//             console.error(`[${new Date().toISOString()}] Метод NomadOperatorQueueList не найден!`);
//             return res.status(500).json({ error: 'SOAP method not found' });
//         }

//         console.log(`[${new Date().toISOString()}] Вызываем NomadOperatorQueueList...`);
        
//         const requestArgs = {
//             "cus:NomadOperatorQueueList_Input": {
//                 "cus:SessionIdQueueList": "?" // Укажи нужный SessionId
//             }
//         };
        
//         const options = {
//             overrideRootElement: {
//                 namespace: "cus",
//                 xmlnsAttributes: [
//                     { name: "xmlns:cus", value: "http://nomad.org/CustomUI" }
//                 ]
//             }
//         };
        
//         client.NomadOperatorQueueList(requestArgs, options, (err, result, rawResponse) => {
//             if (err) {
//                 console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
//                 return res.status(500).json({ error: "SOAP request failed", message: err.toString() });
//             }
        
//             console.log(`[${new Date().toISOString()}] Ответ получен!`);

//             const parser = new xml2js.Parser();

//             parser.parseString(rawResponse, (parseErr, parsedResult) => {
//                 if (parseErr) {
//                     console.error(`[${new Date().toISOString()}] Ошибка при парсинге XML:`, parseErr);
//                     return res.status(500).json({ error: "Error parsing XML", message: parseErr.toString() });
//                 }
//                 res.json(parsedResult);
//             });
//         });
        
//     });
// });

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
