'use strict';

let fs = require('fs');

let dirname,  filename = process.argv[2] ;

// 1. read the command line args
// 2. console log if the folder exists, else create folder with files.
// 3. create all the files -> process[2].js, process[2].test.js, process[2].css

if(filename !== undefined){
    if(filename[0] !== filename[0].toUpperCase()){
        filename = filename.charAt(0).toUpperCase() + filename.slice(1);
        dirname = filename ; 
    }
    if (!fs.existsSync(dirname)){
        fs.mkdirSync(dirname);
        fs.writeFileSync(`${dirname}/${filename}.js`);
        fs.writeFileSync(`${dirname}/${filename}.test.js`);
        fs.writeFileSync(`${dirname}/${filename}.css`);
    }else{
        console.log("Component already exists!");
    }
}else{
    console.log('Please provide Component name!');
}


