import mongoose from "mongoose";

const productoSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    cantidad: {
        type: Number,
        required: true,
        trim: true
    },

    precio: {
        type: Number,
        required: true,
        trim: true
    },

    creado: {
        type: Date,
        default: Date.now()
    }
})

productoSchema.index({nombre: 'text'});

const Producto = mongoose.model('Producto', productoSchema);

export default Producto