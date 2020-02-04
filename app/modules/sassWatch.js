const path = require("path");
const fs = require("fs");
const fsPromise = require("fs").promises;
const scssPages = "assets/scss/pages/";
const cssPages = "assets/css/";
// const scssAmpPages = "assets/scss/amp/pages/";
// const cssAmpPages = "assets/css/amp/";
var spawn = require('child_process').spawn

const getPages = (amp) => {
    return new Promise((resolve, reject) => {
        let dirPath, pages = []
        if (!amp)
            dirPath = path.join(process.cwd(), scssPages);
        else
            dirPath = path.join(process.cwd(), scssAmpPages);
        
        fsPromise.readdir(dirPath)
            .then(files => {
                files.forEach(file => {
                  pages.push(file.split(".")[0]);
                });
                pages = pages.filter(page => page !== "_index");
                resolve(pages);
            }).catch(err => {
                console.log("Unable to scan directory: " + err);
                reject(err);

            })

    })
}

// const createEJS = (cssFile) => {
//     console.log('creating EJS')
//     let content = fs.readFileSync(cssFile, 'utf8');
//     content = content.replace(/(\/\*\#\ sourceMappingURL)+(.+)+(\*\/)/, '')
//     fs.writeFileSync(cssFile.replace('.css', '.ejs'), content, 'utf8');
//     fs.unlinkSync(cssFile);
//     fs.unlinkSync(cssFile + '.map');
// }

const watchAll =  async () => {

    try {
        const pages = await getPages(amp = false)
        // const ampPages = await getPages(amp = true)
        let args = ['--style', 'compressed', '--watch']

        // console.log('pages', pages)
        // console.log('ampPages', ampPages)

        pages.forEach(page => {
            args.push(scssPages + page + ".scss:" + cssPages + page + ".css")
          });

        // ampPages.forEach(page => {
        //     args.push(scssAmpPages + page + ".scss:" + cssAmpPages + page + ".css")
        // });

        const watch = spawn('sass', args)
        
        watch.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);

            data = data.toString()
            // console.log('|' + data + '|');
            // let cssFile = null 
            if ( data.includes(' to '))
                cssFile = process.cwd() + '/' + data.split(' to ')[1].replace(/\.[ \t\s]+$/, '')
            else if ( data.includes('write '))
                cssFile = process.cwd() + '/' + data.replace('write ', '').replace(/[\ \t\s]/g, '')

            // console.log('|' + cssFile + '|')
            // console.log(fs.existsSync(cssFile))
            // if (cssFile !== null && cssFile.includes('/amp/') && !cssFile.includes('.css.map') && fs.existsSync(cssFile)) {
            //     console.log('AMP file ------>')
            //     createEJS(cssFile)

            // }
        });
        
        watch.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        
        watch.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

    } catch (err) {
        throw err
    }
};

watchAll()