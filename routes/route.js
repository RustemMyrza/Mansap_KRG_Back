import express from "express";
import { sendTicketStatus, state } from "../controllers/soapController.js";
import apiController from "../controllers/soapController.js";
import responseHandlers from '../utils/responseHandlers.js';
import soapMethods from "../soap/soapMethods.js";
import writeToLog from "../Log/toLog.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

async function allTicketList () {
    try {
        const ticketListToday = await apiController.ticketList(soapMethods.NomadAllTicketList);
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


router.get("*", async (req, res) => {
    const { branchId, window, eventId } = req.query;

    if (!branchId || !window || !eventId) {
        return res.status(400).json({ error: "Missing required query parameters" });
    }

    try {
        const ticketList = await allTicketList();
        const callingTicket = getCorrectTicket(ticketList, { branchId, window, eventId });
        
        writeToLog(JSON.stringify(callingTicket));

        state.requestCount += 1;

        if (state.requestCount === 2) {
            state.lever = true;
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
