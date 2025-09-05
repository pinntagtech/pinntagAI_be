import { Router } from "express";
import { runETL } from "../controllers/ETL.controller.js";

const router = Router();

router.post("/run", runETL);

export default router;
