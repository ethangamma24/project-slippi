import SlippiGame from 'slp-parser-js';
import {
  LOAD_ROOT_FOLDER, CHANGE_FOLDER_SELECTION, STORE_SCROLL_POSITION, RENAME_FILE
} from '../actions/fileLoader';

const fs = require('fs');
const path = require('path');
const electronSettings = require('electron-settings');

// Default state for this reducer
const defaultState = {
  rootFolderName: "",
  selectedFolderFullPath: "",
  folders: {},
  files: [],
  playingFile: null,
  scrollPosition: {
    x: 0,
    y: 0,
  },
  oldName: "",
  newName: "",
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
  case LOAD_ROOT_FOLDER:
    return loadRootFolder(state, action);
  case CHANGE_FOLDER_SELECTION:
    return changeFolderSelection(state, action);
  case STORE_SCROLL_POSITION:
    return storeScrollPosition(state, action);
    case RENAME_FILE:
  return renameFile(state, action);
  default:
    return state;
  }
}

function loadRootFolder(state) {
  const rootFolder = electronSettings.get('settings.rootSlpPath');
  if (!rootFolder) {
    return state;
  }

  const files = fs.readdirSync(rootFolder);

  const rootFolderBasename = path.basename(rootFolder);

  // Filter for folders in the root folder
  const subDirectories = files.map((file) => {
    const fullPath = path.join(rootFolder, file);
    return {
      fullPath: fullPath,
      folderName: file,
      pathArr: [rootFolderBasename, file],
      expanded: true,
      subDirectories: {},
    };
  }).filter(folderDetails => (
    fs.lstatSync(folderDetails.fullPath).isDirectory()
  ));

  const folders = {};
  folders[rootFolderBasename] = {
    fullPath: rootFolder,
    folderName: rootFolderBasename,
    pathArr: [rootFolderBasename],
    expanded: false,
    subDirectories: subDirectories,
  };

  // Maintain selection if there is one and it is for a loaded sub-directory
  const subDirectoriesByFullPath = _.keyBy(subDirectories, 'fullPath') || {};
  let previouslySelectedFolderFullPath = null;
  if (subDirectoriesByFullPath[state.selectedFolderFullPath]) {
    previouslySelectedFolderFullPath = state.selectedFolderFullPath;
  }

  const folderSelection = previouslySelectedFolderFullPath || rootFolder;

  // Select the root folder
  const newState = changeFolderSelection(state, {
    payload: {
      folderPath: folderSelection,
    },
  });

  // Combine the state we got from selecting a folder
  return {
    ...newState,
    rootFolderName: rootFolderBasename,
    folders: folders,
  };
}

function changeFolderSelection(state, action) {
  const folderPath = action.payload.folderPath;
  let files = fs.readdirSync(folderPath) || [];

  // Filter for all .slp files
  files = files.filter(file => (
    path.extname(file) === ".slp"
  ));

  // Compute header information for display
  files = files.map((file) => {
    const fullPath = path.join(folderPath, file);
    const game = new SlippiGame(fullPath);

    // Pre-load settings here
    game.getSettings();
    game.getMetadata();

    return {
      fullPath: fullPath,
      fileName: file,
      game: game,
    };
  });

  return {
    ...state,
    selectedFolderFullPath: folderPath,
    files: files,
  };
}

function storeScrollPosition(state, action) {
  return {
    ...state,
    scrollPosition: action.payload.position,
  };

}

function closeModal() {
  const newState = { ...state };
  newState.fileToEdit = null;
  return newState;
}