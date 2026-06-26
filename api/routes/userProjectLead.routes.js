import express from "express";
import { getUserProjectsLeads } from "../controllers/userProjectLead.controller.js";

const router = express.Router();

router.get("/user/:user_id/projects-leads", getUserProjectsLeads);

export default router;
