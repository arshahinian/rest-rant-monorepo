const router = require('express').Router()
const db = require("../models")
const bcrypt = require('bcrypt')
const jwt = require('json-web-token') /* FIRST ADD THIS */

const { User } = db

router.post('/', async (req, res) => {
    
    let user = await User.findOne({
        where: { email: req.body.email }
    })

    if (!user || !await bcrypt.compare(req.body.password, user.passwordDigest)) {
        res.status(404).json({
        message: `Could not find a user with the provided username and password` 
      })
    } else {
        const result = await jwt.encode(process.env.JWT_SECRET, { id: user.userId })  /* THEN ADD THIS */         
        res.json({ user: user, token: result.value }) /* LAST ADD THIS */          
    }    
})

router.get('/profile', async (req, res) => {
    try {
        let user = await User.findOne({
            where: {
                userId:0 
            }
        })
        res.json(user)
    } catch {
        res.json(null)
    }
})

module.exports = router