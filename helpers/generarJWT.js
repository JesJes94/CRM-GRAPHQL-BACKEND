import jwt from "jsonwebtoken";

export default function generarJWT(usuario) {
    const {id, email, nombre, apellido} = usuario

    return jwt.sign({id, email, nombre, apellido}, process.env.JWT_SECRET, {
        expiresIn: '24h'
    })
}