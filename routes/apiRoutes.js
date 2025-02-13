import express from "express";
import apiController from "../controllers/soapController.js";
import soapMethods from "../soap/soapMethods.js";

const router = express.Router();

// ✅ Подключаем JSON парсер для всех маршрутов
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/web-service/list', apiController.getWebServiceList());
router.get('/branch/list', apiController.getBranchList(soapMethods.NomadTerminalBranchList));

router.post('/request/get-ticket', async (req, res) => {
    try {
        const availableOperators = await apiController.availableOperators(soapMethods.NomadOperatorList(
            req.body.queueId, 
            req.body.branchId
        ));
        console.log('availableOperators:', availableOperators);
        console.log('type of availableOperators:', typeof availableOperators);
    } catch (error) {
        console.error("Ошибка в обработке запроса:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
