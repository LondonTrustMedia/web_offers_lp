const fs = require('fs')
const mysql = require('mysql');

let pool

if (process.env.NODE_ENV === 'local') {

    const mysqlSsh = require('mysql-ssh');
    mysqlSsh.createPool({
        host: '45.79.174.84',
        user: 'deployer',
        privateKey: fs.readFileSync(process.env.HOME + '/.ssh/id_rsa')
    },
    {
        host: process.env.MYSQL_PRIVATELAND_URL,
        port: 3306,
        user: process.env.MYSQL_PRIVATELAND_USER,
        password: process.env.MYSQL_PRIVATELAND_PASSWORD,
        database: process.env.MYSQL_PRIVATELAND_DB
    })
    .then(conn => {
        pool = conn
    })
    
} else {
    pool = mysql.createPool({
        host: 'localhost',
        port: 3306,
        user: process.env.MYSQL_PRIVATELAND_USER,
        password: process.env.MYSQL_PRIVATELAND_PASSWORD,
        database: process.env.MYSQL_PRIVATELAND_DB
    });
}

const dbQueries = module.exports = {
    rotators: {

        getAll: function(callback){
            pool.query("SELECT * FROM rotators ORDER BY updated DESC", function (err, result) {
                if (err) callback(err);
                else {
                    result.map(rot => {
                        rot.offers = rot.offers
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
                + mysqlEscape(rotator.title) + "', '"
                + rotator.ownerId + "', '"
                + rotator.ownerName + "', '"
                + rotator.aff_id + "', '"
                + rotator.domainType + "', '"
                + mysqlEscape(JSON.stringify(rotator.offers)) + "', '"
                + rotator.updated.replace('T', ' ').replace('Z', '') + "', '"
                + rotator.totalWeight + "')"
            console.log(sql)
            pool.query(sql, function (err, result) {
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
            + "title = '" + mysqlEscape(rotator.title) + "', "
            + "ownerId = '" + rotator.ownerId + "', "
            + "ownerName = '" + rotator.ownerName + "', "
            + "aff_id = '" + rotator.aff_id + "', "
            + "domainType = '" + rotator.domainType + "', "
            + "offers = '" + mysqlEscape(JSON.stringify(rotator.offers)) + "', "
            + "updated = '" + rotator.updated.replace('T', ' ').replace('Z', '') + "', "
            + "totalWeight = '" + rotator.totalWeight + "' "
            + "WHERE id = '" + rotator.id + "'";
            pool.query(sql, function (err, result) {
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
            pool.query(sql, function (err, result) {
                if (err) callback(err);
                else {
                    console.log("1 record deleted");
                    console.log(result);
                    callback(null, result);
                }
            });
        },

        updateCache: function(callback){
            pool.query("SELECT * FROM rotators", function (err, rotators) {
                if (err) {
                    console.log(err);
                    callback(err)
                } else {
                    rotators.map(rot => {
                        rot.offers = rot.offers
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
        }
    },

    ppc_pages: {
        getAll: function(callback){
            pool.query("SELECT * FROM ppc_pages ORDER BY updated DESC", function (err, result) {
                if (err) callback(err);
                else {
                    console.log("Got all ppc_pages succesfully");
                    callback(null, result);
                }
            });
        },

        new: function(data, callback){
            const sql = "INSERT INTO ppc_pages (title, design, h1, h2, cta, lang, updated) VALUES ('" 
                + mysqlEscape(data.title) + "', '"
                + data.design + "', '"
                + mysqlEscape(data.h1) + "', '"
                + mysqlEscape(data.h2) + "', '"
                + mysqlEscape(data.cta) + "', '"
                + data.lang + "', '"
                + data.updated.replace('T', ' ').replace('Z', '') + "')"
            console.log(sql)
            pool.query(sql, function (err, result) {
                if (err) callback(err);
                else {
                    console.log("1 record inserted");
                    console.log(result);
                    callback(null, result.insertId);
                }
            });
        },

        edit: function(data, callback){
            const sql = "UPDATE ppc_pages SET "
            + "title = '" + mysqlEscape(data.title) + "', "
            + "design = '" + data.design + "', "
            + "h1 = '" + mysqlEscape(data.h1) + "', "
            + "h2 = '" + mysqlEscape(data.h2) + "', "
            + "cta = '" + mysqlEscape(data.cta) + "', "
            + "lang = '" + data.lang + "', "
            + "updated = '" + data.updated.replace('T', ' ').replace('Z', '') + "' "
            + "WHERE id = '" + data.id + "'";
            pool.query(sql, function (err, result) {
                if (err) callback(err);
                else {
                    console.log("1 record updated");
                    console.log(result);
                    callback(null, result);
                }
            });
        },
        
        delete: function(id, callback){
            const sql = "DELETE FROM ppc_pages WHERE id = '" + id + "'"
            pool.query(sql, function (err, result) {
                if (err) callback(err);
                else {
                    console.log("1 record deleted");
                    console.log(result);
                    callback(null, result);
                }
            });
        },

        updateCache: function(callback){
            pool.query("SELECT * FROM ppc_pages", function (err, ppc_pages) {
                if (err) {
                    console.log(err);
                    callback(err)
                } else {
                    console.log("Got all ppc_pages succesfully");
                    console.log('ppc_pages.length', ppc_pages.length)
                    callback(null, ppc_pages)
                    fs.writeFile( __dirname + '/../json/ppc_pages.json', JSON.stringify(ppc_pages, null, 4), 'utf8', (err) => {
                    })
                }
            });
        }           
    }
}


function mysqlEscape (str) {
    return str.replace(/[\']/g, '\\\'')
}