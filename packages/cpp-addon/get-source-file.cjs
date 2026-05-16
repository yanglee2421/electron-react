/**
 * 根据平台返回对应的源文件路径
 */
const platform = process.platform;

let sourceFile;
if (platform === 'win32') {
  sourceFile = './src/hello.cpp';
} else if (platform === 'darwin') {
  sourceFile = './src/hello_macos.cpp';
} else {
  sourceFile = './src/hello_linux.cpp';
}

console.log(sourceFile);
