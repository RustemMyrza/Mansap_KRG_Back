import express from "express";
import apiController from "../controllers/soapController.js";
import soapMethods from "../soap/soapMethods.js";
import responseHandlers from '../utils/responseHandlers.js';
import requestToDB from '../db/dbconnect.js';
import { parseXml } from '../xmlParser.js';
import writeToLog from "../Log/toLog.js";
import errorLog from "../Log/errorLog.js";

const router = express.Router();

// ✅ Подключаем JSON парсер для всех маршрутов
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/web-service/list', apiController.getWebServiceList(soapMethods.NomadTerminalMenuList));
router.get('/branch/list', apiController.getBranchList(soapMethods.NomadTerminalBranchList));

router.get('/get-count-queue-people', async (req, res) => {
    try {
        const branchId = req.query.branchId;
        const eventId = req.query.eventId;
        
        if (!branchId) {
            return res.status(400).json({ error: 'branchId is required' });
        }
        
        if (!eventId) {
            return res.status(400).json({ error: 'eventId is required' });
        }

        // Устанавливаем заголовки для SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Функция для отправки данных
        const sendData = async () => {
            try {
                // Получаем список билетов для сегодняшнего дня
                const ticketListToday = await apiController.ticketList(soapMethods.NomadAllTicketList('?'));
                const parsedTicketList = responseHandlers.newTicketList(ticketListToday);
                // res.json(parsedTicketList);
                const indexOfTicket = parsedTicketList.findIndex(ticket => ticket['EventId'] == eventId);
                
                // Формируем данные для отправки в SSE
                const data = { count: indexOfTicket };
                
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
        
    } catch (error) {
        console.error("Ошибка в обработке запроса:", error);
        errorLog(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/get-all-ticket', async (req, res) => {
    try {
        const ticketListToday = await apiController.ticketList(soapMethods.NomadAllTicketList('?'));
        const parsedTicketListToday = responseHandlers.ticketList(ticketListToday)
        res.json(parsedTicketListToday);
    } catch (error) {
        console.error("Ошибка в обработке запроса:", error);
        errorLog(error);
        res.status(500).json({ success: false, error: error.message });
    }
})

router.get('/get-ticket-status', apiController.checkTicketState(soapMethods.NomadEvent_Info))
router.post('/service-rate', async (req, res) => {
    const eventId = req.body.eventId;
    const rating = req.body.rating;
    const sqlRequestResult = await requestToDB(`SELECT F_ORDER_NUM FROM t_g_event WHERE F_ID = '${eventId}'`);
    const orderId = sqlRequestResult[0].F_ORDER_NUM;
    const parsedXMLResult = await apiController.rateService(soapMethods.NomadTerminalTicketRatingOrder(orderId, rating));
    const result = parsedXMLResult['soapenv:Envelope']['soapenv:Body'][0];
    res.json({
        message: result
    });
});
// router.get('/ticket/info', async (req, res) => {
//     const eventId = req.query.eventid;
//     const branchId = req.query.branchid;

//     console.log('eventId:', eventId);
//     console.log('branchid:', branchId);

//     if (!eventId) {
//         return res.status(400).json({ error: "eventid is required" });
//     }

//     let ticketInfo = await apiController.getTicketInfo(soapMethods.NomadEvent_Info(eventId, branchId));
//     ticketInfo = parseXMLtoJSON(ticketInfo);
//     console.log('ticketInfo:', ticketInfo);
//     // const structuredTicketInfo = responseHandlers.ticketInfo(ticketInfo);
//     // console.log('structuredTicketInfo:', structuredTicketInfo);
// });
    // req.body
    // apiController.getTicketInfo(soapMethods.NomadEvent_Info())

router.post('/request/get-ticket', async (req, res) => {
    try {
        const availableOperators = await apiController.availableOperators(soapMethods.NomadOperatorList(
            req.body.queueId, 
            req.body.branchId
        ));
        const availableOperatorsList = responseHandlers.availableOperators(availableOperators)
        // if (availableOperatorsList.length > 0) {
            const ticket = await apiController.getTicket(soapMethods.NomadTerminalEvent_Now2(
                req.body.queueId,
                req.body.iin,
                req.body.phoneNum,
                req.body.branchId,
                req.body.local
            ));
            const ticketData = responseHandlers.getTicket(ticket);
            res.status(200).json(ticketData);
        // } else {
        //     throw new Error ('Нет подходящих операторов');
        // }
    } catch (error) {
        console.error("Ошибка в обработке запроса:", error);
        errorLog(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/request/get-ticket-sms', apiController.getSMS)

router.get('/get-redirected-ticket', apiController.checkRedirectedTicket(soapMethods.NomadEvent_Info, soapMethods.NomadAllTicketList('?')));
router.get('/get-ticket-info', async (req, res) => {
    const eventId = req.query.eventId;
    const branchId = req.query.branchId;
    const XMLResult = await apiController.getTicketInfo(soapMethods.NomadEvent_Info(eventId, branchId));
    const parsedXMLResult = parseXml(XMLResult);
    const parsedTicketData = await responseHandlers.ticketInfo(parsedXMLResult);
    res.json(parsedTicketData);
})

router.get('/get-video-server-data', apiController.getVideoServerData);
router.delete('/remove-ticket-queue', apiController.removeEvent);
router.delete('/cancel-event', async (req, res) => {
    const iin = req.query.iin;
    const branchId = req.query.branchId;
    
    if (!iin || !branchId) {
        res.status(500).json({
            error: 'Произошла ошибка с параметрами'
        })
    }

    const XMLResult = await apiController.eventCancel(soapMethods.NomadTerminalEventSimpleCancel(req.query.branchId, req.query.iin))
    const parsedResultData = await responseHandlers.eventCancel(XMLResult);
    console.log(parsedResultData);
    if (
        Number(parsedResultData['cus:IsCanceled'][0]) === 1 && 
        parsedResultData['cus:IIN'][0] === iin
    ) {
        res.status(200).json({
            success: true,
            branchId: branchId,
            iin: iin,
            message: `Event with parameters branchId - ${branchId}, iin - ${iin} was successfully canceled`
        })
    } else {
        res.status(500).json({
            success: false,
            error: 'Произошла ошибка при попытке отмены Event'
        })
    }
})
export default router;
