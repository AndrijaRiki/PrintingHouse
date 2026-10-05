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

const printServiceSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    additionalPrice: {
        type: Number,
        required: true
    },
    maxWidthMm: {
        type: Number,
        required: true
    },
    maxHeightMm: {
        type: Number,
        required: true
    }
    },{
        _id: false
});

const reactionHistorySchema=new mongoose.Schema({
    date:{
        type:Date,
        required:true,
        default:Date.now
    },
    likeCount:{
        type:Number,
        required:true
    },
    dislikeCount:{
        type:Number,
        required:true
    },
    score:{
        type:Number,
        required:true
    }
},{
    _id:false
});

const productSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    printerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    unitPrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    colors: {
        type: [String],
        default: []
    },
    active: {
        type: Boolean,
        default: true
    },
    mainImage: {
        type: imageSchema,
        default: null
    },
    additionalImages: {
        type: [imageSchema],
        default: [],
        validate: {
        validator: (images: unknown[]) => images.length <= 3,
        message: "Proizvod može imati najviše 3 dodatne slike."
        }
    },
    printServices: {
        type: [printServiceSchema],
        default: []
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reactionHistory:{
        type:[reactionHistorySchema],
        default:[]
    }
    }, {
        versionKey: false
});

productSchema.index(
    { printerId: 1, code: 1 },
    { unique: true }
);

const ProductModel = mongoose.model('Product', productSchema);

export default ProductModel;