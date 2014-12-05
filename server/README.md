# Download files from Google Drive

There are two ways of doing it:

1. Use the Eclipse plugin

https://developers.google.com/eclipse/docs/apps_script

2. Use Chrome to login, then browse to this page:

https://script.google.com/feeds/download/export?format=json&id=<file_id>

It will download everything as "one" JSON. Now run

node split.js <the_JSON>

will split the JSON into multiple files that can be used to check-in.
