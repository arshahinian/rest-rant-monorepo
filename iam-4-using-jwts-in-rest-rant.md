* Cybersecurity --> Pages --> Activity (iam-4-using-jwts-in-rest-rant)
* Activity (iam-4-using-jwts-in-rest-rant)
* SD09 Cybersecurity | Identity & Access Management

# Using JWTs in REST-Rant
* Before we continue to improve REST-Rant by using our authenticated user, let's backtrack just a bit and learn how we would implement authentication using JSON web tokens (JWTs) instead of sessions.

## Setup
* This activity builds on the previous activities in the 'Identity & Access Management' series.
* If you can, navigate to where you've cloned down rest-rant-monorepo in two terminals, and run npm start in both its front-end and back-end directories.
* If for any reason you cannot continue to build off of existing work, follow the steps in the "Quick Start Instructions" before continuing with this activity.

## 1) Make a new branch for JWT authentication
* If you are still currently on a branch where you have implemented session authentication, add and commit your changes, then switch back to the main branch by running git checkout main.
* Now we'll make a new branch to implement JWT authentication: git checkout -b jwt-authentication.

## 1) Fetch the current user on page load
* Like before, we'll need to check with the back end to see if we have a logged-in user each time our React app loads.
* Open src/contexts/CurrentUser.js and use useEffect to send a fetch request like we did in the previous lesson:

~~~

function CurrentUserProvider({ children }) {

    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {

        const getLoggedInUser = async () => {
            let response = await fetch('http://localhost:5000/authentication/profile')
            let user = await response.json()
            setCurrentUser(user)
        }
        getLoggedInUser()
    }, [])
  
~~~

##  2) Add a request handler to the authentication controller
* Next, let's add the route handler to respond to that fetch request:

~~~

router.get('/profile', async (req, res) => {
    try {
        let user = await User.findOne({
            where: {
                userId: ***[???]***
            }
        })
        res.json(user)
    } catch {
        res.json(null)
    }
})

~~~

* All of the logic so far is exactly the same as we wrote for session authentication:
* Each time the React app loads, the front end will ask the server if there's a logged-in user.
* * If there is a logged-in user, the back end responds with that information.
* * * If there's not, the back end responds with null.
* * Just like before, we have access to the logged-in user's ID when they log in, but don't have access to it after a subsequent request:

~~~

router.post('/', async (req, res) => {
    
    let user = await User.findOne({
        where: { email: req.body.email }
    })

    if (!user || !await bcrypt.compare(req.body.password, user.passwordDigest)) {
        res.status(404).json({ 
            message: `Could not find a user with the provided username and password` 
        })
    } else {
        res.json({ user }) /* Web have access to the logged-in user here ... " */                                       
    }
})

router.get('/profile', async (req, res) => {
    try {
        let user = await User.findOne({
            where: {
                userId: 0 /* ... but not here */               
            }
        })
        res.json(user)
    } catch {
        res.json(null)
    }
})

~~~

* This time, however, instead of finding the logged-in user's ID in the session, our back end will check a JWT, which we expect the front end to send in its fetch request.
* Until we have the JWT in our request, comment out the contents of our new route handler so that the missing user ID doesn't throw any syntax errors.

## 3) Create a JWT on log in
* In order to request the logged-in user, our front end will need to receive a JWT when the user logs in.
* Recall the analogy from our previous lesson.
* When our front end sends a request to log in to our API, it is similar to when a guest checks in at a Disney resort.
* When the back end responds with a JWT, it is similar to Disney furnishing their guest with a wrist band that they can use to verify the guest's identity later.
* To create a JWT, we'll install yet another npm package: npm install json-web-token.
* Then we'll make the following changes to our authentication controller:

~~~

const router = require('express').Router()
const db = require("../models")
const bcrypt = require('bcrypt')
const jwt = require('json-web-token')  /* FIRST ADD THIS (Not 'jwt'!) */         

if (!user || !await bcrypt.compare(req.body.password, user.passwordDigest)) {
    res.status(404).json({
    message: `Could not find a user with the provided username and password` 
  })
} else {
	const result = await jwt.encode(process.env.JWT_SECRET, { id: user.userId })  /* THEN ADD THIS */         
    res.json({ user: user, token: result.value }) /* LAST ADD THIS */          
   }
})

~~~

1. Near the top of the authentication controller, we'll require the npm package we installed.
2. In the route handler that handles log in, if the user has been found and their password matches, we'll use the jwt module to create a JWT.
* * The first argument we're passing, jwt.encode, is a random string for jwt to use to hash the token signature.
* * * Like the SESSION_SECRET, we'll need to add this to our .env file.
* * The second argument we're passing, jwt.encode, is an object to encode as the payload. These are the data we will be able to check later to find the logged-in user.
3. When we respond to the front end, we send both the authenticated user and the JWT we created.
* Before we go any further, let's add the JWT_SECRET to our .env file:

~~~

PORT=5000
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=rest_rant_auth
SESSION_SECRET=qiweuxhoiuehqmie                                     
JWT_SECRET=qiweuxhoiuehqmie

~~~

## 4) Save the JWT in localStorage
Now that our API is sending a JWT when a user logs in, let's see if we can console.log it in our React app:

~~~
    /* Login Form */

    async function handleSubmit(e) {
    const response = await fetch(`http://localhost:5000/authentication/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    })

    const data = await response.json()

    if (response.status === 200) {
        setCurrentUser(data.user)
        console.log(data.token) /* Code being added */
        history.push(`/`)
    } else {
        setErrorMessage(data.message)
    }

~~~

* Next, fill out and submit the log-in form, then check the console in the Chrome DevTools.
* * Was the JWT logged?
* * * Yes

* Now that we can access the JWT in our React app, let's save it in localStorage so that we can send it with future fetch requests.

~~~

    /* Login Form */


    async function handleSubmit(e) {
    const response = await fetch(`http://localhost:5000/authentication/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    })

    const data = await response.json()

    if (response.status === 200) {
        setCurrentUser(data.user)
        localStorage.setItem('token', data.token) /* Code being changed from console.log */
        history.push(`/`)
    } else {
        setErrorMessage(data.message)
    }


~~~

## 5) Include the JWT in fetch requests
* Let's open src/contexts/CurrentUser.js and review the fetch request that is meant to retrieve the logged-in user on page load.
* When we were implementing session authentication, we needed to pass credentials: 'include' to fetch so that the browser would attach a cookie to the request.
* * Then our back end could use the cookie to find the user who was logged in.
* This time, we'll manually attach the JWT to our fetch request, and our back end will look at that to find the user who is logged in.
* * Which part of an HTTP request seems most appropriate to contain the JWT?
* * * The headers

* So let's add an Authorization header:

~~~

function CurrentUserProvider({ children }) {

    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {

        const getLoggedInUser = async () => {
            let response = await fetch('http://localhost:5000/authentication/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            let user = await response.json()
            setCurrentUser(user)
        }
        getLoggedInUser()
    }, [])

~~~

* Note that we've prepended the word "Bearer" to the JWT here.
* This is not really required for the authentication to work, but it is conventional when sending authorization tokens to an API.

## 6) Retrieve a user object based on the contents of the JWT
* Now, in our authentication controller, we just need to extract the JWT from the request headers and decode it to get the ID of the logged-in user:

~~~

router.get('/profile', async (req, res) => {
    try {
        // Split the authorization header into [ "Bearer", "TOKEN" ]:
        const [authenticationMethod, token] = req.headers.authorization.split(' ')

        // Only handle "Bearer" authorization for now 
        //  (we could add other authorization strategies later):
        if (authenticationMethod == 'Bearer') {

            // Decode the JWT
            const result = await jwt.decode(process.env.JWT_SECRET, token)

            // Get the logged in user's id from the payload
            const { id } = result.value

            // Find the user object using their id:
            let user = await User.findOne({
                where: {
                    userId: id
                }
            })
            res.json(user)
        }
    } catch {
        res.json(null)
    }
})

~~~

* At this point, you should be able to refresh the page in your browser and remain logged in.
* Your name should be visible in the top-right corner of the navigation.

## Reflect
* So far, we've practiced two ways of implementing authentication for a React front end and Express API.
* In the lessons to follow, we will move our focus to authorization.
* When we're done, users will only be able to delete their own comments, and only specific users will be able to add or edit places.
* As we continue to build out REST-Rant, you may use either the session-authentication or jwt-authentication branches as you see fit.
* Now that we have a way of authenticating the logged-in user, the authorization logic we write can be written identically, whether we are using a session or a JWT.