import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    data: {
        type: Buffer,
        default: null
    },
    contentType: {
        type: String,
        default: null
    }
}, {
    _id: false
});

const customizationSchema = new mongoose.Schema({
    text: {
        type: String,
        default: null
    },
    previewImage: {
        type: imageSchema,
        default: null
    },
    printImage: {
        type: imageSchema,
        default: null
    }
}, {
    _id: false
});

const procurementItemSchema = new mongoose.Schema({
    originalProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    color: {
        type: String,
        default: "Bela"
    },
    printService: {
        type: String,
        default: null
    },
    customization: {
        type: customizationSchema,
        default: null
    }
});

const publicProcurementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: [procurementItemSchema],
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'processing', 'awarded', 'no_offers', 'cancelled'],
        default: 'open'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    winnerPrinterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    winningBidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProcurementBid',
        default: null
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

publicProcurementSchema.index({
    status: 1,
    expiresAt: 1
});

const PublicProcurementModel = mongoose.model(
    'PublicProcurement',
    publicProcurementSchema
);

export default PublicProcurementModel;