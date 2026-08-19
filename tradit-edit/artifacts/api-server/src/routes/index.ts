import { Router, type IRouter } from "express";
import healthRouter from "./health";
import traditRouter from "./tradit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(traditRouter);

export default router;
