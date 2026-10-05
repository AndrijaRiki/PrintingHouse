import mongoose from 'mongoose';

const productCommentSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    username: {
        type: String,
        required: true
    },

    text: {
        type: String,
        required: true,
        maxlength: 500
    }
}, {
    timestamps: true,
    versionKey: false
});

const ProductCommentModel = mongoose.model('ProductComment', productCommentSchema);

export default ProductCommentModel;