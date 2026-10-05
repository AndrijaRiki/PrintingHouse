import mongoose from 'mongoose';

const selectedPrintServiceSchema = new mongoose.Schema({
    type: {type: String, required: true},
    additionalPrice: {type: Number, required: true},
    maxWidthMm: {type: Number, required: true},
    maxHeightMm: {type: Number, required: true}
}, {_id: false});

const customizationImageSchema = new mongoose.Schema({
    data: {type: Buffer},
    contentType: {type: String}
}, {_id: false});

const customizationSchema = new mongoose.Schema({
    text: {type: String, default: null},
    image: {type: customizationImageSchema, default: null}
}, {_id: false});

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        default: 'Bela'
    },
    selectedPrintService: {
        type: selectedPrintServiceSchema,
        default: null
    },
    customization: {
        type: customizationSchema,
        default: null
    },
    totalPrice: {
        type: Number,
        required: true
    }
}, {_id: false});

const institutionSnapshotSchema = new mongoose.Schema({
    name: String,
    address: String,
    city: String,
    registrationNumber: String,
    taxId: String
}, {_id: false});

const customerSnapshotSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    clientType: String,
    institution: {
        type: institutionSnapshotSchema,
        default: null
    }
}, {_id: false});

const printerSnapshotSchema = new mongoose.Schema({
    name: String,
    address: String,
    city: String,
    registrationNumber: String,
    taxId: String
}, {_id: false});

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    printerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    issuedAt: {
        type: Date,
        default: null
    },
    customerSnapshot: {
        type: customerSnapshotSchema,
        required: true
    },
    printerSnapshot: {
        type: printerSnapshotSchema,
        required: true
    },
    items: {
        type: [orderItemSchema],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'RSD'
    },
    status: {
        type: String,
        enum: [
            'ordered',
            'paid',
            'printing',
            'delivered',
            'received',
            'cancelled'
        ],
        default: 'ordered'
    },
    stripeSessionId: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.model('Order', orderSchema);