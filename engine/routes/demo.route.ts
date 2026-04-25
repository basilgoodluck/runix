import { Router } from "express";
import { codeAgentHandler } from "@/agents/code-agent";
import { financeAgentHandler } from "@/agents/finance-agent";
import { researchAgentHandler } from "@/agents/research-agent";


export const demoRouter = Router();

demoRouter.post("/demo/code",     codeAgentHandler);
demoRouter.post("/demo/finance",  financeAgentHandler);
demoRouter.post("/demo/research", researchAgentHandler);