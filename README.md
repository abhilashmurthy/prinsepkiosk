#Prinsep Kiosk Room
A system to manage the SMU Prinsep Hostel's Kiosk Room Equipment.

The system provides CRUD functionality of items and role delegation by the Hostel Management Team, Resident Seniors, and Residents

##Usage


##Development
Role management and the workflow of loaning items from the kiosk room is pretty straightforward on the website. What cannot be changed straight from the website though are:

* The members of the Hostel Management Team
* Item types ["Electronic", "Sport", "Board", "Event"]
* Item locations ["Game Shelf", "Electronics Shelf", "Window Corner", "Plug Corner", "Racks", "Floor Shelves"]

If the above have to be changed, it can be done by:

* Hostel Management Team - Add new HMT's facebook ID's into the array HMT_FACEBOOK_IDS in /server/accounts.js
* Item types - Add new items into the <select><options> in /client/prinsepkiosk.html
* Item locations - Add new locations into the <select><options> in /client/prinsepkiosk.html AND add new images of the new locations in /public/mapitems/ with file names the same as the values in the <options>

##Database
The mongodb database has to be constantly backed up in case data gets corrupted or goes missing. To conduct backups and restores, mongoDB must be installed on your PC and you must have access to ```mongodump``` and ```mongorestore``` on your shell

###Backup
To run a backup, you will need a directory on your system, where you will store your backup dumps. Let's called this BACKUPDIR. Once you have that, on your shell, run
```
meteor mongo -url prinsepkiosk.meteor.com
```

You will be supplied with credentials in the format
```
mongodb://client:PASSWORD@server:PORT/prinsepkiosk_meteor_com
```

Within 1 minute (no jokes), run the following command on your shell
```
mongodump -u client -p PASSWORD -h server:PORT -d prinsepkiosk_meteor_com -o BACKUPDIR
```

You should see a scrolling window and new files in your backup dir if the backup was successful

###Restore
To run a restore, run the following command on your shell
```
meteor mongo -url prinsepkiosk.meteor.com
```

With your credentials, within 1 minute (no seriously, go read the Meteor docs), run
```
mongorestore -u client -p PASSWORD -h server:PORT -d prinsepkiosk_meteor_com -o BACKUPDIR/prinsep_meteor_com
```

Go check prinsepkiosk.meteor.com to confirm the restore happened
