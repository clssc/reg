/**
 * @fileoverview Google Apps Script DocsList
 * @see https://developers.google.com/apps-script/reference/docs-list/docs-list
 */



/**
 * @constructor
 * @struct
 * @noalias
 */
function DocsList() {}


/** @const {number} */
DocsList.prototype.DEFAULT_RESULT_SIZE;


/** @type {TFileType} */
DocsList.prototype.FileType;


/** @const {number} */
DocsList.prototype.MAX_RESULT_SIZE;


/**
 * @param {BlobSource|string} arg1
 * @param {string=} opt_arg2
 * @param {string=} opt_arg3
 * @return {File}
 */
DocsList.prototype.createFile;


/**
 * @param {string} name
 * @return {Folder}
 */
DocsList.prototype.createFolder;


/**
 * @param {string} query
 * @return {!Array.<!File>}
 */
DocsList.prototype.query;


/**
 * @param {string} query
 * @param {number} number
 * @param {string=} opt_token
 * @return {FilesResult}
 */
DocsList.prototype.findForPaging;


/** @return {!Array.<!File>} */
DocsList.prototype.getAllFiles;


/**
 * @param {number} number
 * @param {string=} opt_token
 * @return {FilesResult}
 */
DocsList.prototype.getAllFilesForPaging;


/** @return {!Array.<!Folder>} */
DocsList.prototype.getAllFolders;


/**
 * @param {number} number
 * @param {string=} opt_token
 * @return {FoldersResult}
 */
DocsList.prototype.getAllFoldersForPaging;


/**
 * @param {string} id
 * @return {File}
 */
DocsList.prototype.getFileById;


/**
 * @param {TFileType} fileType
 * @return {!Array.<!File>}
 */
DocsList.prototype.getFilesByType;


/**
 * @param {TFileType} fileType
 * @param {number} number
 * @param {string=} opt_token
 * @return {FilesResult}
 */
DocsList.prototype.getFilesByTypeForPaging;


/**
 * @param {string} path
 * @return {Folder}
 */
DocsList.prototype.getFolder;


/**
 * @param {string} id
 * @return {Folder}
 */
DocsList.prototype.getFolderById;


/** @return {Folder} */
DocsList.prototype.getRootFolder;
