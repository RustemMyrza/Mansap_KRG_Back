import { getSoapClient } from '../soap/soapClient.js';
import { parseXml } from '../xmlParser.js';
import responseHandlers from '../utils/responseHandlers.js';
import requestToDB from '../db/dbconnect.js';
import writeToLog from '../Log/toLog.js';
import dotenv from 'dotenv';

dotenv.config();

const url = {
    operator: `http://${process.env.OPERATOR_WSDL_IP}?wsdl`,
    terminal: `http://${process.env.TERMINAL_WSDL_IP}?wsdl`
};

async function availableOperators(methodData) {
    try {
        const operatorClient = await getSoapClient(url.operator);

        if (!operatorClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            throw new Error('SOAP method not found');
        }

        return new Promise((resolve, reject) => { // ✅ Возвращаем новый Promise
            operatorClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                    return reject(err);
                }

                console.log(`[${new Date().toISOString()}] Ответ получен!`);
                const parsedResponse = parseXml(rawResponse);
                resolve(parsedResponse); // ✅ Возвращаем результат
            });
        });
    } catch (error) {
        console.error("Ошибка при вызове SOAP-клиента:", error);
        throw error;
    }
}

async function getTicket (methodData) {
    try {
        const terminalClient = await getSoapClient(url.terminal);

        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            throw new Error('SOAP method not found');
        }

        return new Promise((resolve, reject) => {
            terminalClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                    return reject(err);
                }
    
                console.log(`[${new Date().toISOString()}] Ответ получен!`);
                const parsedResponse = parseXml(rawResponse);
                resolve(parsedResponse);
            })
        })
    } catch (error) {
        console.error("Ошибка при вызове SOAP-клиента:", error);
        throw error;
    }
}

const getBranchList = (methodData) => async (req, res) => {
    const tree = []
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

    try {
        const terminalClient = await getSoapClient(url.terminal);

        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            throw new Error('SOAP method not found');
        }

        terminalClient[methodData.name](methodData.args, methodData.options, async (err, result, rawResponse) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                return reject(err);
            }

            console.log(`[${new Date().toISOString()}] Ответ получен!`);
            result.Branch = result.Branch.map(branch => {
                let parsedName = parseName(branch.attributes.workName);
                delete branch.attributes.workName;
                branch.attributes = {
                    ...branch.attributes,
                    ...parsedName
                }
                return branch;
            });
            result.Branch.forEach(item => {
                const node = { ...item.attributes, children: [] };
                map.set(node.branchId, node);
                
                if (node.parentId === "null") {
                    tree.push(node);
                } else {
                    const parent = map.get(node.parentId);
                    if (parent) {
                        parent.children.push(node);
                    } else {
                        map.set(node.parentId, { children: [node] });
                    }
                }
            });
            res.json(tree)
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
    
    let services = await requestToDB('SELECT F_ID, F_NAME, F_WEB_VISIBLE, F_ID_PARENT FROM t_g_queue WHERE F_WEB_VISIBLE = 1');
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


async function getTicketInfo(methodData) {
    try {
        const terminalClient = await getSoapClient(url.terminal);

        console.log("SOAP-клиент загружен:", terminalClient);

        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            throw new Error('SOAP method not found');
        }

        return new Promise((resolve, reject) => {
            terminalClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                console.log("SOAP Response:", { err, result, rawResponse });

                if (err && !rawResponse) {
                    // Ошибка без полезного ответа – отклоняем промис
                    // console.error(`[${new Date().toISOString()}] Критическая ошибка SOAP:`, err);
                    return reject(err);
                }

                console.warn(`[${new Date().toISOString()}] Ошибка SOAP, но есть данные:`, err);
                resolve(rawResponse || result);
            });
        });
    } catch (error) {
        console.error("Ошибка при вызове SOAP-клиента:", error);
        throw error;
    }
}

async function cancelTheQueue (methodData) {
    try {
        const operatorClient = await getSoapClient(url.operator);

        if (!operatorClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            throw new Error('SOAP method not found');
        }

        return new Promise((resolve, reject) => {
            operatorClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                    return reject(err);
                }
    
                console.log(`[${new Date().toISOString()}] Ответ получен!`);
                console.log('rawResponse:', rawResponse);
                // const parsedResponse = parseXml(rawResponse);
                // resolve(parsedResponse);
            })
        })
    } catch (error) {        
        console.error("Ошибка при вызове SOAP-клиента:", error);
        throw error;
    }
}

async function branchWindowList (methodData) {
    try {
        const operatorClient = await getSoapClient(url.operator);

        if (!operatorClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            return res.status(500).json({ error: 'SOAP method not found' });
        }
        return new Promise((resolve, reject) => {
            operatorClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                    return reject(err);
                }
    
                console.log(`[${new Date().toISOString()}] Ответ получен!`);
                const xmlData = parseXml(rawResponse);
                resolve(xmlData);
            });
        })

    } catch (error) {        
        console.error("Ошибка при вызове SOAP-клиента:", error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

async function ticketList (methodData) {
    try {
        const operatorClient = await getSoapClient(url.operator);

        if (!operatorClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            return res.status(500).json({ error: 'SOAP method not found' });
        }
        return new Promise((resolve, reject) => {
            operatorClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                    return reject(err);
                }
    
                console.log(`[${new Date().toISOString()}] Ответ получен!`);
                const xmlData = parseXml(rawResponse);
                resolve(xmlData);
            });
        })

    } catch (error) {        
        console.error("Ошибка при вызове SOAP-клиента:", error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

function ticketInfoParser (ticketData) {
    ticketData = ticketData
        .replace(/<soapenv:Envelope[\s\S]*?<xsd:element/, '') // Убираем начало SOAP-обертки
        .replace(/\/>\s*<\/soapenv:Body>\s*<\/soapenv:Envelope>/, ''); // Убираем конец SOAP-обертки
    ticketData = Object.fromEntries(
        ticketData
            .trim()
            .split("\n")
            .map(line => {
                const match = line.match(/(\w+)='(.*)'/);
                return match ? [match[1], match[2]] : null;
            })
            .filter(Boolean)
    );
    return ticketData;
}

const checkTicketState = (methodData) => async (req, res) => {
    // Устанавливаем заголовки для SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Функция для отправки данных
    const sendData = async () => {
        try {
            // Получаем список билетов для сегодняшнего дня
            let data;
            const ticketInfo = await getTicketInfo(methodData(req.query.eventId, req.query.branchId));
            const parsedTicketInfo = parseXml(ticketInfo);
            const objectTicketInfo = await responseHandlers.ticketInfo(parsedTicketInfo);
            // res.json(parsedTicketList);
            const stateActionMap = {
                'INSERVICE': (objectTicketInfo.ServTime == 0) ? 'WAIT' : 'CALLING',
                'MISSED': 'MISSED',
                'WAIT': 'RESCHEDULLED',
                'DELAYED': 'DELAYED',
                'NEW': 'INQUEUE',
                'COMPLETED': 'COMPLETED'
            };
            
            const state = objectTicketInfo.State;
            const action = stateActionMap[state] || null; // Возвращаем null, если состояние не найдено в маппинге
            
            data = null;
            
            if (action) {
                data = { 
                    state: state,
                    action: action
                };
            }
            
            
            // Отправляем данные как событие SSE
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
            console.error('Ошибка при получении данных для SSE:', error);
        }
    };

    // Отправляем данные сразу при подключении
    sendData();

    // Устанавливаем интервал для отправки данных каждые 30 секунд
    const interval = setInterval(sendData, 5000);
    
    // Закрываем соединение при завершении подключения клиента
    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
    // res.json(parsedTicketInfo);
};


const checkRedirectedTicket = (eventMethodData, allTicketMethodData) => async (req, res) => {
    try {
        const branchId = req.query.branchId;
        const eventId = req.query.eventId;
        const xmlTicketInfo = await getTicketInfo(eventMethodData(eventId, branchId));
        const parsedTicketInfo = parseXml(xmlTicketInfo);
        const structuredTicketInfo = await responseHandlers.ticketInfo(parsedTicketInfo);

        const xmlAllTicketData = await ticketList(allTicketMethodData);
        const structuredNewTicketData = responseHandlers.newTicketList(xmlAllTicketData);
        if (structuredNewTicketData.length > 0) {
            const redirectedTicket = responseHandlers.redirectedTicket(structuredNewTicketData, structuredTicketInfo);
            res.json(redirectedTicket);
        } else {
            res.status(400).json({
                success: false,
                message: "Ticket did not redirected"
            });
        }
    } catch (error) {
        console.error("Ошибка при вызове SOAP-клиента:", error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

async function rateService (methodData) {
    try {
        const terminalClient = await getSoapClient(url.terminal);

        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
            throw new Error('SOAP method not found');
        }

        return new Promise((resolve, reject) => { // ✅ Возвращаем новый Promise
            terminalClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                    return reject(err);
                }

                console.log(`[${new Date().toISOString()}] Ответ получен!`);
                const parsedResponse = parseXml(rawResponse);
                resolve(parsedResponse); // ✅ Возвращаем результат
            });
        });
    } catch (error) {
        console.error("Ошибка при вызове SOAP-клиента:", error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

export default { getWebServiceList, getBranchList, availableOperators, getTicketInfo, getTicket, cancelTheQueue, branchWindowList, ticketInfoParser, ticketList, checkTicketState, checkRedirectedTicket, rateService };