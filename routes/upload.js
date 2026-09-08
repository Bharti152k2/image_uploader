import express from 'express'
import multer from 'multer'
import cloudinary from '../config/cloudinary.js'
import Image from '../models/Image.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// Wraps Cloudinary's stream-based upload API in a Promise so we can await it.
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'Nodejs_Mastery' },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(buffer)
  })
}

// Home page — shows the upload form + a gallery of everything uploaded so far
router.get('/', async (req, res, next) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 })
    res.render('index.ejs', { url: null, error: null, images })
  } catch (err) {
    next(err)
  }
})

// Handle the upload
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return next(err) // catches Multer errors (too big, wrong type)

    try {
      if (!req.file) {
        const images = await Image.find().sort({ createdAt: -1 })
        return res.render('index.ejs', { url: null, error: 'Please choose a file first.', images })
      }

      const result = await uploadBufferToCloudinary(req.file.buffer)

      await Image.create({
        filename: req.file.originalname, // bug fix: was file.originalname, which was undefined
        public_id: result.public_id,
        imgUrl: result.secure_url,
      })

      const images = await Image.find().sort({ createdAt: -1 })
      res.render('index.ejs', { url: result.secure_url, error: null, images })
    } catch (err) {
      next(err)
    }
  })
})

// Delete an image from both Cloudinary and MongoDB
router.post('/delete/:id', async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id)
    if (image) {
      await cloudinary.uploader.destroy(image.public_id)
      await image.deleteOne()
    }
    res.redirect('/')
  } catch (err) {
    next(err)
  }
})

export default router
