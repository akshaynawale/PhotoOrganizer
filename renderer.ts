
interface ElectronAPI {
    selectFolder: () => Promise<string | null>;
    // function exposed from the server to send log message from server to frontend
    handleLogMessage: (callback: (msg: {message: string, level: string}) => void ) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

const selectFolderBtn = document.getElementById('select-folder-button');
const logsDiv = document.getElementById('photo-organizer-logs');

// It's best practice to ensure the elements exist before adding listeners.
// This also satisfies TypeScript's null-check.
if (selectFolderBtn && logsDiv) {
    console.log("found the select button and logs div so adding listeners");
    selectFolderBtn.addEventListener('click', async () => {
        logsDiv.innerHTML += 'Requesting folder section ...<br/>';
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
            logsDiv.innerHTML += `<b> selected folder: </b> ${folderPath}<br/>`;
        } else {
            logsDiv.innerHTML += 'Folder selection was cancelled.<br/>';
        }
    });
}


// now lets add the logs from the server to the div 
if (logsDiv) {
    console.log("found logsDiv so adding a callback to the handleLogMessage function")
    window.electronAPI.handleLogMessage((msg) => {
        console.log('inside the callback function now got message: ($msg)');
        logsDiv.innerHTML += `from server: ${msg.message}<br/>`;
    })
}

// This makes the file a module and fixes the "declare global" error.
export {};
