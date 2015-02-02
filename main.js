var ExifImage = require('exif').ExifImage,
	fs = require('fs.io').file,
	moment = require('moment'),
	path = require('path'),
	config,
	DOB,
	q = require('q'),
	dict = require('fs.io').directory;


function getFiles(root){
	return dict.getFiles(root, "**/*.jpg").then(function(files){
		var result = [], def = q.defer();
		files.forEach(function(fileName){
			result.push(path.join(root, fileName));
		});
		setTimeout(function(){
			def.resolve(result);
		},20);
		return def.promise;
	});
}


function copyFile(filePath){
	new ExifImage({image:filePath}, function(err, exifData){
		if(err){
			console.error(err);
		}else{
			var createDate = moment(exifData.exif.CreateDate);
			var m = createDate.diff(DOB,'months');
			if(m<0){//生日前的图片不需要处理
				return;
			}
			var destPath = path.join(config.dest, "出生"+(m+1)+"月");
			dict.createDirectory(destPath)
				.then(function(destFolder){
					var dest = path.join(destFolder, path.basename(filePath));
					file.move(filePath, dest);
				});
		}
	});
}

function getAllFiles(){
	var operations = config.paths.map(getFiles);

	return q.all(operations)
}


function start(){
	fs.readAllText('config.json').then(function(txt){
		config = JSON.parse(txt);
		DOB = moment(config.DOB);
		startProcess();
	})
}

function startProcess(){
	getAllFiles().done(function(results){
		var allFiles = [];
		results.forEach(function(files){
			allFiles = allFiles.concat(files);
		});
		console.log(allFiles);
		allFiles.forEach(function(filePath){
			copyFile(filePath);
		})
	});

}


start();