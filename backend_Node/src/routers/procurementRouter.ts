import express from 'express';
import { PublicProcurementController } from '../controllers/procurement.controller'

const publicProcurementRouter = express.Router();

publicProcurementRouter.post('/create', (req, res) => {
    new PublicProcurementController().createPublicProcurement(req, res);
});

publicProcurementRouter.get('/open', (req, res) => {
    new PublicProcurementController().getOpenProcurements(req, res);
});

publicProcurementRouter.get('/user/:userId', (req, res) => {
    new PublicProcurementController().getUserProcurements(req, res);
});

publicProcurementRouter.get('/:procurementId/bid/:printerId', (req, res) => {
    new PublicProcurementController().getPrinterBid(req, res);
});

publicProcurementRouter.post('/:procurementId/bid', (req, res) => {
    new PublicProcurementController().placeBid(req, res);
});

export default publicProcurementRouter;