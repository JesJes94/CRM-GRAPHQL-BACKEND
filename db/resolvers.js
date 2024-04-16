import Usuario from "../models/Usuario.js";
import Producto from "../models/Producto.js";
import Cliente from "../models/Cliente.js";
import Pedido from "../models/Pedido.js";
import generarJWT from "../helpers/generarJWT.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const resolvers = {
    Query: {
        obtenerUsuario: async (_, {}, ctx) => {
            return ctx.usuario
        },

        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({})
                return productos
            } catch (error) {
                console.log(error)
            }
        },

        obtenerProducto: async (_, {id}) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('Producto no encontrado');
            }

            const producto = await Producto.findById(id);

            if(!producto) {
                throw new Error('Producto no encontrado');
            }

            return producto;
        },

        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (error) {
                console.log(error)
            }
        },

        obtenerClientesVendedor: async(_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({vendedor: ctx.usuario.id.toString()});
                return clientes
            } catch (error) {
                console.log(error);
            }
        },

        obtenerCliente: async(_, {id}, ctx) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('El cliente no existe');
            }

            const cliente = await Cliente.findById(id);


            if(!cliente) {
                throw new Error('El cliente no existe')
            }

            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos')
            }

            return cliente
        },

        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerPedidosVendedor: async (_, {}, ctx) => {
            try {
                const pedidosVendedor = await Pedido.find({vendedor: ctx.usuario.id.toString()}).populate('cliente');
                return pedidosVendedor;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerPedido: async (_, {id}, ctx) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('Pedido no encontrado');
            }

            const pedido = await Pedido.findById(id);

            if(!pedido) {
                throw new Error('Pedido no encontrado');
            }

            if(pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos');
            }

            return pedido;
        },

        obtenerPedidosEstado: async (_, {estado}, ctx) => {

            const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado});

            return pedidos;
            
        },

        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                { $match: {estado: "Completado"}},
                { $group: {
                    _id : "$cliente",
                    total: { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'cliente'
                    }
                },
                {
                    $limit: 10
                },
                {
                    $sort : {total: - 1} 
                }
            ]);

           return clientes;
        },

        mejoresVendedores: async () => {

            const vendedores = await Pedido.aggregate([
                { $match: {estado: 'Completado'}},         
                { $group: {
                    _id: '$vendedor',
                    total: { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor' 
                    }
                },
                {
                    $limit: 3
                },
                { 
                    $sort: {total: - 1}
                }
            ]);

            return vendedores
        },

        buscarProducto: async (_, {texto}) => {
            const productos = await Producto.find({ $text: { $search: texto}}).limit(10);

            return productos;
        }
    },

    Mutation: {
        nuevoUsuario: async (_, {input}) => {

            const {email} = input
            
            //Revisar si el usuario está registrado

            const existeUsuario = await Usuario.findOne({email});

            if(existeUsuario) {
                throw new Error('El usuario ya está registrado')
            }

            //Guardar en DB

            try {
                const usuario = new Usuario(input);
                await usuario.save();
                return usuario;
            } catch (error) {
                console.log(error)
            }
        },

        autenticarUsuario: async (_, {input}) => {
            const {email, password} = input

            const existeUsuario = await Usuario.findOne({email});

            if(!existeUsuario) {
                throw new Error('El usuario no existe');
            }

            if(!await existeUsuario.comprobarPassword(password)) {
                throw new Error('El password es incorrecto')
            } 

            return {
                token: generarJWT(existeUsuario)
            }
        },

        nuevoProducto: async (_, {input}) => {
            try {
                const producto = new Producto(input);
                await producto.save();
                return producto;
            } catch (error) {
                console.log(error);
            }
        },

        actualizarProducto: async (_, {id, input}) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('Producto no encontrado');
            }

            let producto = await Producto.findById(id);

            if(!producto) {
                throw new Error('Producto no encontrado');
            }

            producto = await Producto.findOneAndUpdate({_id: id}, input, {new: true});

            return producto;
        },

        eliminarProducto: async (_, {id}) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('Producto no encontrado');
            }

            const producto = await Producto.findById(id);

            if(!producto) {
                throw new Error('Producto no encontrado');
            }       

            await producto.deleteOne()

            return 'Producto eliminado'
        },

        nuevoCliente: async (_, {input}, ctx) => {
            const {email} = input;

            const cliente = await Cliente.findOne({email});

            if(cliente) {
                throw new Error('El cliente ya está registrado')
            }

            try {
                const nuevoCliente = new Cliente(input);
                nuevoCliente.vendedor = ctx.usuario.id;
                await nuevoCliente.save();
                return nuevoCliente;
            } catch (error) {
                console.log(error);
            }

        },

        actualizarCliente: async (_, {id, input}, ctx) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('El cliente no existe');
            }

            let cliente = await Cliente.findById(id);

            if(!cliente) {
                throw new Error('El cliente no existe')
            }

            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos')
            }

            cliente = await Cliente.findOneAndUpdate({_id: id}, input, {new: true});
            return cliente;
  
        },

        eliminarCliente: async (_, {id}, ctx) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('El cliente no existe');
            }

            let cliente = await Cliente.findById(id);

            if(!cliente) {
                throw new Error('El cliente no existe')
            }

            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos')
            }

            await cliente.deleteOne();

            return 'Cliente eliminado'

        },

        nuevoPedido: async (_, {input}, ctx) => {

            const {cliente, pedido} = input

            const id_valido = mongoose.Types.ObjectId.isValid(cliente);

            if(!id_valido) {
                throw new Error('El cliente no existe');
            }

            const existeCliente = await Cliente.findById(cliente);

            if(!existeCliente) {
                throw new Error('El cliente no existe');
            }

            if(existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos');
            }

            for await (const articulo of pedido) {
                const producto = await Producto.findById(articulo.id);

                if(producto.cantidad < articulo.cantidad) {
                    throw new Error(`El artículo ${producto.nombre} excede la cantidad del stock`);
                } else {
                    producto.cantidad = producto.cantidad - articulo.cantidad;
                    await producto.save();
                }
            }

            try {
                const nuevoPedido = new Pedido(input);
                nuevoPedido.vendedor = ctx.usuario.id;
                await nuevoPedido.save();
                return nuevoPedido;
            } catch (error) {
                console.log(error);
            }           
        },

        actualizarEstado: async(_, {id, input}, ctx) => {
            const {cliente} = input

            const id_valido = mongoose.Types.ObjectId.isValid(id);

            const cliente_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('El pedido no existe');
            }

            const existePedido = await Pedido.findById(id);

            if(!existePedido) {
                throw new Error('El pedido no existe');
            }

            if(!cliente_valido) {
                throw new Error('El cliente no existe');
            }

            const existeCliente = await Cliente.findById(cliente);

            if(!existeCliente) {
                throw new Error('El cliente no existe');
            }

            if(existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos');
            }

            const resultado = await Pedido.findOneAndUpdate({_id: id}, input, {new: true})
            return resultado;
        }
        ,

        actualizarPedido: async (_, {id, input}, ctx) => {

            const {cliente, pedido} = input

            const id_valido = mongoose.Types.ObjectId.isValid(id);

            const cliente_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('El pedido no existe');
            }

            const existePedido = await Pedido.findById(id);

            if(!existePedido) {
                throw new Error('El pedido no existe');
            }

            if(!cliente_valido) {
                throw new Error('El cliente no existe');
            }

            const existeCliente = await Cliente.findById(cliente);

            if(!existeCliente) {
                throw new Error('El cliente no existe');
            }

            if(existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos');
            }

            if(pedido) {
                for await (const articulo of existePedido.pedido) {
                    const producto = await Producto.findById(articulo.id);

                    producto.cantidad = producto.cantidad + articulo.cantidad;

                    await producto.save()
                }

                for await (const articulo of pedido) {
                    const producto = await Producto.findById(articulo.id);
    
                    if(producto.cantidad < articulo.cantidad) {
                        throw new Error(`El articulo ${producto.nombre} excede la cantidad del stock`)
                    } else {
                        producto.cantidad = producto.cantidad - articulo.cantidad;
                        await producto.save();
                    }
                } 
            }

            const resultado = await Pedido.findOneAndUpdate({_id: id}, input, {new: true})
            return resultado;
        },

        eliminarPedido: async (_, {id, cancelado}, ctx) => {
            const id_valido = mongoose.Types.ObjectId.isValid(id);

            if(!id_valido) {
                throw new Error('El pedido no existe');
            }

            const existePedido = await Pedido.findById(id);

            if(!existePedido) {
                throw new Error('El pedido no existe');
            }

            if(existePedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos');
            }

            /* await Pedido.findOneAndDelete({_id: id});

            return 'Pedido eliminado' */

            if(cancelado) {
                for await (const articulo of existePedido.pedido) {
                    const producto = await Producto.findById(articulo.id);

                    producto.cantidad = producto.cantidad + articulo.cantidad;

                    await producto.save()
                }

                await Pedido.findOneAndDelete({_id: id});

                return 'Pedido cancelado'

            } else {
                await Pedido.findOneAndDelete({_id: id});

                return 'Pedido eliminado'
            }
        }
    }
}

export default resolvers