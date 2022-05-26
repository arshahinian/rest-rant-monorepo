* Cybersecurity --> Pages --> Activity-Session (iam-5-authorization-in-rest-rant)
* Activity- Session (iam-5-authorization-in-rest-rant)
* SD09 Cybersecurity | Identity & Access Management

# Activity: Rest-Rant Comments With Authentication
* NOTE: This is the session version of this activity. There is also a JWT version; you only need to complete one.
* Now that REST-Rant has a logged-in user remembered using session authentication, we'll begin to use that logged-in user to implement authorization.
* By the end of the activity, you should be able to:
* Only leave a comment when logged in, and automatically be attributed as the author of the comment without having to select an author from a dropdown list.
* Only delete comments that you created as a logged-in user.

## Setup
* This activity builds on the previous activities in the 'Identity & Access Management' series.
* If you can, navigate to where you've cloned down rest-rant-monorepo in two terminals and run npm start in both its front-end and back-end directories.
* If for any reason you cannot continue to build off of existing work, follow the steps in the "Quick Start Instructions" before continuing with this activity.

## 1) Make sure you're on the correct branch
* If you are still currently on a branch where you have implemented JWT authentication, add and commit your changes, then switch back to the session branch by running git checkout session-authentication.

## 2) Remove the author dropdown list from the NewCommentForm
* Open front end/src/places/NewCommentForm.js.
* * What is the purpose of the authors array created with 'useState'?
* * * It holds an array of all authors for a user to choose from when creating a comment.
* * What property of the new comment does the author dropdown list modify?
* * * authorId (userId)
* * Is there anything keeping a user from submitting a comment as another user?
* * * No

* Rather than allowing users to submit comments as any user they select, it would be more secure (and more convenient) to automatically attach the ID of the logged-in user to the authorId for any comments that are created.
* * Where should we write the code that defines a comment's 'authorId' as the ID of the logged-in user?
* * * The back end

* Since we know we want to associate a new comment with the logged-in user on our back end, we can remove the author dropdown list and the author array we've kept in state from the NewCommentForm completely.

* Remove the dropdown list and view the NewCommentForm on the place details page to ensure that it is gone before moving forward.

## 3) Attach the logged-in user as a comment author
* Now that the author dropdown list has been removed, let's associate newly created comments with the logged-in user on the back end.
* * Where in our back end should we write code to associate newly created comments with logged-in users?
* * * The controllers

* Open backend/controllers/places.js and find the route handler for adding a comment.
* We'll need access to the logged-in user here, so let's copy the code from the authentication controller, which finds a logged-in user based on the session:

~~~

router.post('/:placeId/comments', async (req, res) => {
    const placeId = Number(req.params.placeId)

    req.body.rant = req.body.rant ? true : false

    const place = await Place.findOne({
        where: { placeId: placeId }
    })

    if (!place) {
        return res.status(404).json({ message: `Could not find place with id "${placeId}"` })
    }

    let currentUser;
    try {
        currentUser = await User.findOne({
            where: {
                userId: req.session.userId
            }
        })
    } catch {
        currentUser = null;
    }

    const comment = await Comment.create({
        ...req.body,
        placeId: placeId
    })

    res.send({
        ...comment.toJSON(),
        author: currentUser
    })
})

~~~

* Now that we have the logged-in user, all we have to do is attach their ID as the authorId of the comment:

~~~

    const comment = await Comment.create({
        ...req.body,
        authorId: currentUser.userId, /* NEW CODE HERE */
        placeId: placeId
    })

    res.send({
        ...comment.toJSON(),
        author: currentUser
    })
})

~~~

* Of course, this could throw an error if a user tried to create a comment without being logged in.
* Let's use an IF statement and respond with an error if the user's not logged in:

~~~

    if (!currentUser) {
        return res.status(404).json({
            message: `You must be logged in to leave a rand or rave.`
        })
    }

    const comment = await Comment.create({
        ...req.body,
        authorId: currentUser.userId,
        placeId: placeId
    })

    res.send({
        ...comment.toJSON(),
        author: currentUser
    })
})

~~~

* One last step we need to take is to include the session cookie when making the fetch request that creates a new comment.
* If we skip this step, the request that our route handler receives won't have the session to reference, so it will appear to our back end as if the user isn't logged in even though they are.
* You can find the fetch request in src/places/PlaceDetails.js and add credentials: 'include', just as we've done in previous lessons:

~~~

async function createComment(commentAttributes) {
    const response = await fetch(`http://localhost:5000/places/${place.placeId}/comments`, {
        method: 'POST',
        credentials: 'include', /* HERE IS THE CODE TO ADD */
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentAttributes)
    })

    const comment = await response.json()

    setPlace({
        ...place,
        comments: [
            ...place.comments,
            comment
        ]
    })

}

~~~

* At this point, you should be able to:
1. Fill out and submit the log-in form (if you're not already logged in).
2. Go to the details page for a place.
3. Create a new comment for that place.
4. See that you are automatically listed as the author of the comment.
* This is awesome! We're using the authentication we built in the prior lessons to make our application more convenient and secure to use.
* However, this did add quite a bit of bloat to our our route handler for creating a comment, and if we had to copy that bloat to every route handler that needs to access the logged-in user, it would result in some pretty unwieldy code.
* So let's pause for a moment and refactor that code into one place using some middleware.