import mongoose from 'mongoose';

const bidItemSchema = new mongoose.Schema({
    requestedItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    _id: false
});

const procurementBidSchema = new mongoose.Schema({
    procurementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PublicProcurement',
        required: true
    },
    printerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: [bidItemSchema],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

procurementBidSchema.index(
    { procurementId: 1, printerId: 1 },
    { unique: true }
);

const ProcurementBidModel = mongoose.model(
    'ProcurementBid',
    procurementBidSchema
);

export default ProcurementBidModel;