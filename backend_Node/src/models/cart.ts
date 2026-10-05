import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    data: {
        type: Buffer,
        required: true
    },
    contentType: {
        type: String,
        required: true
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

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
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

    selectedPrintServiceType: {
        type: String,
        default: null
    },

    customization: {
        type: customizationSchema,
        default: null
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    items: {
        type: [cartItemSchema],
        default: []
    }
}, {
    timestamps: true,
    versionKey: false
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;