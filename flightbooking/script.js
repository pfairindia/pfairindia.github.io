// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAdN6__6BSVsaS6K3F0qcF8ThnGH3r0GcM",
    authDomain: "airindiavirtualpf.firebaseapp.com",
    projectId: "airindiavirtualpf",
    storageBucket: "airindiavirtualpf.firebasestorage.app",
    messagingSenderId: "418511928890",
    appId: "1:418511928890:web:3eeab7ba6c5312d9f4bf03",
    measurementId: "G-VRB609NTRL"
};
 
// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
 
// --- Globals from Canvas ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfigFromCanvas = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let db;
let auth;
let userId = null;

// Initialize Firebase
function initializeFirebase() {
    try {
        app = initializeApp(firebaseConfigFromCanvas);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Firebase initialized successfully.");

        // Sign in with custom token or anonymously
        if (initialAuthToken) {
            signInWithCustomToken(auth, initialAuthToken).catch((error) => {
                console.error("Custom token sign-in failed, signing in anonymously.", error);
                signInAnonymously(auth).catch((anonError) => {
                    console.error("Anonymous sign-in failed.", anonError);
                });
            });
        } else {
            signInAnonymously(auth).catch((error) => {
                console.error("Anonymous sign-in failed.", error);
            });
        }

        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                console.log("Firebase user authenticated with UID:", userId);
            } else {
                userId = null;
                console.log("Firebase user is signed out.");
            }
        });

    } catch (e) {
        console.error("Error initializing Firebase:", e);
        alert("Error initializing Firebase. See console for details.");
    }
}
 
// Function to update the navbar with Discord user info
function updateNavbarUser() {
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const savedUser = JSON.parse(localStorage.getItem('discordUser'));
    
    if (savedUser) {
        const avatarUrl = savedUser.avatar ? `https://cdn.discordapp.com/avatars/${savedUser.id}/${savedUser.avatar}.png` : 'https://discord.com/assets/f135b1fcd3d2c4935480d19e910540d5.png';
        userAvatar.src = avatarUrl;
        userName.textContent = savedUser.username;
    } else {
        userAvatar.src = 'https://via.placeholder.com/48';
        userName.textContent = 'Guest';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    updateNavbarUser();

    const flightBookingForm = document.getElementById('flightBookingForm');
    const submitBookingBtn = document.getElementById('submitBookingBtn');
    const discordLoginMessage = document.getElementById('discordLoginMessage');
    const discordUsernameHidden = document.getElementById('discordUsernameHidden');
    
    const messageBoxOverlay = document.getElementById('messageBoxOverlay');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxCloseButton = document.getElementById('messageBoxCloseButton');

    // List of airports
    const airports = [
        'Punta Cana', 'Cibao', 'Gran Canarias', 'Larnaca', 'Gatwick', 'Menorca', 'Kittila'
    ];

    function populateAirportSelects() {
        const originSelect = document.getElementById('origin');
        const destinationSelect = document.getElementById('destination');
        
        airports.forEach(airport => {
            const option1 = document.createElement('option');
            option1.value = airport;
            option1.textContent = airport;
            originSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = airport;
            option2.textContent = airport;
            destinationSelect.appendChild(option2);
        });
    }

    function setFormEnabled(enabled) {
        const formElements = flightBookingForm.querySelectorAll('input, select, button');
        formElements.forEach(el => {
            if (el.type !== 'submit') {
                el.disabled = !enabled;
            }
        });
        submitBookingBtn.disabled = !enabled;
        if (enabled) {
            discordLoginMessage.classList.add('hidden');
        } else {
            discordLoginMessage.classList.remove('hidden');
        }
    }

    function showMessageBox(title, message) {
        messageBoxTitle.textContent = title;
        messageBoxText.textContent = message;
        messageBoxOverlay.style.display = 'flex';
    }

    function hideMessageBox() {
        messageBoxOverlay.style.display = 'none';
    }

    // Initial check for Discord user
    const savedUser = JSON.parse(localStorage.getItem('discordUser'));
    if (savedUser) {
        discordUsernameHidden.value = savedUser.username;
        setFormEnabled(true);
    } else {
        setFormEnabled(false);
    }

    populateAirportSelects();
    
    // Validation and Form Submission
    flightBookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        const departureDate = document.getElementById('departureDate').value;
        const returnDate = document.getElementById('returnDate').value;
        const passengers = document.getElementById('passengers').value;

        if (origin === destination) {
            showMessageBox("Invalid Selection", "Origin and Destination cannot be the same.");
            return;
        }

        if (!discordUsernameHidden.value) {
            showMessageBox("Login Required", "You must be logged in with Discord to submit a booking.");
            return;
        }
        
        const bookingData = {
            userId: discordUsernameHidden.value,
            origin,
            destination,
            departureDate,
            returnDate: returnDate || 'N/A',
            passengers: parseInt(passengers, 10),
            bookingTimestamp: new Date().toISOString()
        };

        try {
            // Get a reference to the bookings collection
            // The path is /artifacts/{appId}/public/data/flight_bookings
            const bookingsCollectionPath = `/artifacts/${appId}/public/data/flight_bookings`;
            const bookingsRef = collection(db, bookingsCollectionPath);
            
            // Add the new booking document to Firestore
            await addDoc(bookingsRef, bookingData);
            
            showMessageBox("Booking Confirmed!", "Your flight booking has been successfully submitted. Thank you for choosing Air India Virtual!");
            flightBookingForm.reset();
            updateNavbarUser(); // Update navbar after form submission
        } catch (error) {
            console.error('Error submitting booking:', error);
            showMessageBox("Submission Failed", "There was an error submitting your booking. Please try again later.");
        }
    });

    // Close message box when button is clicked
    messageBoxCloseButton.addEventListener('click', hideMessageBox);
    // Close message box if clicking outside the content
    messageBoxOverlay.addEventListener('click', (event) => {
        if (event.target === messageBoxOverlay) {
            hideMessageBox();
        }
    });
});
