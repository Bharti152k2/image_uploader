import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import uploadRoutes from './routes/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Connect to MongoDB
connectDB()

// View engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.use('/', uploadRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).render('index.ejs', { url: null, error: 'Page not found', images: [] })
})

// Central error handler (multer errors, cloudinary errors, etc. all land here)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render('index.ejs', {
    url: null,
    error: err.message || 'Something went wrong. Please try again.',
    images: [],
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
