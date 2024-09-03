// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCe5HpgY1k0jIApAk35Y8XTs135QcQ7eFc",
    authDomain: "portalpikudoref.firebaseapp.com",
    projectId: "portalpikudoref",
    storageBucket: "portalpikudoref.appspot.com",
    messagingSenderId: "734287793118",
    appId: "1:734287793118:web:c4b15bef07a51abb29eb4f",
    measurementId: "G-NJ8PF8Y8GZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Load sidebar JSON file and display sidebar items
fetch('/data/sidebar.json')
    .then(response => response.json())
    .then(data => {
        const sidebarContainer = document.querySelector('.sidebar ul');
        sidebarContainer.innerHTML = ''; // Clear existing content
        data.items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item.name;
            listItem.addEventListener('click', () => {
                loadPage(item.pageId); // Load the corresponding page
            });
            sidebarContainer.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error loading sidebar:', error);
    });

// Load JSON file and display circles
fetch('/data/circles.json')
    .then(response => response.json())
    .then(data => {
        const circleContainer = document.getElementById('circle-container');
        data.circles.forEach(item => { // Access 'circles' array
            const circleItem = document.createElement('div');
            circleItem.className = 'circle-item';
            circleItem.innerHTML = `
                <div class="circle">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <p class="circle-name">${item.name}</p>
            `;
            circleItem.addEventListener('click', () => {
                checkAuth(() => loadPage(item.name)); // Pass the pageId to loadPage after authentication
            });
            circleContainer.appendChild(circleItem);
        });
    })
    .catch(error => {
        console.error('Error loading circles:', error);
    });

// Check Authentication
function checkAuth(callback) {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Fetch user permissions from Firestore
                const userRef = doc(db, 'permissions', user.uid);
                getDoc(userRef)
                    .then((docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const userPermissions = docSnapshot.data().allowedCircles;
                            
                            // Check if the user is disallowed
                            if (userPermissions.includes("disallowed")) {
                                alert('No permissions added for this user.');
                                resolve(user);
                            } else {
                                // If "disallowed" is not present, proceed with checking permissions
                                if (callback) callback(userPermissions);
                                resolve(user);
                            }
                        } else {
                            // If no document exists, create one with "disallowed" as the first item in allowedCircles
                            setDoc(userRef, { allowedCircles: ["disallowed"] })
                                .then(() => {
                                    alert('No permissions added for this user.');
                                    resolve(user);
                                })
                                .catch((error) => {
                                    console.error('Error creating user permissions document:', error);
                                    reject();
                                });
                        }
                    })
                    .catch((error) => {
                        console.error('Error fetching permissions:', error);
                        reject();
                    });
            } else {
                // No user is signed in, prompt for sign-in
                const provider = new GoogleAuthProvider();
                signInWithPopup(auth, provider)
                    .then(result => {
                        alert('User signed in: ' + result.user.displayName);
                        // Create a new document in the 'permissions' collection for the signed-in user with "disallowed"
                        const userRef = doc(db, 'permissions', result.user.uid);
                        setDoc(userRef, { allowedCircles: ["disallowed"] })
                            .then(() => {
                                console.log('Permissions document created for user:', result.user.uid);
                                checkAuth(callback).then(resolve).catch(reject);
                            })
                            .catch((error) => {
                                console.error('Error creating permissions document:', error);
                                reject();
                            });
                    })
                    .catch(error => {
                        console.error('Error signing in:', error);
                        reject();
                    });
            }
        });
    });
}


function loadPage(pageId) {
    checkAuth((userPermissions) => {
        if (userPermissions.includes(pageId)) {
            document.getElementById('circle-container').innerHTML = '';
            loadPageContent(pageId);
        } else {
            alert('You do not have permission to access this page.');
        }
    });
}

// Load page content dynamically from Firestore
function loadPageContent(pageId) {
    const pageRef = doc(db, "pages", pageId);
    getDoc(pageRef).then((docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('page-title').textContent = data.title;
            document.getElementById('page-content').innerHTML = data.content;
            // Update other parts of the page as needed
        } else {
            console.error("No such document!");
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
}
