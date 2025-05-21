import { getSoapClient } from '../soap/soapClient.js';
import { parseXml } from '../xmlParser.js';
import responseHandlers from '../utils/responseHandlers.js';
import requestToDB from '../db/dbconnect.js';
import sendSMS from '../sms-test.js';
import errorLog from '../Log/errorLog.js';
import dotenv from 'dotenv';
import redis from "../db/redisConnect.js";
import writeToLog from '../Log/toLog.js';

dotenv.config();

const url = {
    operator: `http://${process.env.OPERATOR_WSDL}?wsdl`,
    terminal: `http://${process.env.TERMINAL_WSDL}?wsdl`
};

const clients = [];
const ticketStatusCache = {}; // Глобальный кэш статусов билетов
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;
export const state = { lever: false, requestCount: 0 };


async function availableOperators(methodData) {
    try {
        const operatorClient = await getSoapClient(url.operator);

        if (!operatorClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
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
        errorLog(error);
    }
}

async function getTicket (methodData) {
    try {
        const terminalClient = await getSoapClient(url.terminal);

        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
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
        errorLog(error);
    }
}

const getBranchList = (methodData, retryCount = 0) => async (req, res) => {
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
        }

        terminalClient[methodData.name](methodData.args, methodData.options, async (err, result, rawResponse) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Ошибка SOAP запроса:`, err);
                if (retryCount < MAX_RETRIES) {
                    console.log(`Попытка ${retryCount + 1}/${MAX_RETRIES} через ${RETRY_DELAY / 1000} сек...`);
                    setTimeout(() => getBranchList(methodData, retryCount + 1)(req, res), RETRY_DELAY);
                    return;
                }

                res.status(500).json({ error: 'SOAP request failed', details: err.message });
                return;
            }

            console.log(`[${new Date().toISOString()}] Ответ получен!`);
            result.Branch = Array.isArray(result.Branch) ? result.Branch : [result.Branch];

            result.Branch = result.Branch.map(branch => {
                let parsedName = parseName(branch.attributes.workName);
                delete branch.attributes.workName;
                branch.attributes = {
                    ...branch.attributes,
                    ...parsedName
                };
                return branch;
            });

            const map = new Map();
            const tree = [];

            result.Branch.forEach(item => {
                const node = { ...item.attributes, children: [] };
                map.set(node.branchId, node);
            });

            result.Branch.forEach(item => {
                const node = map.get(item.attributes.branchId);
                const parentId = item.attributes.parentId;
            
                if (parentId === "null") {
                    tree.push(node);
                } else {
                    const parent = map.get(parentId);
                    if (parent) {
                        parent.children.push(node);
                    }
                }
            });

            res.json(tree);

        });
    } catch (error) {
        console.error("Ошибка при вызове SOAP-клиента:", error);
        errorLog(error);
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
    
    let services = await requestToDB('SELECT F_ID, F_NAME, F_ID_PARENT FROM t_g_queue;');
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

        // console.log("SOAP-клиент загружен:", terminalClient);

        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
        }

        return new Promise((resolve, reject) => {
            terminalClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
                // console.log("SOAP Response:", { err, result, rawResponse });

                if (err && !rawResponse) {
                    // Ошибка без полезного ответа – отклоняем промис
                    // console.error(`[${new Date().toISOString()}] Критическая ошибка SOAP:`, err);
                    return reject(err);
                }
                // console.warn(`[${new Date().toISOString()}] Ошибка SOAP, но есть данные:`, err);
                resolve(rawResponse || result);
            });
        });
    } catch (error) {
        // console.error("Ошибка при вызове SOAP-клиента:", error);
        errorLog(error);
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
        errorLog(error);
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
        errorLog(error);
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
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    clients.push(res);
    
    const interval = setInterval(async () => {
        const status = await sendTicketStatus(req.query.eventId, req.query.branchId, methodData);
    }, 5000);

    req.on('close', () => {
        state.lever = false;
        state.requestCount = 0;
        clearInterval(interval);
        clients.splice(clients.indexOf(res), 1);
        res.end();
    });
};


export const sendTicketStatus = async (eventId, branchId, methodData, call = null) => {
    try {
        let action = null;
        const ticketInfo = await getTicketInfo(methodData(eventId, branchId));
        const parsedTicketInfo = parseXml(ticketInfo);
        const objectTicketInfo = await responseHandlers.ticketInfo(parsedTicketInfo);

        const stateActionMap = {
            'INSERVICE': state.lever ? 'CALLING' : 'WAIT',
            'MISSED': 'MISSED',
            'WAIT': 'RESCHEDULLED',
            'DELAYED': 'DELAYED',
            'NEW': 'INQUEUE',
            'COMPLETED': 'COMPLETED'
        };

        const ticketState = objectTicketInfo.State;
        const windowNum = objectTicketInfo.WindowNum;
        
        action = stateActionMap[ticketState] || null;

        const data = action === 'CALLING' ? { ticketState, action, windowNum } : { ticketState, action };

        if (data) {
            ticketStatusCache[eventId] = { state: data.state, action: data.action, timestamp: Date.now() };
            clients.forEach(client => {
                client.write(`data: ${JSON.stringify(data)}\n\n`);
            });
        }
    } catch (error) {
        console.error('Ошибка при отправке данных SSE:', error);
    }
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
        errorLog(error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

async function rateService (methodData) {
    try {
        const terminalClient = await getSoapClient(url.terminal);

        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
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
        errorLog(error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

async function operatorTicketList (methodData) {
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
        errorLog(error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

const getVideoServerData = async (req, res) => {
    const branchId = req.query.branchId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendData = async () => {
        try {
            const ticketListJSON = await redis.lrange(branchId, 0, -1);
            const ticketList = ticketListJSON.map(ticket => JSON.parse(ticket));

            res.write(`data: ${JSON.stringify(ticketList)}\n\n`);
        } catch (error) {
            console.error(`Ошибка при получении данных с видеосервера: ${error}`);
            res.write(`data: {"error": "Ошибка при получении данных с видеосервера"}\n\n`);
        }
    };

    const intervalId = setInterval(sendData, 5000);

    req.on('close', () => {
        clearInterval(intervalId);
        console.log('Клиент отключился от SSE');
    });
};


const getSMS = async (req, res) => {
    const ticketNum = req.body.ticketNum;
    const phone = req.body.phoneNum;
    
    try {
        const result = await sendSMS({
            user: process.env.SMS_USER,
            pass: process.env.SMS_PASSWORD,
            from: 'HUMO',
            text: `Ваш талон ${ticketNum}. Пожалуйста, ожидайте вашей очереди.\n\nРақами навбатии шумо ${ticketNum} мебошад. Лутфан, навбати худро интизор шавед.`,
            to: phone
        });

        res.status(result.statusCode).json({
        message: 'Результат от SMS шлюза:',
        ...JSON.parse(result.body)
        });
    } catch (error) {
        res.status(500).json({
        error: 'Ошибка при отправке SMS',
        message: error.message
        });
    }
}


const removeEvent = async (req, res) => {
    const eventId = req.query.eventId;
    const branchId = req.query.branchId;

    if (!eventId || !branchId) {
        res.status(500).json({
            error: 'Произошла ошибка с параметрами'
        })
    }

    try {
        const queueTickets = await redis.lrange(branchId, 0, -1);
        for (const ticket of queueTickets) {
            const parsedTicket = JSON.parse(ticket);
            if (parsedTicket.eventId === eventId) {
                await redis.lrem(branchId, 1, ticket)
                break;
            }
        }
        res.status(200).json({
            message: 'Данные были успешно удалены с очереди'
        })
    } catch (error) {
        res.status(500).json({
            error: 'Ошибка при удалений с очереди Redis',
            message: error.message
        });
    }
}

async function eventCancel (methodData) {
    try {
        const terminalClient = await getSoapClient(url.terminal);
        writeToLog(methodData);
        if (!terminalClient[methodData.name]) {
            console.error(`[${new Date().toISOString()}] Метод ${methodData.name} не найден!`);
        }

        return new Promise((resolve, reject) => {
            terminalClient[methodData.name](methodData.args, methodData.options, (err, result, rawResponse) => {
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
        errorLog(error);
    }
}

export default { 
    getWebServiceList, 
    getBranchList, 
    availableOperators, 
    getTicketInfo, 
    getTicket,
    branchWindowList, 
    ticketInfoParser, 
    ticketList, 
    checkTicketState, 
    checkRedirectedTicket, 
    rateService, 
    sendTicketStatus,
    operatorTicketList,
    getVideoServerData,
    getSMS,
    removeEvent,
    eventCancel
};