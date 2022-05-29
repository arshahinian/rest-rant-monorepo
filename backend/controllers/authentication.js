const router = require('express').Router()
const db = require("../models")
const bcrypt = require('bcrypt')

const { User } = db

router.post('/', async (req, res) => {
    
    let user = await User.findOne({
        where: { email: req.body.email }
    })

    if (!user){
        res.status(404).json({ 
            message: `Could not find a user with the provided username and password` 
        })
    } 
    else if(!await bcrypt.compare(req.body.password, user.passwordDigest)) {
        res.status(401).json({ 
            message: `Password did not match the existing password stored for the user.` 
        })
    } else {
        req.session.userId = user.userId
        res.json({ user })
    }
})

router.get('/profile', async (req, res) => {
    console.log("backend - controller - authentication - get - profile")
    let reqCurrentUser = req.currentUser;
    if(reqCurrentUser != undefined)
    {
        console.log(reqCurrentUser)
        res.json(reqCurrentUser)
    }    
})

module.exports = router