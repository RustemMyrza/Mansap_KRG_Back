import express from "express";
import { sendTicketStatus, state } from "../controllers/soapController.js";
import apiController from "../controllers/soapController.js";
import responseHandlers from '../utils/responseHandlers.js';
import soapMethods from "../soap/soapMethods.js";
import redis from "../db/redisConnect.js";
import requestToDB from "../db/dbconnect.js";
import writeToLog from "../Log/toLog.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

async function allTicketList () {
    try {
        const ticketListToday = await apiController.ticketList(soapMethods.NomadAllTicketList('?'));
        const parsedTicketListToday = responseHandlers.ticketList(ticketListToday)
        return parsedTicketListToday;
    } catch (error) {
        console.error("Ошибка в обработке запроса:", error);
        return error;
    }
}

function getCorrectTicket(ticketList, { branchId, window, eventId }) {
    return ticketList.find(ticketInfo =>
        branchId === ticketInfo['$']['IdBranch'] &&
        window === ticketInfo['$']['WindowNum'] &&
        eventId === ticketInfo['$']['TicketNo'] &&
        ticketInfo['$']['State'] === 'INSERVICE'
    );
}

async function isEventInQueue(eventId) {
    const queue = await redis.lrange(eventId, 0, -1); // Получаем все элементы списка
  
    return queue.some(item => {
      const ticket = JSON.parse(item); // Разбираем JSON
      return ticket.eventId === eventId; // Проверяем eventId
    });
  }

router.get("*", async (req, res) => {
    const { branchId, window, eventId, local } = req.query;

    if (!branchId || !window || !eventId) {
        return res.status(400).json({ error: "Missing required query parameters" });
    }

    try {
        const ticketList = await allTicketList();
        const callingTicket = getCorrectTicket(ticketList, { branchId, window, eventId });
        state.requestCount += 1;

        if (state.requestCount === 2) {
            state.lever = true;
            if (!(await isEventInQueue(callingTicket['$']['EventId']))) {
                await redis.rpush(branchId, JSON.stringify({
                    branchId: branchId,
                    ticketNum: eventId,
                    eventId: callingTicket['$']['EventId'],
                    window: window,
                    operatorId: callingTicket['$']['IdOperator']
                }));

                await client.lTrim(branchId, -20, -1);
                console.log("🎫 Новый талон добавлен в очередь");
            } else {
                console.log("⚠️ Талон с таким eventId уже есть в очереди");
            }
        }

        sendTicketStatus(
            callingTicket['$']['EventId'],
            branchId,
            soapMethods.NomadEvent_Info,
            callingTicket
        );

        res.status(200).json({
            message: "Request received successfully",
            receivedQuery: { branchId, window, eventId },
        });
    } catch (error) {
        console.error("Ошибка при обработке запроса:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});




export default router;
