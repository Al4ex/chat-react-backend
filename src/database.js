    import mongoose from 'mongoose'

    export const connectDB = async () => {
        try {
            const db = await mongoose.connect(process.env.MONGODB_URI)
            console.log("Conectado a Mongo:", db.connection.name)
        } catch (error) {
            console.log(error)
        }
    }