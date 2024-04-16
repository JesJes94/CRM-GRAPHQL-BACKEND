import { ApolloServer } from "apollo-server";

import typeDefs from "./db/schema.js";
import resolvers from "./db/resolvers.js";
import conectarDB from "./config/db.js";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";

//server

dotenv.config();

conectarDB();

const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context: ({req}) => {
        
        const token = req.headers['authorization'] || '';

        if(token) {
            try {
                const usuario = jwt.verify(token.split('Bearer ')[1], process.env.JWT_SECRET)

                return {
                    usuario
                } 
                
            } catch (error) {
                console.log('Hubo un error')
                console.log(error)
            }
        }
    }
});

//arrancar el server

server.listen({port: process.env.PORT || 4000}).then( ({url}) => {
    console.log(`Servidor listo en la ${url}`)
})