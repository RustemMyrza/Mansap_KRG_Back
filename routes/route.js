import express from "express";
import writeToLog from "../Log/toLog.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("*", (req, res) => {
    const { branchId, window, eventId } = req.query;

    // Проверяем, переданы ли параметры
    if (!branchId || !window || !eventId) {
        return res.status(400).json({ error: "Missing required query parameters" });
    }

    // Отвечаем клиенту
    writeToLog('Request was getting');
    res.status(200).json({
        message: "Request received successfully",
        receivedQuery: { branchId, window, eventId },
    });
});

export default router;
