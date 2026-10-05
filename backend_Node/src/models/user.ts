import mongoose from 'mongoose';

const profileImageSchema = new mongoose.Schema({
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

const institutionSchema = new mongoose.Schema({
    name: String,
    address: String,
    city: String,
    registrationNumber: String,
    taxId: String
}, {
    _id: false
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    firstname: {
        type: String,
        required: true
    },

    lastname: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['admin', 'client', 'printer'],
        required: true
    },

    clientType: {
        type: String,
        enum: ['individual', 'company'],
        default: null
    },

    profileImage: {
        type: profileImageSchema,
        default: null
    },

    status: {
        type: String,
        enum: ['pending', 'active', 'rejected', 'deleted'],
        default: 'pending'
    },

    institution: {
        type: institutionSchema,
        default: null
    }

}, {
    versionKey: false
});

const User = mongoose.model('User', userSchema);

export default User;