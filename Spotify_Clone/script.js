let currentSong = new Audio();
let songs = [];
let currFolder = ''; // Folder path will be updated when albums are selected

// Function to convert seconds to minutes:seconds format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "invalid input";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to fetch songs from the selected folder
async function getSongs(folder) {
    console.log("📂 Fetching songs from folder:", folder);
    let response = await fetch(`${folder}/songs.json`);
    let songList = await response.json(); // Should be an array of filenames
    
    songs = songList;
    
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    songs.forEach(song => {
        songUL.innerHTML += `<li>
            <img src="assets/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
                <div>song artist</div>
            </div>
        </li>`;
    });
    
    

    // Attach an event listener to each song
    console.log("list agayi");
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML);
            console.log("click");
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });

        document.querySelector(".playbar").style.transition="bottom 0.2s ease-in-out"
        document.querySelector(".playbar").style.bottom="0"
    });
    return songs;
}

// Play the selected song
const playMusic = (track) => {
    const encodedTrack = encodeURIComponent(track.trim());
    const songPath = `songs/${currFolder}/${encodedTrack}`;
    console.log("Song path:", songPath);  // Log the path to ensure it's correct
    currentSong.src = songPath;
    currentSong.play();
    
    // // Clean up and set a fresh 'play' event listener
    // currentSong.removeEventListener("play", updatePlayIcon); // prevent duplicate
    // currentSong.addEventListener("play", updatePlayIcon);


    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    document.querySelectorAll(".songList ul li").forEach(li => {
        const songName = li.querySelector(".info").firstElementChild.textContent.trim();
        if (songName === track.trim()) {
            li.classList.add("active-song");
        } else {
            li.classList.remove("active-song");
        }
    });
};

function updatePlayIcon() {
    let playButton = document.querySelector(".playbar .playbtn img");
    playButton.src = "assets/pause.svg";
}

// Display album cards
async function displayAlbums() {
    let res = await fetch('songs/albums.json');
    let albumList = await res.json(); // this should be an array of folder names

    let cardContainer = document.querySelector(".cardContainer");

    for (let folder of albumList) {
        try {
            let infoRes = await fetch(`songs/${folder}/info.json`);
            let info = await infoRes.json();

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="playbtn">
                        <img src="assets/play-button.svg" alt="playbutton">
                    </div>
                    <img src="songs/${folder}/cover.jpg" alt="cover">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>
            `;
        } catch (error) {
            console.error(`Error loading album "${folder}":`, error);
        }
    }

    // Add event listener for each card
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            currFolder = item.currentTarget.dataset.folder; // Set the current folder
            console.log("Selected folder:", currFolder);

            // Fetch songs for the selected folder
            console.log("Fetching Songs for folder:", currFolder);
            songs = await getSongs(`songs/${currFolder}`);
            console.log("Songs fetched:", songs);
            

            // If songs are found, auto play the first one
            if (songs.length > 0) {
                playMusic(songs[0]);  // Play the first song of the folder
            }
            document.querySelector("playbar").style.bottom="0"
            
          
            let playButton= document.querySelector(".playbar .playbtn img")
           

            // to change the play/pause on card select
            if(currentSong.paused){
                playButton.src="assets/pause.svg"
            }
            else{
                playButton.src="assets/play.svg"
            }
        });
    });

    
}


// Update song list for the clicked folder
function updateSongList(songs) {
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; // Clear previous song list

    // Loop through the songs and create list items
    songs.forEach(song => {
        let li = document.createElement("li");
        li.innerHTML = `
            <img src="assets/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>song artist</div>
            </div>
        `;
        songUL.appendChild(li);

        // Add click event to each song
        li.addEventListener("click", () => {
            console.log("Clicked song:", song);
            playMusicFromFolder(song);
        });
    });
}

// Play music for the selected song
function playMusicFromFolder(song) {
    console.log("Clicked song:", song);
    if (!currFolder) {
        console.log("No folder selected.");
        return;
    }

    // Construct the correct song path
    let songPath = `songs/${currFolder}/${song}`;
    console.log("Song Path:", songPath);  // Log the path to ensure it's correct

    // Play the song
    playMusic(song);
}

// Main function
async function main() {
    // Display all the albums
    await displayAlbums();

    // Add event listener for next and previous song
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "assets/pause.svg";
        } else {
            currentSong.pause();
            play.src = "assets/play.svg";
        }
    });

    // Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Trigger seekbar update immediately when the song starts playing
    currentSong.addEventListener("play", () => {
        updateSeekbar(); // Update seekbar when the song starts
    });

    // Add event listener for seekbar click
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;

        // Move the circle
        document.querySelector(".circle").style.left = percent + "%";

        // Update the current song time
        currentSong.currentTime = (currentSong.duration * percent) / 100;

        // Change the background color of the seekbar based on percentage
        e.target.style.background = `linear-gradient(to right, #4caf50 ${percent}%, #d3d3d3 ${percent}%)`;
    });

    // Update seekbar background and circle automatically as the song plays
    currentSong.addEventListener("timeupdate", () => {
        updateSeekbar(); // Keep updating seekbar as the song plays
    });

    // Function to update the seekbar and circle position
    function updateSeekbar() {
        let percent = (currentSong.currentTime / currentSong.duration) * 100;

        // Update the background color of the seekbar to show the progress
        document.querySelector(".seekbar").style.background = `linear-gradient(to right, rgb(19, 42, 20) ${percent}%, #d3d3d3 ${percent}%)`;

        // Move the circle based on the song's current progress
        document.querySelector(".circle").style.left = percent + "%";
    }

    // Adding event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Event for previous and next song
    previous.addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentFile);

        if (index > 0) {
            playMusic(songs[index - 1]);
            let playButton = document.querySelector(".playbar .playbtn img");
            playButton.src = "assets/pause.svg";
        }
    });

    next.addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentFile);

        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
            let playButton = document.querySelector(".playbar .playbtn img");
            playButton.src = "assets/pause.svg";
        }
        
    });

    //  to play next song automatically
currentSong.addEventListener("ended", () => {
    let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
    let index = songs.indexOf(currentFile);

    // If the current song is not the last song, play the next song
    if (index < songs.length - 1) {
        playMusic(songs[index + 1]);  // Play the next song in the list
        let playButton = document.querySelector(".playbar .playbtn img");
        playButton.src = "assets/pause.svg";    
    }
    else {
        console.log("Reached the end of the playlist.");
        // Optionally, you can loop back to the first song or stop the player.
    }
    playButton.src = "assets/pause.svg";
});


    // Adding event listener for volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Mute button functionality
    document.querySelector(".volume>img").addEventListener("click", e => {
        const volumeInput = document.querySelector(".range input");

        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            volumeInput.value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            volumeInput.value = 10;
        }
    });
}

main();
