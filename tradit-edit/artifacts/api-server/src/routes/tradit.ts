import { Router, type IRouter } from "express";
import {
  CreateCheckoutBody,
  CreateCheckoutResponse,
  DecideTradeInBody,
  DecideTradeInParams,
  DecideTradeInResponse,
  GetCreditBalanceResponse,
  GetDashboardResponse,
  ListProductsResponse,
  UploadTradeInBody,
  UploadTradeInResponse,
} from "@workspace/api-zod";
import {
  analyzeTradeIn,
  createOrder,
  decideTradeIn,
  getCreditBalance,
  getDashboard,
  listProducts,
} from "../lib/tradit-store";

const router: IRouter = Router();

router.get("/products", (_req, res): void => {
  res.json(ListProductsResponse.parse(listProducts()));
});

router.get("/dashboard", (_req, res): void => {
  res.json(GetDashboardResponse.parse(getDashboard()));
});

router.get("/credit", (_req, res): void => {
  res.json(GetCreditBalanceResponse.parse(getCreditBalance()));
});

router.post("/trade-ins/upload", (req, res): void => {
  const parsed = UploadTradeInBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid trade-in upload");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = analyzeTradeIn(parsed.data.imageData);
    res.status(201).json(
      UploadTradeInResponse.parse({
        id: result.id,
        status: result.status,
        brand: result.brand,
        model: result.model,
        condition: result.condition,
        estimatedValue: result.estimatedValue,
        creditOffer: result.creditOffer,
        message: "Our scan is ready. Review the offer before you decide.",
      }),
    );
  } catch (error) {
    const knownError = error instanceof Error ? error : new Error("Unable to scan this photo.");
    const status = knownError.name === "DuplicateUploadError" ? 409 : knownError.name === "RateLimitError" ? 429 : 400;
    req.log.warn({ err: knownError, status }, "Trade-in upload rejected");
    res.status(status).json({ error: knownError.message });
  }
});

router.post("/trade-ins/:id/decision", (req, res): void => {
  const params = DecideTradeInParams.safeParse(req.params);
  const body = DecideTradeInBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Choose whether to accept or decline this offer." });
    return;
  }
  try {
    const result = decideTradeIn(params.data.id, body.data.decision);
    if (!result) {
      res.status(404).json({ error: "Trade-in offer not found." });
      return;
    }
    res.json(DecideTradeInResponse.parse(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update this offer.";
    res.status(400).json({ error: message });
  }
});

router.post("/checkout", (req, res): void => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Add at least one pair to your bag." });
    return;
  }
  try {
    res.status(201).json(CreateCheckoutResponse.parse(createOrder(parsed.data.items)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete checkout.";
    req.log.warn({ err: error }, "Checkout rejected");
    res.status(400).json({ error: message });
  }
});

export default router;