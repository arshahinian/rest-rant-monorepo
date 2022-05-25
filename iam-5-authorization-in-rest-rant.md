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