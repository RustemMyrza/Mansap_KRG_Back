import express from "express";
import apiController from "../controllers/soapController.js";
import soapMethods from "../soap/soapMethods.js";

const router = express.Router();

router.get('/service/list', apiController.getData(soapMethods.NomadOperatorQueueList))

export default router;