import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const subcategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
});

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    subcategories: {
        type: [subcategorySchema],
        default: []
    }
});

const CategoryModel = mongoose.model(
    'Category',
    categorySchema
);

export default CategoryModel;