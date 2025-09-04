
interface ElectronAPI {
    selectFolder: () => Promise<string | null>;
    // function exposed from the server to send log message from server to frontend
    handleLogMessage: (callback: (msg: { message: string, level: string }) => void) => void;
    // show proposal 
    showProposal: (callback: (proposal: string) => void) => void;
    // apply proposal 
    applyProposal: (proposal: string) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

const selectFolderBtn = document.getElementById('select-folder-button');
const applyProposalBtn = document.getElementById('apply-proposal');
const logsDiv = document.getElementById('photo-organizer-logs');
const proposalDiv = document.getElementById('photo-organizer-proposal');


// It's best practice to ensure the elements exist before adding listeners.
// This also satisfies TypeScript's null-check.
if (selectFolderBtn && logsDiv) {
    console.log("found the select button and logs div so adding listeners");
    selectFolderBtn.addEventListener('click', async () => {
        logsDiv.innerHTML += 'Requesting folder section ...<br/>';
        await window.electronAPI.selectFolder();
    });
}


// now lets add the logs from the server to the div 
if (logsDiv) {
    console.log("found logsDiv so adding a callback to the handleLogMessage function")
    window.electronAPI.handleLogMessage((msg) => {
        console.log('inside the callback function now got message: ($msg)');
        logsDiv.innerHTML += msg.message;
    })
}

if (applyProposalBtn && logsDiv) {
    console.log("found apply proposal button adding listener");
    applyProposalBtn.addEventListener('click', async () => {
        logsDiv.innerHTML += "Applying proposal ...<br>";
        window.electronAPI.applyProposal("proposal");
    })
}


if (proposalDiv) {

    window.electronAPI.showProposal((proposalJSON) => {
        console.log(`inside the callback function now got message: ${proposalJSON}`);
        const proposal = JSON.parse(proposalJSON);
        let html = "<ul>";
        for (const year in proposal["videos"]) {
            html += `<li><b>${year}</b>: ${proposal["videos"][year].join(', ')}</li>`;
        }
        for (const year in proposal["images"]) {
            html += `<li><b>${year}</b>: ${proposal["images"][year].join(', ')}</li>`;
        }
        html += "</ul>";
        proposalDiv.innerHTML = `Proposal:<br/>${html}`;

        // make the apply proposal button unhidden
        if (applyProposalBtn) {
            applyProposalBtn.hidden = false;
        }

    });
}


// This makes the file a module and fixes the "declare global" error.
export { };
