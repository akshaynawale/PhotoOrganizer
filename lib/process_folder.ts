import { dialog } from "electron";


/**
 * handleFolderOpen function is called when the dialog:openDirectory is send from the renderer
 * this function runs on the server
 */
export async function handleFolderOpen() {
    console.log("inside handle Open funciton"); 
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (canceled || filePaths.length === 0) {
        console.log('User cancelled folder selection');
        return null;
    } else {
        console.log(`Selected folder: ${filePaths[0]}`);
        return filePaths[0];
    }
}