/**
 * @fileoverview Google Apps Script DocumentApp
 * @see https://developers.google.com/apps-script/reference/document/document-app
 */



/**
 * @constructor
 * @struct
 * @noalias
 */
function DocumentApp() {}


/** @type {TAttribute} */
DocumentApp.prototype.Attribute;


/** @type {TElementType} */
DocumentApp.prototype.ElementType;


/** @type {TFontFamily} */
DocumentApp.prototype.FontFamily;


// TODO(arthurhsu): GlyphType
// TODO(arthurhsu): HorizontalAlignment
// TODO(arthurhsu): ParagraphHeading
// TODO(arthurhsu): TextAlignment
// TODO(arthurhsu): VerticalAlignment


/**
 * @param {string} name
 * @return {Document}
 */
DocumentApp.prototype.create;


/** @return {Document} */
DocumentApp.prototype.getActiveDocument;


/** @return {Ui} */
DocumentApp.prototype.getUi;


/**
 * @param {string} id
 * @return {Document}
 */
DocumentApp.prototype.openById;


/**
 * @param {string} url
 * @return {Document}
 */
DocumentApp.prototype.openByUrl;
