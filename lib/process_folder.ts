import { dialog } from "electron";
import { promises as fs } from 'fs';


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
        const folderPath = filePaths[0];
        console.log(`Selected folder: ${folderPath}`);

        try {
            const files = await fs.readdir(folderPath);
            console.log("Files in the folder:");
            files.forEach(file => {
                console.log(file);
            });
        } catch (err) {
            console.error('Error reading folder:', err);
        }
        return folderPath;
    }
}