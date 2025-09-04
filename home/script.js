        // Your Discord Client ID from the Discord Developer Portal
        const CLIENT_ID = "1408133830690209872"; // Updated from your provided index(11).html
        // The Redirect URI must EXACTLY match what's configured in your Discord OAuth2 settings
        const REDIRECT_URI = "https://pfairindia.github.io"; // Updated from your provided index(11).html

        // Discord authorization URL
        const AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;

        // Select elements
        const userActionsDiv = document.querySelector(".user-actions");
        const loginModal = document.getElementById("loginModal");
        const modalLoginButton = document.getElementById("modalLoginButton");
        const modalCreatorAlert = document.getElementById('modalCreatorAlert');
        const readInput = document.getElementById('readInput');

        /**
         * Displays user information (avatar, username) and a logout button.
         * @param {object} user - The Discord user object.
         */
        function showUser(user) {
            const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : 'https://discord.com/assets/f135b1fcd3d2c4935480d19e910540d5.png'; 
            userActionsDiv.innerHTML = `
                <div class="user-info">
                    <img src="${avatarUrl}" alt="${user.username} Avatar">
                    <span>${user.username}${user.discriminator && user.discriminator !== '0' ? `#${user.discriminator}` : ''}</span>
                </div>
                <button id="logout-btn" class="logout-button">Logout</button>
            `;

            // Attach event listener to the logout button
            document.getElementById("logout-btn").onclick = () => {
                localStorage.removeItem("discordUser"); // Clear user data from local storage
                window.location.replace(REDIRECT_URI); 
            };

            // Hide the login modal if it's currently shown
            loginModal.classList.remove("show");
        }

        /**
         * Displays the custom Discord login modal and the creator alert within it.
         */
        function showModal() { // Renamed from showLoginButton to showModal to match your provided code's usage
            // Set the modal's login button href
            modalLoginButton.href = AUTH_URL;
            // Initially disable the login button
            modalLoginButton.classList.remove('enabled');

            // Show the modal
            loginModal.classList.add("show");
            
            // Show the creator alert inside the modal after a short delay
            setTimeout(() => {
                modalCreatorAlert.classList.add('show');
            }, 500); // Show alert 0.5 seconds after modal appears

            // Clear user actions div in header
            userActionsDiv.innerHTML = '';
        }

        // Event listener for the 'read' input field
        readInput.addEventListener('input', (e) => {
            if (e.target.value.toLowerCase() === 'read') {
                modalLoginButton.classList.add('enabled');
                const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify`;
                modalLoginButton.href = discordAuthUrl;
                modalCreatorAlert.style.opacity = '0'; // Hide the alert
                modalCreatorAlert.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    modalCreatorAlert.style.display = 'none'; // Fully remove it after transition
                }, 500); 
            } else {
                modalLoginButton.classList.remove('enabled');
                modalLoginButton.href = '#';
                // Optionally, if you want the alert to reappear if they type something wrong after correct,
                // you'd add logic here to re-show it, but for now, it hides permanently.
                modalCreatorAlert.style.display = 'block'; // Make sure it's display block for transition
                setTimeout(() => { // Re-show with slight delay if needed
                    modalCreatorAlert.style.opacity = '1';
                    modalCreatorAlert.style.transform = 'translateY(0)';
                }, 10);
            }
        });

        // --- Main login state management logic from your provided index(11).html ---
        async function handleDiscordAuth() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get("access_token"); 

            const savedUser = JSON.parse(localStorage.getItem("discordUser"));

            if (token) {
                window.history.replaceState({}, document.title, REDIRECT_URI); 

                try {
                    const res = await fetch("https://discord.com/api/users/@me", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (!res.ok) {
                        console.error("Discord API error:", res.status, res.statusText);
                        localStorage.removeItem("discordUser"); 
                        showModal(); 
                        throw new Error(`Failed to fetch user data from Discord: ${res.statusText}`); 
                    }
                    const user = await res.json(); 

                    if (user.id) {
                        localStorage.setItem("discordUser", JSON.stringify(user)); 
                        showUser(user); 
                    } else {
                        console.error("Invalid Discord user data received:", user);
                        localStorage.removeItem("discordUser"); 
                        showModal(); 
                    }
                } catch (error) {
                    console.error("Error during Discord user fetch or processing:", error);
                    localStorage.removeItem("discordUser"); 
                    showModal(); 
                }
            } else if (savedUser) {
                showUser(savedUser); 
            } else {
                showModal(); 
            }
        }


        // This will run when the page loads
        window.addEventListener('load', handleDiscordAuth);

        // JavaScript for mobile menu toggle
        document.getElementById('menu-button').addEventListener('click', function() {
            const navLinks = document.getElementById('nav-links');
            navLinks.classList.toggle('hidden');
            navLinks.classList.toggle('flex');
            navLinks.classList.toggle('flex-col');
        });
