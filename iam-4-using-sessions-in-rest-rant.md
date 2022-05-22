Activity (iam-4-using-sessions-in-rest-rant)
https://digitalskills.instructure.com/courses/4878/pages/activity-iam-4-using-sessions-in-rest-rant?module_item_id=635917

# Using Sessions in REST-Rant
* Now that we've learned how a session can be used to remember the logged-in user, let's apply that strategy to our REST-Rant application.
* When we're finished, you should be able to log in to REST-Rant and remain logged in after refreshing the page.

## Setup
* This activity builds on the previous activities in the 'Identity & Access Management' series.
* If you can, navigate to where you've cloned down rest-rant-monorepo in two terminals and run npm start in both its front-end and back-end directories.
* If for any reason you cannot continue to build off of existing work, follow the steps in the "Quick Start Instructions" before continuing with this activity.

## 1) Make a new branch for session authentication
* Because we will be practicing JWT authentication in a future lesson, we will want to create a new branch so that we can return to the current state of the codebase at a future point in time.
* Add and commit any current changes, then run git checkout -b session-authentication in your terminal to switch to a new branch.

## Fetch the current user on page load
* Each time our React app loads, we need to check with the back end to see if we have a user already logged in.
* Open src/contexts/CurrentUser.js.
* This component provides a React context that shares the logged-in user across the application, which makes it a natural place for us to check for an already-logged-in user on page load.
* Which React tool can we use to make fetch requests when the page loads?
* * useEffect

## Import useEffect from React, then use it inside of CurrentUserProvider to make a fetch request:
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

* Now if you look in your browser console, you should see something like this:

[x] > GET http://localhost:5000/Current.User.js:13...authentication/profile 404 (Not Found)

* This error makes perfect sense, because we haven't written the route handler for this request yet.
* Let's add it to the authentication controller in our back end.

## 3) Add a request handler to the authentication controller
* Add a route handler to the authentication controller that responds to the same HTTP method and path that we specified in our above fetch request:

~~~

router.get('/profile', async (req, res) => {
   
})

~~~

* The goal of this route handler is to return the currently logged-in user.
* Since there may or may not actually be one, we'll use a try/catch statement, and send null in place of a user object in case we can't find one.
* We already have access to the User model and can use its findOne method to find a user based on their ID.
* This means the only challenge left to solve is to get the ID of the user who is logged in:

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

* This is where the session comes into play.
* Right now, we have access to the logged-in user's ID when they log in, but to still have access to it after a subsequent request, we'll need to save it in the session:

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
        res.json({ user }) <-- "We have access to the logged-in user here..."                            
    }
})

router.get('/profile', async (req, res) => {
    try {
        let user = await User.findOne({
            where: {
                userId: ***[???]*** <--- "...but not here"                  
            }
        })
        res.json(user)
    } catch {
        res.json(null)
    }
})

~~~

* Until we have the session configured, comment out the contents of our new route handler so that the missing user ID doesn't throw any syntax errors.

## 4) Configure the Express Session

* We could write a lot of code by hand to encode session data and store it in a cookie header manually, but it will be much easier to use an existing node_module to do the tedious work for us.
* Run npm install cookie-session in a back-end terminal to install the dependency, then require and configure it in your index file:

~~~

const app = express();
const cookieSession = require('cookie-session')

// Express Settings
app.use(cookieSession({
    name: 'session',
    keys: [ process.env.SESSION_SECRET ],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())

~~~

* process.env.SESSION_SECRET is undefined at the moment, but needs to be a random string that cookie-session can use to securely encrypt and decrypt session data before sending it to the browser as a cookie.

* Add a line to your .env file to define the secret (it can be any random string):

~~~

PORT=5000
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=rest_rant_auth
SESSION_SECRET=qiweuxhoiuehqmie

~~~

### Please Note:
* This secret will be used by cookie-session to ensure that your sessions are encrypted in a way that is unique to your application.

## Now that the session is configured, we'll have access to it in all of our route handlers!
* Back in the authentication controller, let's add the logged-in user's ID to the session object:

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
        req.session.userId = user.userId  <-- HERE IS THE NEW CODE!!!
        res.json({ user })
    }
})

~~~

## 5) Test the Express Session
* Before we try to use the userId from the session to query for a user, let's make sure we can access it by logging it to the terminal:

~~~

router.get('/profile', async (req, res) => {
    console.log(req.session.userId)
    try {
        // let user = await User.findOne({
        //     where: {
        //         userId: 
        //     }
        // })
        // res.json(user)
    } catch {
        res.json(null)
    }
})

~~~

* Now fill out and submit the log-in form, then refresh the page.
* * Do you see the user ID appear in your terminal?
* * * No

* * What option do we have to pass fetch so that the browser attaches session cookies to the HTTP request it makes?
* * * credentials: 'include'

* We'll add this option to a few of our fetch requests and then try this test again.

## 6) Include credentials in fetch requests
* So far, our React app is sending two fetch requests that make use of the session:

### 1) When the log-in form is submitted
* We need this request to have access to the session so that the route handler can add the userId to the session.

~~~

async function handleSubmit(e) {
    const response = await fetch(`http://localhost:5000/authentication/`, {
        method: 'POST',
        credentials: 'include', <-- HERE IS THE NEW CODE TO ADD!!!
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    })

    const data = await response.json()

~~~

### 2) When we check for the logged-in user on page load
* We need this request to have access to the session so that the route handler can read the userId from the session.

~~~

function CurrentUserProvider({ children }) {

    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {

        const getLoggedInUser = async () => {
            let response = await fetch('http://localhost:5000/authentication/profile', {
                credentials: 'include' <-- HERE IS THE NEW BLOCK OF CODE TO ADD !!!
            })
            let user = await response.json()
            setCurrentUser(user)
        }
        getLoggedInUser()
    }, [])

~~~

* At this point, you'll probably see an error that looks something like this in your console:

[x] Access to fetch at 'http: //localhost/places#:1...t:5000/authentication/profile' from origin 'http://localhost:3001' has been blocked by CORS plicy:  The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.

* Fortunately, this error only means that we have a little more configuration to do before we finally have a working session.

## 7) Configure CORS for session support

* Do you remember learning about CORS back in courses 5 and 6?
* It's short for Cross-Origin Resource Sharing, and it's a policy the browser enforces to protect against various security concerns.
* When we pass credentials: 'include' to fetch, those CORS policies get a little more strict.
* As a result, we'll need to add some more information when we configure CORS in our back-end index file.
* To confirm that our front end, which runs on http://localhost:3000, should be allowed to include credentials with its fetch requests, we'll add the following lines:

~~~

app.use(cookieSession({
    name: 'session',
    keys: [ process.env.SESSION_SECRET ],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())

~~~

#### Note:
* If you're running your React app on a different port, you'll want to replace '3000' with that port number.

#### Developer Notes:
* ARS - This is what I did.  Add HOSTPORT env variable.
~~~
app.use(cors({
    origin: `http://localhost:${process.env.HOSTPORT}`,
    credentials: true
}))
~~~

* At this point, you should be able to fill out and submit the log-in form, refresh the page, and see a user ID appear in the terminal running your back end.

## 8) Retrieve a user object based on the contents of the session
* Yay!
* We finally have the ID of the logged-in user persisting from one fetch request to the next.
* Now we can finish out the route handler we started earlier.
* We will use the ID we have saved in the session to find the logged-in user object and send it back to our React app:

~~~

router.get('/profile', async (req, res) => {
    try {
        let user = await User.findOne({
            where: {
                userId: req.session.userId  <-- NEW CODE!!!
            }
        })
        res.json(user)
    } catch {
        res.json(null)
    }
})

~~~

* At this point, you should be able to refresh the page in your browser and remain logged in. Your name should appear in the top-right corner of the navigation

## Reflect
* Keep in mind that using sessions like this is only one way to remember logged-in users.
* Another equally common approach is to use a JSON web token (JWT).
* In the next few lessons, we'll explore how JWTs work and compare them to the session strategy as we go.