import mongoose from 'mongoose'

export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'Image_Uploader',
    })
    console.log('MongoDB connected...')
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }
}
