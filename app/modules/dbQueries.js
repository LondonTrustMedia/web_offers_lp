const fs = require('fs')

const dbQueries = module.exports = function(db){
    return {

        getAll: function(callback){
            db.query("SELECT * FROM rotators ORDER BY updated DESC", function (err, result) {
                if (err) callback(err);
                else {
                    result.map(rot => {
                        rot.offers = JSON.parse(rot.offers)
                        return rot
                    });
                    console.log("Got all rotators succesfully");
                    callback(null, result);
                }
            });
        },

        new: function(rotator, callback){
            const sql = "INSERT INTO rotators (id, title, ownerId, ownerName, aff_id, domainType, offers, updated, totalWeight) VALUES ('" 
                + rotator.id + "', '"
                + rotator.title.replace(/[\']/g, '\\\'') + "', '"
                + rotator.ownerId + "', '"
                + rotator.ownerName + "', '"
                + rotator.aff_id + "', '"
                + rotator.domainType + "', '"
                + JSON.stringify(rotator.offers).replace(/[\']/g, '\\\'') + "', '"
                + rotator.updated.replace('T', ' ').replace('Z', '') + "', '"
                + rotator.totalWeight + "')"
            console.log(sql)
            db.query(sql, function (err, result) {
                if (err) callback(err);
                else {
                    console.log("1 record inserted");
                    console.log(result);
                    callback(null, result);
                }
            });
        },

        edit: function(rotator, callback){
            const sql = "UPDATE rotators SET "
            + "title = '" + rotator.title.replace(/[\']/g, '\\\'') + "', "
            + "ownerId = '" + rotator.ownerId + "', "
            + "ownerName = '" + rotator.ownerName + "', "
            + "aff_id = '" + rotator.aff_id + "', "
            + "domainType = '" + rotator.domainType + "', "
            + "offers = '" + JSON.stringify(rotator.offers).replace(/[\']/g, '\\\'') + "', "
            + "updated = '" + rotator.updated.replace('T', ' ').replace('Z', '') + "', "
            + "totalWeight = '" + rotator.totalWeight + "' "
            + "WHERE id = '" + rotator.id + "'";
            db.query(sql, function (err, result) {
                if (err) callback(err);
                else {
                    console.log("1 record updated");
                    console.log(result);
                    callback(null, result);
                }
            });
        },
        
        delete: function(id, callback){
            const sql = "DELETE FROM rotators WHERE id = '" + id + "'"
            db.query(sql, function (err, result) {
                if (err) callback(err);
                else {
                    console.log("1 record deleted");
                    console.log(result);
                    callback(null, result);
                }
            });
        },

        updateCache: function(callback){
            db.query("SELECT * FROM rotators", function (err, rotators) {
                if (err) {
                    console.log(err);
                    callback(err)
                } else {
                    rotators.map(rot => {
                        rot.offers = JSON.parse(rot.offers)
                        return rot
                    });
                    console.log("Got all rotators succesfully");
                    let newRotatorsList = {}
                    rotators.forEach(rotator => {
                        newRotatorsList[rotator.id] = rotator
                    });
                    console.log('rotators.length', rotators.length)
                    callback(null, newRotatorsList)
                    fs.writeFile( __dirname + '/../json/rotators.json', JSON.stringify(newRotatorsList, null, 4), 'utf8', (err) => {
                    })
                }
            });
        },
    }
}