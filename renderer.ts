
interface ElectronAPI {
    selectFolder: () => Promise<string | null>;
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

// This makes the file a module and fixes the "declare global" error.
export {};
