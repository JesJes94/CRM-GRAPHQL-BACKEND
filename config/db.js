import mongoose from "mongoose";

const conectarDB = async () => {
 try {
    const connection = await mongoose.connect(process.env.MONGO_DB_URL);
    const url = `${connection.connection.host} ${connection.connection.port}`
    console.log(`Mongo DB conectado en ${url}`);
 } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
 }
}

export default conectarDB